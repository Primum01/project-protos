import { where } from 'firebase/firestore'
import { getCollection, setDocument, deleteDocument } from './firestore'

const COL = 'admin_sessions'

export interface AdminSession {
  id: string
  user: string
  startedAt: string   // ISO string
  endedAt: string | null
  active: boolean
}

/** Returns the current active session, or null if none exists. */
export async function getActiveSession(): Promise<AdminSession | null> {
  const results = await getCollection<AdminSession>(COL, where('active', '==', true))
  return results[0] ?? null
}

/** Opens a new session for the given user. Returns the new session document ID. */
export async function startSession(user: string): Promise<string> {
  const id = crypto.randomUUID()
  await setDocument(COL, id, {
    id,
    user,
    startedAt: new Date().toISOString(),
    endedAt: null,
    active: true,
  })
  return id
}

/** Marks a session as ended. */
export async function endSession(sessionId: string): Promise<void> {
  await setDocument(COL, sessionId, {
    active: false,
    endedAt: new Date().toISOString(),
  })
}

/** Hard-deletes a session document (used only for stale-data cleanup). */
export async function deleteSessionDoc(sessionId: string): Promise<void> {
  await deleteDocument(COL, sessionId)
}

/** Returns all session records, ordered by start time descending. */
export async function getAllSessions(): Promise<AdminSession[]> {
  try {
    const results = await getCollection<AdminSession>(COL)
    return results.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  } catch (err) {
    console.warn('[sessions] Failed to fetch all sessions from Firestore:', err)
    return []
  }
}

