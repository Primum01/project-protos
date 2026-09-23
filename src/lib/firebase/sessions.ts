import { where } from 'firebase/firestore'
import { getCollection, setDocument, deleteDocument } from './firestore'
import { generateUUID } from '@/lib/uuid'

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
  const id = generateUUID()
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
    return results
      .filter((s): s is AdminSession => Boolean(s && typeof s === 'object'))
      .map((s) => ({
        id: String(s.id || generateUUID()),
        user: String(s.user || 'Administrator'),
        startedAt: s.startedAt || new Date().toISOString(),
        endedAt: s.endedAt || null,
        active: Boolean(s.active),
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

