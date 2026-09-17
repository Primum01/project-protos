import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getActiveSession,
  startSession,
  endSession,
  type AdminSession,
} from '@/lib/firebase/sessions'
import { isFirebaseConfigured } from '@/lib/firebase/config'

const ID_KEY   = 'ts_session_id'
const USER_KEY = 'ts_session_user'

/** Max ms to wait for a Firestore conflict-check before proceeding anyway. */
const CONFLICT_CHECK_TIMEOUT = 1000

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
  // Initialise synchronously from sessionStorage — no async needed if already set
  const [currentUser, setCurrentUser] = useState<string | null>(
    () => sessionStorage.getItem(USER_KEY),
  )
  const [activeSession, setActiveSession] = useState<AdminSession | null>(null)
  // Only show the Firestore loading spinner if we DON'T already have a stored user
  const [loading, setLoading] = useState(
    isFirebaseConfigured && !sessionStorage.getItem(USER_KEY),
  )

  useEffect(() => {
    // If we already have a user from sessionStorage, skip the Firestore check entirely
    if (!isFirebaseConfigured || sessionStorage.getItem(USER_KEY)) {
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 5000)
    const storedId = sessionStorage.getItem(ID_KEY)

    getActiveSession()
      .then((session) => {
        if (cancelled) return
        setActiveSession(session)
        if (session && session.id === storedId) {
          sessionStorage.setItem(USER_KEY, session.user)
          setCurrentUser(session.user)
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) { clearTimeout(timeout); setLoading(false) }
      })

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

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

    // 2. Write user to sessionStorage immediately so it survives any re-renders.
    sessionStorage.setItem(USER_KEY, user)
    setCurrentUser(user)

    // 3. Create the Firestore session record (best-effort — never blocks access).
    const localId = crypto.randomUUID() as string
    let finalId: string = localId
    try {
      finalId = await startSession(user)
    } catch (err) {
      console.warn('[SessionContext] Firestore session write failed (non-blocking):', err)
    }
    sessionStorage.setItem(ID_KEY, finalId)

    const session: AdminSession = {
      id: finalId,
      user,
      startedAt: new Date().toISOString(),
      endedAt: null,
      active: true,
    }
    setActiveSession(session)
    return { status: 'ok', session }
  }, [])

  const end = useCallback(async () => {
    const storedId = sessionStorage.getItem(ID_KEY)
    if (storedId) {
      try { await endSession(storedId) } catch { /* best-effort */ }
    }
    sessionStorage.removeItem(ID_KEY)
    sessionStorage.removeItem(USER_KEY)
    setCurrentUser(null)
    setActiveSession(null)
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
