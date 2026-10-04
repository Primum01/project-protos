import crypto from 'crypto'

// ── Cookie parsing helper ─────────────────────────────────────────────────────
function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const idx = part.indexOf('=')
      const key = part.slice(0, idx).trim()
      const val = part.slice(idx + 1).trim()
      return [key, decodeURIComponent(val)]
    }),
  )
}

function getOtpSecret(): string {
  if (process.env.ADMIN_OTP_SECRET) {
    return process.env.ADMIN_OTP_SECRET
  }
  if (process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production') {
    return 'twinspace-admin-otp-preview-fallback-2026'
  }
  return process.env.VITE_FIREBASE_API_KEY || 'twinspace-admin-otp-production-fallback-2026'
}

// ── Verify the HMAC-signed token from the cookie ─────────────────────────────
function verifySignedToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8')
    const payload = JSON.parse(jsonStr) as {
      email?: string
      verifiedAt?: number
      exp?: number
      sig?: string
    }

    if (payload.email !== 'team@twinspace360.com') return false
    if (!payload.exp || Date.now() > payload.exp) return false
    if (!payload.sig) return false

    const secret = getOtpSecret()
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload.email}:${payload.verifiedAt}:${payload.exp}`)
      .digest('hex')

    // Constant-time comparison to prevent timing side-channel attacks
    return crypto.timingSafeEqual(
      Buffer.from(payload.sig.padEnd(64, '\0')),
      Buffer.from(expectedSig.padEnd(64, '\0')),
    )
  } catch {
    return false
  }
}

/**
 * GET /api/auth/session-check
 *
 * Reads the `ts_otp_verified` HttpOnly cookie and validates the server-signed token.
 * Returns { verified: true } if the session is authenticated, { verified: false } otherwise.
 *
 * This endpoint is the ONLY way for client-side code to query whether 2FA has been
 * completed, since the cookie itself is HttpOnly and JS cannot read it directly.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  // No-cache: prevent proxies or CDN from caching authentication state
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')

  try {
    const cookieHeader = req.headers.cookie || ''
    const cookies = parseCookies(cookieHeader)
    const token = cookies['ts_otp_verified'] || ''

    const verified = verifySignedToken(token)

    return res.status(200).json({ verified })
  } catch (err: any) {
    console.error('[session-check] Handler error:', err)
    return res.status(500).json({ verified: false, error: 'Internal server error.' })
  }
}
