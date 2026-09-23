import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getActiveSession,
  startSession,
  endSession,
  type AdminSession,
} from '@/lib/firebase/sessions'
import { signOut } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { generateUUID } from '@/lib/uuid'

const ID_KEY          = 'ts_session_id'
const USER_KEY        = 'ts_session_user'
const STARTED_KEY     = 'ts_session_started'
const LAST_ACTIVE_KEY = 'ts_session_last_activity'

/** 30 minutes in milliseconds. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000

/** Max ms to wait for a Firestore conflict-check before proceeding anyway. */
const CONFLICT_CHECK_TIMEOUT = 1000

function getStored(key: string): string | null {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function setStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function removeStored(key: string): void {
  try {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export type SelectResult =
  | { status: 'ok'; session: AdminSession }
  | { status: 'blocked'; blocking: AdminSession }

interface SessionContextValue {
  currentUser: string | null
  activeSession: AdminSession | null
  loading: boolean
  select: (user: string) => Promise<SelectResult>
  end: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue>({
  currentUser: null,
  activeSession: null,
  loading: false,
  select: async () => ({ status: 'ok', session: {} as AdminSession }),
  end: async () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  // Check if existing session has already timed out (30 mins inactivity)
  const initialExpired = (() => {
    const lastActiveStr = getStored(LAST_ACTIVE_KEY)
    if (!lastActiveStr) return false
    const lastActive = parseInt(lastActiveStr, 10)
    return Date.now() - lastActive > IDLE_TIMEOUT_MS
  })()

  if (initialExpired && getStored(USER_KEY)) {
    const id = getStored(ID_KEY)
    if (id) void endSession(id)
    removeStored(USER_KEY)
    removeStored(ID_KEY)
    removeStored(STARTED_KEY)
    removeStored(LAST_ACTIVE_KEY)
  }

  // Initialise synchronously from storage so In-Session card is permanently present on refresh
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (initialExpired) return null
    return getStored(USER_KEY)
  })

  const [activeSession, setActiveSession] = useState<AdminSession | null>(() => {
    if (initialExpired) return null
    const user = getStored(USER_KEY)
    const id = getStored(ID_KEY)
    const startedAt = getStored(STARTED_KEY)
    if (user) {
      return {
        id: id || generateUUID(),
        user,
        startedAt: startedAt || new Date().toISOString(),
        endedAt: null,
        active: true,
      }
    }
    return null
  })

  const [loading, setLoading] = useState(
    isFirebaseConfigured && !getStored(USER_KEY),
  )

  const lastActivityRef = useRef<number>(Date.now())

  // Update activity timestamp in memory and throttled in storage
  const recordActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    setStored(LAST_ACTIVE_KEY, String(now))
  }, [])

  // Sync background Firestore session if needed
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    // If already stored and active, touch activity timestamp
    if (getStored(USER_KEY)) {
      setStored(LAST_ACTIVE_KEY, String(Date.now()))
      setLoading(false)
    }

    let cancelled = false
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 4000)
    const storedId = getStored(ID_KEY)

    getActiveSession()
      .then((session) => {
        if (cancelled) return
        if (session) {
          if (!storedId || session.id === storedId) {
            setStored(USER_KEY, session.user)
            setStored(ID_KEY, session.id)
            setStored(STARTED_KEY, session.startedAt)
            setCurrentUser(session.user)
            setActiveSession(session)
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) { clearTimeout(timeout); setLoading(false) }
      })

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const end = useCallback(async () => {
    const storedId = getStored(ID_KEY)
    if (storedId) {
      try { await endSession(storedId) } catch { /* best-effort */ }
    }
    removeStored(ID_KEY)
    removeStored(USER_KEY)
    removeStored(STARTED_KEY)
    removeStored(LAST_ACTIVE_KEY)
    setCurrentUser(null)
    setActiveSession(null)
  }, [])

  // 30-Minute Idle Session Auto-End Monitor
  useEffect(() => {
    if (!currentUser) return

    // Record initial activity
    recordActivity()

    // Activity event listeners
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const handleUserEvent = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        recordActivity()
      }, 5000)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((evt) => window.addEventListener(evt, handleUserEvent, { passive: true }))

    // Periodic check every 15s to detect if 30 minutes has elapsed
    const interval = setInterval(async () => {
      const storedLast = getStored(LAST_ACTIVE_KEY)
      const last = storedLast ? parseInt(storedLast, 10) : lastActivityRef.current
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        console.warn('[SessionContext] 30 minute idle timeout triggered. Ending session.')
        clearInterval(interval)
        await end()
        try { await signOut() } catch { /* ignore */ }
        window.location.href = '/admin/login?reason=idle_timeout'
      }
    }, 15000)

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer)
      clearInterval(interval)
      events.forEach((evt) => window.removeEventListener(evt, handleUserEvent))
    }
  }, [currentUser, recordActivity, end])

  const select = useCallback(async (user: string): Promise<SelectResult> => {
    // 1. Race Firestore conflict-check against a short timeout — don't block UI.
    let existing: AdminSession | null = null
    try {
      existing = await Promise.race<AdminSession | null>([
        getActiveSession(),
        new Promise<null>((res) => setTimeout(() => res(null), CONFLICT_CHECK_TIMEOUT)),
      ])
    } catch {
      // If Firestore is unreachable, skip conflict check and proceed.
    }
    if (existing) {
      setActiveSession(existing)
      return { status: 'blocked', blocking: existing }
    }

    const nowIso = new Date().toISOString()
    const nowMs = String(Date.now())

    // 2. Write user to storage immediately so it survives any re-renders or page refreshes.
    setStored(USER_KEY, user)
    setStored(STARTED_KEY, nowIso)
    setStored(LAST_ACTIVE_KEY, nowMs)
    setCurrentUser(user)

    // 3. Create the Firestore session record (best-effort — never blocks access).
    const localId = generateUUID()
    let finalId: string = localId
    try {
      finalId = await startSession(user)
    } catch (err) {
      console.warn('[SessionContext] Firestore session write failed (non-blocking):', err)
    }
    setStored(ID_KEY, finalId)

    const session: AdminSession = {
      id: finalId,
      user,
      startedAt: nowIso,
      endedAt: null,
      active: true,
    }
    setActiveSession(session)
    return { status: 'ok', session }
  }, [])

  return (
    <SessionContext.Provider value={{ currentUser, activeSession, loading, select, end }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
