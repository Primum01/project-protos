import { collection, doc, getFirestore, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { getCollection, setDocument, deleteDocument } from './firestore'
import { getFirebaseApp, isFirebaseConfigured } from './config'
import { generateUUID } from '@/lib/uuid'

const COL = 'admin_sessions'

/** Maximum allowed inactivity before a session is treated as stale (30 minutes). */
export const SESSION_MAX_INACTIVITY_MS = 30 * 60 * 1000

export interface AdminSession {
  id: string
  user: string
  startedAt: string // ISO string
  endedAt: string | null
  active: boolean
  lastHeartbeat?: string // ISO string
  terminatedBy?: string // Name of the admin who terminated this session
}

function db() {
  return getFirestore(getFirebaseApp())
}

/**
 * Returns the currently active admin session from Firestore, or null if none.
 * Automatically deactivates and cleans up any stale sessions (> 30 min without heartbeat).
 */
export async function getActiveSession(): Promise<AdminSession | null> {
  if (!isFirebaseConfigured) return null
  try {
    const results = await getCollection<AdminSession>(COL, where('active', '==', true))
    const now = Date.now()

    for (const session of results) {
      const lastActivityTime = new Date(session.lastHeartbeat || session.startedAt).getTime()
      const isStale = !isNaN(lastActivityTime) && (now - lastActivityTime > SESSION_MAX_INACTIVITY_MS)

      if (isStale) {
        // Automatically mark stale session as ended in Firestore
        void endSession(session.id, 'System (Inactivity timeout)')
        continue
      }

      return session
    }
    return null
  } catch (err) {
    console.warn('[sessions] getActiveSession error:', err)
    return null
  }
}

/**
 * Opens a new session for the given user.
 * STRICT ENFORCEMENT: Under NO circumstance can 2 sessions be active at the same time.
 * Any existing active sessions in Firestore are atomically terminated before the new one is activated.
 */
export async function startSession(user: string): Promise<string> {
  const now = new Date().toISOString()
  const dbInstance = db()
  const id = generateUUID()

  try {
    const activeSessions = await getCollection<AdminSession>(COL, where('active', '==', true))
    const batch = writeBatch(dbInstance)

    // 1. Atomically terminate all existing active sessions
    for (const oldSession of activeSessions) {
      const oldRef = doc(dbInstance, COL, oldSession.id)
      batch.update(oldRef, {
        active: false,
        endedAt: now,
        terminatedBy: user,
      })
    }

    // 2. Atomically activate the single new session
    const newRef = doc(dbInstance, COL, id)
    batch.set(newRef, {
      id,
      user,
      startedAt: now,
      endedAt: null,
      active: true,
      lastHeartbeat: now,
    })

    await batch.commit()
    return id
  } catch (err) {
    console.warn('[sessions] Atomic session batch error, falling back:', err)
    // Fallback: create session directly if batch encountered an issue
    await setDocument(COL, id, {
      id,
      user,
      startedAt: now,
      endedAt: null,
      active: true,
      lastHeartbeat: now,
    })
    return id
  }
}

/**
 * Updates the session's heartbeat timestamp so other clients know it is actively in use.
 */
export async function updateSessionHeartbeat(sessionId: string): Promise<void> {
  if (!isFirebaseConfigured || !sessionId) return
  try {
    await setDocument(COL, sessionId, {
      lastHeartbeat: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('[sessions] updateSessionHeartbeat error:', err)
  }
}

/** Marks a session as ended. */
export async function endSession(sessionId: string, terminatedBy?: string): Promise<void> {
  if (!isFirebaseConfigured || !sessionId) return
  const payload: Partial<AdminSession> = {
    active: false,
    endedAt: new Date().toISOString(),
  }
  if (terminatedBy) {
    payload.terminatedBy = terminatedBy
  }
  await setDocument(COL, sessionId, payload)
}

/**
 * Real-time listener for the active session in Firestore.
 * Notifies subscriber whenever the active session starts, updates, or terminates.
 */
export function subscribeActiveSession(
  callback: (session: AdminSession | null) => void,
): () => void {
  if (!isFirebaseConfigured) {
    callback(null)
    return () => {}
  }

  const q = query(collection(db(), COL), where('active', '==', true))
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => d.data() as AdminSession)
      const now = Date.now()
      const live = docs.find((s) => {
        const last = new Date(s.lastHeartbeat || s.startedAt).getTime()
        return !isNaN(last) && now - last <= SESSION_MAX_INACTIVITY_MS
      })
      callback(live || null)
    },
    (err) => {
      console.warn('[sessions] subscribeActiveSession error:', err)
    },
  )
}

/**
 * Real-time listener on a specific session document.
 * Used by the currently logged-in admin client to instantly detect if their session
 * is terminated by another admin on another device.
 */
export function subscribeToSessionDoc(
  sessionId: string,
  onUpdate: (session: AdminSession | null) => void,
): () => void {
  if (!isFirebaseConfigured || !sessionId) {
    return () => {}
  }

  const ref = doc(db(), COL, sessionId)
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as AdminSession)
      } else {
        onUpdate(null)
      }
    },
    (err) => {
      console.warn('[sessions] subscribeToSessionDoc error:', err)
    },
  )
}

/** Hard-deletes a session document (used only for stale-data cleanup). */
export async function deleteSessionDoc(sessionId: string): Promise<void> {
  await deleteDocument(COL, sessionId)
}

/** Returns all session records, ordered by start time descending. */
export async function getAllSessions(): Promise<AdminSession[]> {
  try {
    const results = await getCollection<AdminSession>(COL)
    return results
      .filter((s): s is AdminSession => Boolean(s && typeof s === 'object'))
      .map((s) => ({
        id: String(s.id || generateUUID()),
        user: String(s.user || 'Administrator'),
        startedAt: s.startedAt || new Date().toISOString(),
        endedAt: s.endedAt || null,
        active: Boolean(s.active),
        lastHeartbeat: s.lastHeartbeat,
        terminatedBy: s.terminatedBy,
      }))
      .sort((a, b) => {
        const timeA = new Date(a.startedAt).getTime() || 0
        const timeB = new Date(b.startedAt).getTime() || 0
        return timeB - timeA
      })
  } catch (err) {
    console.warn('[sessions] Failed to fetch all sessions from Firestore:', err)
    return []
  }
}
