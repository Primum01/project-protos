import crypto from 'crypto'

export interface IdempotencyRecord {
  id: string
  key: string
  scope: string
  userId?: string
  endpoint: string
  method: string
  requestHash: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: any
  createdAt: string
  updatedAt: string
  completedAt?: string
  expiresAt: string
}

export interface IdempotencyOptions {
  endpoint: string
  required?: boolean
  ttlSeconds?: number
  processingTimeoutSeconds?: number
  getUserId?: (req: any) => string | undefined
  getClientIp?: (req: any) => string
}

const DEFAULT_TTL_SECONDS = 24 * 60 * 60 // 24 hours
const DEFAULT_PROCESSING_TIMEOUT_SECONDS = 60 // 60 seconds stale lock recovery

// Global in-memory fallback / test store
const memoryStore = new Map<string, IdempotencyRecord>()

/**
 * Validates the Idempotency-Key header value.
 * Must be 16-255 characters matching safe printable characters (e.g. UUIDv4).
 */
export function isValidIdempotencyKey(key: any): boolean {
  if (typeof key !== 'string') return false
  const trimmed = key.trim()
  if (trimmed.length < 16 || trimmed.length > 255) return false
  return /^[A-Za-z0-9_.:\-]+$/.test(trimmed)
}

/**
 * Deterministically canonicalizes any JSON value so equivalent structures produce identical hashes.
 */
export function canonicalizeJson(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalizeJson).join(',') + ']'
  }
  const keys = Object.keys(value).sort()
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalizeJson(value[k]))
      .join(',') +
    '}'
  )
}

/**
 * Computes a SHA-256 hash of the canonicalized request payload.
 */
export function computeRequestHash(body: any): string {
  const canonical = canonicalizeJson(body)
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

/**
 * Computes a deterministic document ID from scope, method, endpoint, and idempotency key.
 */
export function computeRecordId(scope: string, method: string, endpoint: string, key: string): string {
  const raw = `${scope}::${method.toUpperCase()}::${endpoint}::${key}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Converts a JS IdempotencyRecord into a Firestore REST fields payload.
 */
function recordToFirestorePayload(record: IdempotencyRecord) {
  const fields: Record<string, any> = {
    id: { stringValue: record.id },
    key: { stringValue: record.key },
    scope: { stringValue: record.scope },
    endpoint: { stringValue: record.endpoint },
    method: { stringValue: record.method },
    requestHash: { stringValue: record.requestHash },
    status: { stringValue: record.status },
    createdAt: { stringValue: record.createdAt },
    updatedAt: { stringValue: record.updatedAt },
    expiresAt: { stringValue: record.expiresAt },
  }

  if (record.userId) {
    fields.userId = { stringValue: record.userId }
  }
  if (record.completedAt) {
    fields.completedAt = { stringValue: record.completedAt }
  }
  if (record.responseStatus !== undefined) {
    fields.responseStatus = { integerValue: record.responseStatus.toString() }
  }
  if (record.responseHeaders) {
    fields.responseHeaders = { stringValue: JSON.stringify(record.responseHeaders) }
  }
  if (record.responseBody !== undefined) {
    fields.responseBody = { stringValue: JSON.stringify(record.responseBody) }
  }

  return { fields }
}

/**
 * Parses a Firestore REST fields payload back into an IdempotencyRecord.
 */
function firestorePayloadToRecord(data: any): IdempotencyRecord | null {
  if (!data?.fields) return null
  const f = data.fields
  return {
    id: f.id?.stringValue || '',
    key: f.key?.stringValue || '',
    scope: f.scope?.stringValue || '',
    userId: f.userId?.stringValue,
    endpoint: f.endpoint?.stringValue || '',
    method: f.method?.stringValue || '',
    requestHash: f.requestHash?.stringValue || '',
    status: f.status?.stringValue || 'PROCESSING',
    responseStatus: f.responseStatus?.integerValue ? parseInt(f.responseStatus.integerValue, 10) : undefined,
    responseHeaders: f.responseHeaders?.stringValue ? JSON.parse(f.responseHeaders.stringValue) : undefined,
    responseBody: f.responseBody?.stringValue ? JSON.parse(f.responseBody.stringValue) : undefined,
    createdAt: f.createdAt?.stringValue || '',
    updatedAt: f.updatedAt?.stringValue || '',
    completedAt: f.completedAt?.stringValue,
    expiresAt: f.expiresAt?.stringValue || '',
  }
}

/**
 * Persistent Storage Layer with Firestore REST support and memory fallback.
 */
export class IdempotencyStorage {
  private projectId: string
  private apiKey: string
  private isConfigured: boolean
  private inMemoryOnly: boolean

  constructor(options?: { projectId?: string; apiKey?: string; inMemoryOnly?: boolean }) {
    this.inMemoryOnly = Boolean(options?.inMemoryOnly)
    this.projectId = options?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
    this.apiKey = options?.apiKey || process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'
    this.isConfigured = !this.inMemoryOnly && Boolean(this.projectId && this.apiKey)
  }

  /**
   * Retrieves a record by its deterministic ID.
   */
  async get(id: string): Promise<IdempotencyRecord | null> {
    // 1. Check in-memory store first
    const mem = memoryStore.get(id)
    if (mem) return mem

    // 2. Query Firestore if configured
    if (!this.isConfigured) return null

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/idempotency_keys/${id}?key=${this.apiKey}`
      const res = await fetch(url)
      if (res.status === 404) return null
      if (!res.ok) {
        return null
      }
      const data = await res.json()
      const record = firestorePayloadToRecord(data)
      if (record) {
        memoryStore.set(id, record) // cache locally
      }
      return record
    } catch {
      return null
    }
  }

  /**
   * Atomically attempts to create a new reservation record.
   * Returns { success: true } if reserved, or { success: false, existing } if already claimed.
   */
  async create(record: IdempotencyRecord): Promise<{ success: boolean; existing?: IdempotencyRecord }> {
    // 1. In-memory atomic check
    const existing = memoryStore.get(record.id)
    if (existing) {
      return { success: false, existing }
    }

    // 2. Firestore atomic insert with precondition currentDocument.exists=false
    if (this.isConfigured) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/idempotency_keys/${record.id}?key=${this.apiKey}&currentDocument.exists=false`
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToFirestorePayload(record)),
        })

        if (res.ok) {
          memoryStore.set(record.id, record)
          return { success: true }
        }

        // If Firestore returned 409 Conflict / FAILED_PRECONDITION / 400 with ALREADY_EXISTS
        if (res.status === 409 || res.status === 400 || res.status === 412) {
          const remoteExisting = await this.get(record.id)
          return { success: false, existing: remoteExisting || existing }
        }
      } catch (err) {
        console.warn('[idempotency] Firestore create error, using memory fallback:', err)
      }
    }

    // Store in memory
    memoryStore.set(record.id, record)
    return { success: true }
  }

  /**
   * Updates an existing record (e.g. to COMPLETED or FAILED).
   */
  async update(id: string, updates: Partial<IdempotencyRecord>): Promise<void> {
    const existing = await this.get(id)
    const updated: IdempotencyRecord = {
      ...(existing || {
        id,
        key: '',
        scope: '',
        endpoint: '',
        method: '',
        requestHash: '',
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + DEFAULT_TTL_SECONDS * 1000).toISOString(),
      }),
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    memoryStore.set(id, updated)

    if (this.isConfigured) {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/idempotency_keys/${id}?key=${this.apiKey}`
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToFirestorePayload(updated)),
        })
      } catch (err) {
        console.warn('[idempotency] Firestore update error:', err)
      }
    }
  }

  /**
   * Clears in-memory store (primarily for unit tests).
   */
  clearMemoryStore(): void {
    memoryStore.clear()
  }
}

export const defaultStorage = new IdempotencyStorage()

/**
 * Core idempotency executor. Wraps any serverless request handler.
 */
export async function handleWithIdempotency(
  req: any,
  res: any,
  options: IdempotencyOptions,
  action: () => Promise<{ status: number; body: any; headers?: Record<string, string> }>,
  storage: IdempotencyStorage = defaultStorage,
): Promise<void> {
  const method = (req.method || 'POST').toUpperCase()
  const endpoint = options.endpoint || req.url || '/api'
  const ttlSeconds = options.ttlSeconds || DEFAULT_TTL_SECONDS
  const processingTimeoutMs = (options.processingTimeoutSeconds || DEFAULT_PROCESSING_TIMEOUT_SECONDS) * 1000

  // 1. Read and validate Idempotency-Key header
  const rawKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key']
  const key = typeof rawKey === 'string' ? rawKey.trim() : Array.isArray(rawKey) ? rawKey[0].trim() : ''

  if (!key) {
    if (options.required) {
      res.setHeader('Content-Type', 'application/json')
      return res.status(400).json({
        error: 'Missing required Idempotency-Key header. Provide a unique key (such as a UUID) to safely perform this operation.',
      })
    }
    // If not required and not provided, execute handler directly without idempotency tracking
    const result = await action()
    if (result.headers) {
      for (const [k, v] of Object.entries(result.headers)) {
        res.setHeader(k, v)
      }
    }
    return res.status(result.status).json(result.body)
  }

  if (!isValidIdempotencyKey(key)) {
    res.setHeader('Content-Type', 'application/json')
    return res.status(400).json({
      error: 'Invalid Idempotency-Key format. Key must be between 16 and 255 characters (e.g. standard UUID v4).',
    })
  }

  // 2. Resolve client scope and request hash
  const userId = options.getUserId ? options.getUserId(req) : (req.user?.uid || req.userId)
  const clientIp = options.getClientIp
    ? options.getClientIp(req)
    : (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
  
  const scope = userId ? `user:${userId}` : `anon:${clientIp}`
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const requestHash = computeRequestHash(body)
  const recordId = computeRecordId(scope, method, endpoint, key)

  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const expiresAtIso = new Date(now + ttlSeconds * 1000).toISOString()

  // 3. Check for existing record
  const existing = await storage.get(recordId)

  if (existing) {
    const isExpired = new Date(existing.expiresAt).getTime() <= now

    if (!isExpired) {
      // 3A. Request payload mismatch verification
      if (existing.requestHash !== requestHash) {
        res.setHeader('Content-Type', 'application/json')
        return res.status(409).json({
          error: 'Idempotency-Key conflict: this key has already been used with a different request payload.',
        })
      }

      // 3B. Already completed -> return cached response immediately
      if (existing.status === 'COMPLETED') {
        res.setHeader('Idempotent-Replayed', 'true')
        if (existing.responseHeaders) {
          for (const [hK, hV] of Object.entries(existing.responseHeaders)) {
            res.setHeader(hK, hV)
          }
        }
        res.setHeader('Content-Type', 'application/json')
        return res.status(existing.responseStatus || 200).json(existing.responseBody)
      }

      // 3C. In progress -> check if abandoned
      if (existing.status === 'PROCESSING') {
        const startedAt = new Date(existing.createdAt).getTime()
        const isAbandoned = now - startedAt > processingTimeoutMs

        if (!isAbandoned) {
          res.setHeader('Retry-After', '2')
          res.setHeader('Content-Type', 'application/json')
          return res.status(409).json({
            error: 'A request with this Idempotency-Key is currently being processed. Please retry in a few moments.',
          })
        }
        // Stale lock recovery: Proceed to re-execute
        console.warn(`[idempotency] Stale PROCESSING lock detected for record ${recordId}. Recovering lock.`)
      }

      // 3D. If previous status was FAILED or abandoned PROCESSING, re-reserve the existing record
      if (existing.status === 'FAILED' || existing.status === 'PROCESSING') {
        await storage.update(recordId, {
          status: 'PROCESSING',
          createdAt: nowIso,
          updatedAt: nowIso,
          expiresAt: expiresAtIso,
        })

        // Proceed to execution directly without storage.create
        return executeAction(recordId, action, storage, res)
      }
    }
  }

  // 4. Atomically reserve key for new requests
  const newRecord: IdempotencyRecord = {
    id: recordId,
    key,
    scope,
    userId,
    endpoint,
    method,
    requestHash,
    status: 'PROCESSING',
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: expiresAtIso,
  }

  const reservation = await storage.create(newRecord)
  if (!reservation.success && reservation.existing) {
    // Concurrent request beat this one to reservation
    const cur = reservation.existing
    if (cur.requestHash !== requestHash) {
      res.setHeader('Content-Type', 'application/json')
      return res.status(409).json({
        error: 'Idempotency-Key conflict: this key has already been used with a different request payload.',
      })
    }
    if (cur.status === 'COMPLETED') {
      res.setHeader('Idempotent-Replayed', 'true')
      res.setHeader('Content-Type', 'application/json')
      return res.status(cur.responseStatus || 200).json(cur.responseBody)
    }
    res.setHeader('Retry-After', '2')
    res.setHeader('Content-Type', 'application/json')
    return res.status(409).json({
      error: 'A request with this Idempotency-Key is currently being processed. Please retry in a few moments.',
    })
  }

  // 5. Execute underlying operation
  return executeAction(recordId, action, storage, res)
}

async function executeAction(
  recordId: string,
  action: () => Promise<{ status: number; body: any; headers?: Record<string, string> }>,
  storage: IdempotencyStorage,
  res: any,
): Promise<void> {
  try {
    const result = await action()

    // Determine if result is successful (2xx or 3xx)
    const isSuccess = result.status >= 200 && result.status < 400

    if (isSuccess) {
      await storage.update(recordId, {
        status: 'COMPLETED',
        responseStatus: result.status,
        responseHeaders: result.headers,
        responseBody: result.body,
        completedAt: new Date().toISOString(),
      })
    } else {
      // Mark as FAILED so legitimate retries can retry safely
      await storage.update(recordId, {
        status: 'FAILED',
        responseStatus: result.status,
        responseBody: result.body,
      })
    }

    if (result.headers) {
      for (const [k, v] of Object.entries(result.headers)) {
        res.setHeader(k, v)
      }
    }
    return res.status(result.status).json(result.body)
  } catch (err: any) {
    // Unlock record on unexpected server exceptions
    await storage.update(recordId, {
      status: 'FAILED',
      responseStatus: 500,
      responseBody: { error: 'Internal operation failed' },
    })
    throw err
  }
}
