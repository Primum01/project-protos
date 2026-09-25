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
  subscribeActiveSession,
  subscribeToSessionDoc,
  updateSessionHeartbeat,
  SESSION_MAX_INACTIVITY_MS,
  type AdminSession,
} from '@/lib/firebase/sessions'
import { signOut } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { generateUUID } from '@/lib/uuid'
import { clearAdminStorage, tabStorage } from '@/lib/storage'

const ID_KEY          = 'ts_session_id'
const USER_KEY        = 'ts_session_user'
const STARTED_KEY     = 'ts_session_started'
const LAST_ACTIVE_KEY = 'ts_session_last_activity'

/** Idle timeout in milliseconds (30 minutes). */
export const IDLE_TIMEOUT_MS = SESSION_MAX_INACTIVITY_MS

// Clear any legacy session data lingering in localStorage from older builds
try {
  localStorage.removeItem(ID_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(STARTED_KEY)
  localStorage.removeItem(LAST_ACTIVE_KEY)
} catch {
  /* ignore storage access restrictions */
}

function getStored(key: string): string | null {
  return tabStorage.get(key)
}

function setStored(key: string, value: string): void {
  tabStorage.set(key, value)
}

function removeStored(key: string): void {
  tabStorage.remove(key)
  try {
    localStorage.removeItem(key)
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
  evictedReason: string | null
  select: (user: string, force?: boolean) => Promise<SelectResult>
  end: () => Promise<void>
  dismissEviction: () => void
}

const SessionContext = createContext<SessionContextValue>({
  currentUser: null,
  activeSession: null,
  loading: false,
  evictedReason: null,
  select: async () => ({ status: 'ok', session: {} as AdminSession }),
  end: async () => {},
  dismissEviction: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  // Check if existing session has already timed out
  const initialExpired = (() => {
    const lastActiveStr = getStored(LAST_ACTIVE_KEY)
    if (!lastActiveStr) return false
    const lastActive = parseInt(lastActiveStr, 10)
    return Date.now() - lastActive > IDLE_TIMEOUT_MS
  })()

  if (initialExpired && getStored(USER_KEY)) {
    const id = getStored(ID_KEY)
    if (id) void endSession(id, 'Inactivity timeout')
    removeStored(USER_KEY)
    removeStored(ID_KEY)
    removeStored(STARTED_KEY)
    removeStored(LAST_ACTIVE_KEY)
    clearAdminStorage()
  }

  // Initialise tab-scoped session credentials (never persistent in Local Storage)
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (initialExpired) return null
    return getStored(USER_KEY)
  })

  const [activeSession, setActiveSession] = useState<AdminSession | null>(null)
  const [evictedReason, setEvictedReason] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured)

  const lastActivityRef = useRef<number>(Date.now())

  const recordActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    setStored(LAST_ACTIVE_KEY, String(now))
  }, [])

  const dismissEviction = useCallback(() => {
    setEvictedReason(null)
  }, [])

  const end = useCallback(async () => {
    const storedId = getStored(ID_KEY)
    if (storedId) {
      try {
        await endSession(storedId)
      } catch {
        /* best-effort */
      }
    }
    removeStored(ID_KEY)
    removeStored(USER_KEY)
    removeStored(STARTED_KEY)
    removeStored(LAST_ACTIVE_KEY)
    clearAdminStorage()
    setCurrentUser(null)
    setActiveSession(null)
  }, [])

  // 1. Global real-time active session listener
  // Keeps track of the single active session in Firestore across the entire system.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsub = subscribeActiveSession((liveSession) => {
      setActiveSession(liveSession)
      setLoading(false)

      const storedId = getStored(ID_KEY)

      if (storedId) {
        // If this client holds a session, verify it matches the active session in Firestore
        if (!liveSession || liveSession.id !== storedId || !liveSession.active) {
          console.warn('[SessionContext] Active session in Firestore has ended or been replaced.')
          removeStored(ID_KEY)
          removeStored(USER_KEY)
          removeStored(STARTED_KEY)
          removeStored(LAST_ACTIVE_KEY)
          clearAdminStorage()
          setCurrentUser(null)

          const reason = liveSession?.terminatedBy
            ? `Your session was ended because ${liveSession.terminatedBy} started a session.`
            : 'Your admin session was ended because another session was started or it timed out.'
          setEvictedReason(reason)
        }
      } else {
        // CRITICAL INVARIANT:
        // If this browser tab does NOT have a local session ID, UNDER NO CIRCUMSTANCE
        // do we adopt another user's active session!
        // currentUser MUST remain null so this user is gated at SessionSelect.
        if (currentUser) {
          setCurrentUser(null)
        }
      }
    })

    return () => unsub()
  }, [currentUser])

  // 2. Real-time listener on OUR specific session document (immediate eviction on remote termination)
  useEffect(() => {
    const storedId = getStored(ID_KEY)
    if (!isFirebaseConfigured || !storedId || !currentUser) return

    const unsub = subscribeToSessionDoc(storedId, (docSession) => {
      if (!docSession || !docSession.active) {
        console.warn('[SessionContext] Our session document was deactivated in Firestore.')
        removeStored(ID_KEY)
        removeStored(USER_KEY)
        removeStored(STARTED_KEY)
        removeStored(LAST_ACTIVE_KEY)
        clearAdminStorage()
        setCurrentUser(null)

        const reason = docSession?.terminatedBy
          ? `Your session was ended because ${docSession.terminatedBy} started a new session.`
          : 'Your admin session was ended.'
        setEvictedReason(reason)
      }
    })

    return () => unsub()
  }, [currentUser])

  // 3. Heartbeat monitor: Ping Firestore every 60 seconds while active
  useEffect(() => {
    const storedId = getStored(ID_KEY)
    if (!isFirebaseConfigured || !storedId || !currentUser) return

    // Initial heartbeat
    void updateSessionHeartbeat(storedId)

    const heartbeatInterval = setInterval(() => {
      void updateSessionHeartbeat(storedId)
    }, 60000)

    return () => clearInterval(heartbeatInterval)
  }, [currentUser])

  // 4. Inactivity & Idle Session Auto-End Monitor
  useEffect(() => {
    if (!currentUser) return

    recordActivity()

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

    const interval = setInterval(async () => {
      const storedLast = getStored(LAST_ACTIVE_KEY)
      const last = storedLast ? parseInt(storedLast, 10) : lastActivityRef.current
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        console.warn('[SessionContext] 30 minute idle timeout triggered. Ending session.')
        clearInterval(interval)
        await end()
        clearAdminStorage()
        try {
          await signOut()
        } catch {
          /* ignore */
        }
        window.location.href = '/admin/login?reason=idle_timeout'
      }
    }, 15000)

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer)
      clearInterval(interval)
      events.forEach((evt) => window.removeEventListener(evt, handleUserEvent))
    }
  }, [currentUser, recordActivity, end])

  // 5. Select & Start a Session
  // Enforces single active session rule. If an active session exists and force is false, blocks entry.
  const select = useCallback(async (user: string, force = false): Promise<SelectResult> => {
    // Check Firestore for any currently active session
    let existing: AdminSession | null = null
    try {
      existing = await getActiveSession()
    } catch {
      /* ignore */
    }

    const storedId = getStored(ID_KEY)

    // If another session is active and user didn't force termination, block
    if (existing && existing.active && existing.id !== storedId && !force) {
      setActiveSession(existing)
      return { status: 'blocked', blocking: existing }
    }

    // If forcing or replacing, explicitly terminate the old session first
    if (existing && existing.id !== storedId) {
      try {
        await endSession(existing.id, user)
      } catch (err) {
        console.warn('[SessionContext] Error ending previous session:', err)
      }
    }

    const nowIso = new Date().toISOString()
    const nowMs = String(Date.now())

    // Start single new session in Firestore
    let finalId = generateUUID()
    try {
      finalId = await startSession(user)
    } catch (err) {
      console.warn('[SessionContext] Firestore startSession failed:', err)
    }

    // Persist to ephemeral tab storage (sessionStorage only)
    setStored(USER_KEY, user)
    setStored(ID_KEY, finalId)
    setStored(STARTED_KEY, nowIso)
    setStored(LAST_ACTIVE_KEY, nowMs)

    setCurrentUser(user)
    setEvictedReason(null)

    const session: AdminSession = {
      id: finalId,
      user,
      startedAt: nowIso,
      endedAt: null,
      active: true,
      lastHeartbeat: nowIso,
    }
    setActiveSession(session)

    return { status: 'ok', session }
  }, [])

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        activeSession,
        loading,
        evictedReason,
        select,
        end,
        dismissEviction,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
