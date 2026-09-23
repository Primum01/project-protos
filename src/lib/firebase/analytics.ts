import { getCollection, setDocument, subscribeCollection } from './firestore'
import { isFirebaseConfigured } from './config'
import { generateUUID } from '@/lib/uuid'

const COL = 'tour_analytics'
const LOCAL_STORAGE_KEY = 'ts_tour_analytics_v1'

export type AnalyticsEventType = 'tour_view' | 'session_duration' | 'link_shared'

export interface AnalyticsRecord {
  id: string
  type: AnalyticsEventType
  tourId: string
  tourTitle?: string
  durationSeconds?: number
  timestamp: string // ISO string
}

function getLocalRecords(): AnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalRecord(record: AnalyticsRecord): void {
  try {
    const existing = getLocalRecords()
    // Prepend and keep latest 500 records
    const updated = [record, ...existing].slice(0, 500)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}

/** Record a real tour view event */
export async function recordTourView(tourId: string, tourTitle?: string): Promise<void> {
  const id = generateUUID()
  const record: AnalyticsRecord = {
    id,
    type: 'tour_view',
    tourId,
    tourTitle,
    timestamp: new Date().toISOString(),
  }

  saveLocalRecord(record)

  if (isFirebaseConfigured) {
    try {
      await setDocument(COL, id, record)
    } catch (err) {
      console.warn('[Analytics] Failed to save tour_view to Firestore:', err)
    }
  }
}

/** Record real session duration in seconds when a user finishes exploring a tour */
export async function recordSessionDuration(
  tourId: string,
  durationSeconds: number,
  tourTitle?: string,
): Promise<void> {
  if (durationSeconds < 2) return // Ignore instant bounces < 2s

  const id = generateUUID()
  const record: AnalyticsRecord = {
    id,
    type: 'session_duration',
    tourId,
    tourTitle,
    durationSeconds: Math.round(durationSeconds),
    timestamp: new Date().toISOString(),
  }

  saveLocalRecord(record)

  if (isFirebaseConfigured) {
    try {
      await setDocument(COL, id, record)
    } catch (err) {
      console.warn('[Analytics] Failed to save session_duration to Firestore:', err)
    }
  }
}

/** Record when a user shares or copies a tour link */
export async function recordLinkShared(tourId: string, tourTitle?: string): Promise<void> {
  const id = generateUUID()
  const record: AnalyticsRecord = {
    id,
    type: 'link_shared',
    tourId,
    tourTitle,
    timestamp: new Date().toISOString(),
  }

  saveLocalRecord(record)

  if (isFirebaseConfigured) {
    try {
      await setDocument(COL, id, record)
    } catch (err) {
      console.warn('[Analytics] Failed to save link_shared to Firestore:', err)
    }
  }
}

/** Fetch all real analytics records from Firestore and local storage */
export async function getRealAnalytics(): Promise<AnalyticsRecord[]> {
  const local = getLocalRecords()
  if (!isFirebaseConfigured) {
    return local
  }

  try {
    const remote = await getCollection<AnalyticsRecord>(COL)
    // Merge remote and local by id
    const map = new Map<string, AnalyticsRecord>()
    remote.forEach((r) => map.set(r.id, r))
    local.forEach((l) => map.set(l.id, l))

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  } catch {
    return local
  }
}

/** Subscribe to live real-time analytics updates */
export function subscribeRealAnalytics(
  callback: (records: AnalyticsRecord[]) => void,
): () => void {
  if (!isFirebaseConfigured) {
    callback(getLocalRecords())
    return () => {}
  }

  return subscribeCollection<AnalyticsRecord>(COL, (remote) => {
    const local = getLocalRecords()
    const map = new Map<string, AnalyticsRecord>()
    remote.forEach((r) => map.set(r.id, r))
    local.forEach((l) => map.set(l.id, l))

    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    callback(sorted)
  })
}
