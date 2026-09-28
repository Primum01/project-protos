import crypto from 'crypto'

export interface StoredOtpRecord {
  codeHash: string
  email: string
  attempts: number
  expiresAt: number
  createdAt: number
}

export interface VerifiedTokenPayload {
  email: string
  verifiedAt: number
  exp: number
  sig?: string
}

// In-memory fallback and test cache (keyed by email)
export const memoryOtpStore = new Map<string, StoredOtpRecord>()

export function getOtpSecret(): string {
  return (
    process.env.ADMIN_OTP_SECRET ||
    process.env.VITE_FIREBASE_API_KEY ||
    'twinspace-admin-otp-cryptographic-salt-2026'
  )
}

/**
 * Validates a Firebase Auth ID Token using Google Identity Toolkit REST API
 * and ensures the authenticated email is strictly team@twinspace360.com.
 */
export async function verifyFirebaseAdminToken(idToken: string): Promise<boolean> {
  if (!idToken || typeof idToken !== 'string') return false

  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    )

    if (!res.ok) {
      return false
    }

    const data = await res.json()
    const userEmail = data.users?.[0]?.email?.trim().toLowerCase()
    return userEmail === 'team@twinspace360.com'
  } catch (err) {
    console.error('[otpStore] Token verification error:', err)
    return false
  }
}

/**
 * Computes a SHA-256 HMAC hash of the 6-digit code with server-side salt.
 */
export function hashOtpCode(code: string, email: string): string {
  const secret = getOtpSecret()
  return crypto
    .createHmac('sha256', secret)
    .update(`${code.trim()}:${email.trim().toLowerCase()}`)
    .digest('hex')
}

/**
 * Saves the active OTP record into Firestore admin_otp_store (protected by rules: allow read, write: if isAdmin())
 * with automatic fallback to memory cache.
 */
export async function saveOtpRecord(record: StoredOtpRecord, idToken?: string): Promise<void> {
  memoryOtpStore.set(record.email.toLowerCase(), record)

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`
    }
    await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          codeHash: { stringValue: record.codeHash },
          email: { stringValue: record.email },
          attempts: { integerValue: String(record.attempts) },
          expiresAt: { integerValue: String(record.expiresAt) },
          createdAt: { integerValue: String(record.createdAt) },
        },
      }),
    })
  } catch (err) {
    console.warn('[otpStore] Firestore save error, using memory store:', err)
  }
}

/**
 * Retrieves the active OTP record from memory or Firestore.
 */
export async function getOtpRecord(email: string, idToken?: string): Promise<StoredOtpRecord | null> {
  const key = email.toLowerCase()
  const memRecord = memoryOtpStore.get(key)
  if (memRecord) {
    return memRecord
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = {}
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`
    }
    const res = await fetch(url, { headers })
    if (!res.ok) return null

    const data = await res.json()
    const fields = data.fields
    if (!fields || !fields.codeHash?.stringValue) return null

    const record: StoredOtpRecord = {
      codeHash: fields.codeHash.stringValue,
      email: fields.email?.stringValue || 'team@twinspace360.com',
      attempts: parseInt(fields.attempts?.integerValue || '0', 10),
      expiresAt: parseInt(fields.expiresAt?.integerValue || '0', 10),
      createdAt: parseInt(fields.createdAt?.integerValue || '0', 10),
    }

    memoryOtpStore.set(key, record)
    return record
  } catch {
    return null
  }
}

/**
 * Increments attempt count for rate-limiting & brute-force defense.
 */
export async function incrementOtpAttempts(email: string, idToken?: string): Promise<number> {
  const record = await getOtpRecord(email, idToken)
  if (!record) return 0

  const newAttempts = record.attempts + 1
  record.attempts = newAttempts
  await saveOtpRecord(record, idToken)
  return newAttempts
}

/**
 * Deletes the OTP record upon successful verification, expiration, or lockout.
 */
export async function deleteOtpRecord(email: string, idToken?: string): Promise<void> {
  memoryOtpStore.delete(email.toLowerCase())

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = {}
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`
    }
    await fetch(url, { method: 'DELETE', headers })
  } catch {
    /* ignore deletion errors */
  }
}

/**
 * Signs a verification token valid for 8 hours for the authenticated browser session.
 */
export function generateVerifiedToken(email: string): string {
  const secret = getOtpSecret()
  const payload: VerifiedTokenPayload = {
    email: email.trim().toLowerCase(),
    verifiedAt: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  }

  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${payload.email}:${payload.verifiedAt}:${payload.exp}`)
    .digest('hex')

  payload.sig = sig
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/**
 * Verifies a signed verification token server-side.
 */
export function verifySignedToken(token: string): boolean {
  if (!token) return false
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8')
    const payload: VerifiedTokenPayload = JSON.parse(jsonStr)

    if (payload.email !== 'team@twinspace360.com') return false
    if (Date.now() > payload.exp) return false

    const secret = getOtpSecret()
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload.email}:${payload.verifiedAt}:${payload.exp}`)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(payload.sig || ''),
      Buffer.from(expectedSig),
    )
  } catch {
    return false
  }
}
