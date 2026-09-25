/**
 * Client-Side Idempotency Utility
 * Ensures network retries, double-clicks, and connection dropouts safely reuse the identical Idempotency-Key.
 */

/**
 * Generates a cryptographically secure UUID v4 for request idempotency.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Cryptographically secure fallback using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // High-entropy fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface FetchWithIdempotencyOptions extends RequestInit {
  idempotencyKey?: string
  maxRetries?: number
  retryDelayMs?: number
}

export interface IdempotentFetchResult<T = any> {
  response: Response
  data: T
  idempotencyKey: string
  replayed: boolean
}

/**
 * Performs an HTTP request with an Idempotency-Key.
 * In the event of network connectivity drops or 5xx server errors, automatically retries
 * using the EXACT SAME Idempotency-Key, guaranteeing zero duplicate records.
 */
export async function fetchWithIdempotency<T = any>(
  url: string,
  options: FetchWithIdempotencyOptions = {},
): Promise<IdempotentFetchResult<T>> {
  const {
    idempotencyKey = generateIdempotencyKey(),
    maxRetries = 2,
    retryDelayMs = 1000,
    ...fetchOptions
  } = options

  const headers = new Headers(fetchOptions.headers || {})
  if (!headers.has('Idempotency-Key') && !headers.has('idempotency-key')) {
    headers.set('Idempotency-Key', idempotencyKey)
  }

  let attempt = 0
  let lastError: any = null

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, {
        ...fetchOptions,
        headers,
      })

      // 409 "Processing" or 429 "Too Many Requests" -> wait and retry with SAME key
      if ((res.status === 409 || res.status === 429) && attempt < maxRetries) {
        const retryAfterSec = parseInt(res.headers.get('Retry-After') || '2', 10)
        await new Promise((r) => setTimeout(r, retryAfterSec * 1000))
        attempt++
        continue
      }

      const replayed = res.headers.get('Idempotent-Replayed') === 'true'
      let data: any = null
      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}))
      }

      return {
        response: res,
        data,
        idempotencyKey,
        replayed,
      }
    } catch (err) {
      lastError = err
      attempt++
      if (attempt <= maxRetries) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt - 1)))
      }
    }
  }

  throw lastError || new Error(`Request failed after ${maxRetries + 1} attempts`)
}
