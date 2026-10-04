import crypto from 'crypto'

const TARGET_ADMIN_EMAIL = 'team@twinspace360.com'
const MAX_ATTEMPTS = 5

// In-memory fallback and test cache
const memoryOtpStore = new Map<string, any>()

function getOtpSecret(): string {
  if (process.env.ADMIN_OTP_SECRET) {
    return process.env.ADMIN_OTP_SECRET
  }
  if (process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production') {
    return 'twinspace-admin-otp-preview-fallback-2026'
  }
  return process.env.VITE_FIREBASE_API_KEY || 'twinspace-admin-otp-production-fallback-2026'
}

async function verifyFirebaseAdminToken(idToken: string): Promise<boolean> {
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

    if (!res.ok) return false
    const data = await res.json()
    const userEmail = data.users?.[0]?.email?.trim().toLowerCase()
    return userEmail === 'team@twinspace360.com'
  } catch (err) {
    console.error('[verify-otp] Token verification error:', err)
    return false
  }
}

function hashOtpCode(code: string, email: string): string {
  const secret = getOtpSecret()
  return crypto
    .createHmac('sha256', secret)
    .update(`${code.trim()}:${email.trim().toLowerCase()}`)
    .digest('hex')
}

async function getOtpRecord(email: string, idToken?: string): Promise<any | null> {
  const key = email.toLowerCase()
  const memRecord = memoryOtpStore.get(key)
  if (memRecord) return memRecord

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = {}
    if (idToken) headers.Authorization = `Bearer ${idToken}`

    const res = await fetch(url, { headers })
    if (!res.ok) return null

    const data = await res.json()
    const fields = data.fields
    if (!fields || !fields.codeHash?.stringValue) return null

    const record = {
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

async function saveOtpRecord(
  record: {
    codeHash: string
    email: string
    attempts: number
    expiresAt: number
    createdAt: number
  },
  idToken?: string,
): Promise<void> {
  memoryOtpStore.set(record.email.toLowerCase(), record)

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (idToken) headers.Authorization = `Bearer ${idToken}`

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
    console.warn('[verify-otp] Firestore save error, using memory store:', err)
  }
}

async function deleteOtpRecord(email: string, idToken?: string): Promise<void> {
  memoryOtpStore.delete(email.toLowerCase())

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ'

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admin_otp_store/admin_active_otp?key=${apiKey}`
    const headers: Record<string, string> = {}
    if (idToken) headers.Authorization = `Bearer ${idToken}`
    await fetch(url, { method: 'DELETE', headers })
  } catch {
    /* ignore deletion errors */
  }
}

async function incrementOtpAttempts(email: string, idToken?: string): Promise<number> {
  const record = await getOtpRecord(email, idToken)
  if (!record) return 0

  const newAttempts = record.attempts + 1
  record.attempts = newAttempts
  await saveOtpRecord(record, idToken)
  return newAttempts
}

function generateVerifiedToken(email: string): string {
  const secret = getOtpSecret()
  const payload: any = {
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const idToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : req.body?.idToken || ''

    // 1. Authenticate caller as team@twinspace360.com
    const isVerifiedAdmin = await verifyFirebaseAdminToken(idToken)
    if (!isVerifiedAdmin) {
      return res.status(401).json({
        error: 'Unauthorized: valid team@twinspace360.com credentials required.',
      })
    }

    const { code } = req.body || {}
    const cleanCode = typeof code === 'string' ? code.trim() : ''

    if (!cleanCode || !/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({
        error: 'Invalid format. Please enter a valid 6-digit verification code.',
      })
    }

    // 2. Retrieve active OTP record
    const record = await getOtpRecord(TARGET_ADMIN_EMAIL, idToken)
    if (!record) {
      return res.status(400).json({
        error: 'No active verification code found. Please click "Resend Code" to request one.',
      })
    }

    const now = Date.now()

    // 3. Expiration check
    if (now > record.expiresAt) {
      await deleteOtpRecord(TARGET_ADMIN_EMAIL, idToken)
      return res.status(400).json({
        error: 'Verification code has expired. Please click "Resend Code" for a fresh code.',
      })
    }

    // 4. Rate-limiting & brute force defense check
    if (record.attempts >= MAX_ATTEMPTS) {
      await deleteOtpRecord(TARGET_ADMIN_EMAIL, idToken)
      return res.status(429).json({
        error: 'Too many incorrect attempts. Code has been invalidated for security. Please request a new code.',
      })
    }

    // 5. Constant-time hash comparison
    const candidateHash = hashOtpCode(cleanCode, TARGET_ADMIN_EMAIL)
    const isMatch =
      candidateHash.length === record.codeHash.length &&
      crypto.timingSafeEqual(
        Buffer.from(candidateHash),
        Buffer.from(record.codeHash),
      )

    if (!isMatch) {
      const attemptsUsed = await incrementOtpAttempts(TARGET_ADMIN_EMAIL, idToken)
      const remaining = Math.max(0, MAX_ATTEMPTS - attemptsUsed)

      if (remaining === 0) {
        await deleteOtpRecord(TARGET_ADMIN_EMAIL, idToken)
        return res.status(429).json({
          error: 'Too many incorrect attempts. Code invalidated. Please request a new code.',
          remainingAttempts: 0,
        })
      }

      return res.status(400).json({
        error: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
        remainingAttempts: remaining,
      })
    }

    // 6. Match succeeded: Immediately invalidate the OTP to prevent replay attacks
    await deleteOtpRecord(TARGET_ADMIN_EMAIL, idToken)

    // 7. Issue server-signed proof token and set it as an HttpOnly cookie.
    //    The token is NEVER sent to the browser JS environment — only into the browser's
    //    secure cookie store. JS code cannot read or steal it via XSS.
    const verifiedToken = generateVerifiedToken(TARGET_ADMIN_EMAIL)

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      (req.headers.host || '').includes('twinspace360.com')

    // Cookie lifetime matches the token expiry (8 hours)
    const maxAgeSeconds = 8 * 60 * 60

    // HttpOnly  → JS cannot access this cookie (mitigates XSS token theft)
    // SameSite=Strict → browser will not send the cookie on cross-site requests (CSRF protection)
    // Secure    → only transmitted over HTTPS (enforced in production; omitted in local dev)
    // Path=/api/auth → scoped: only sent to /api/auth/* endpoints, not to every request
    const cookieParts = [
      `ts_otp_verified=${verifiedToken}`,
      `Max-Age=${maxAgeSeconds}`,
      'Path=/api/auth',
      'HttpOnly',
      'SameSite=Strict',
    ]
    if (isProduction) cookieParts.push('Secure')

    res.setHeader('Set-Cookie', cookieParts.join('; '))

    return res.status(200).json({
      success: true,
      message: 'Verification successful. Welcome to the TwinSpace Admin Session.',
    })
  } catch (err: any) {
    console.error('[verify-otp] Handler error:', err)
    return res.status(500).json({
      error: 'Internal server error verifying authentication code.',
    })
  }
}
