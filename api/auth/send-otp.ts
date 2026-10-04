import crypto from 'crypto'

const TARGET_ADMIN_EMAIL = 'team@twinspace360.com'
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const COOLDOWN_MS = 45 * 1000 // 45 seconds between sends

// In-memory fallback and test cache
const memoryOtpStore = new Map<string, any>()

import { getOtpSecret } from '../_lib/otpStore.ts'

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
    console.error('[send-otp] Token verification error:', err)
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
    console.warn('[send-otp] Firestore save error, using memory store:', err)
  }
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

function generateOtpEmailHtml(code: string): string {
  const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>TwinSpace Admin Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .wrapper { width: 100%; max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 28px 32px; text-align: center; }
        .brand { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none; }
        .content { padding: 36px 32px; }
        .badge { display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 9999px; letter-spacing: 0.5px; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
        .subtitle { font-size: 14px; color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }
        .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin: 0; }
        .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
        .security-note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #78350f; line-height: 1.5; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="brand">TwinSpace 360</span>
        </div>
        <div class="content">
          <div class="badge">Security Verification</div>
          <h1 class="title">Admin Login Verification Code</h1>
          <p class="subtitle">Use the 6-digit code below to complete your sign-in to the TwinSpace Admin Portal:</p>

          <div class="code-box">
            <div class="code">${formattedCode}</div>
            <div class="expiry">Expires in 5 minutes · Single-use only</div>
          </div>

          <div class="security-note">
            <strong>Security Alert:</strong> If you did not initiate this login request, an unauthorized attempt may have been made to access your admin account. Please inspect active sessions immediately.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} TwinSpace 360. All rights reserved.<br>
          Automated security dispatch from no-reply@twinspace360.com
        </div>
      </div>
    </body>
  </html>
  `
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

    // 1. Verify caller has a valid Firebase token for team@twinspace360.com
    const isVerifiedAdmin = await verifyFirebaseAdminToken(idToken)
    if (!isVerifiedAdmin) {
      return res.status(401).json({
        error: 'Unauthorized: valid team@twinspace360.com credentials required.',
      })
    }

    // 2. Cooldown check: prevent email spam
    const existing = await getOtpRecord(TARGET_ADMIN_EMAIL, idToken)
    const now = Date.now()
    if (existing && now < existing.createdAt + COOLDOWN_MS) {
      const waitSeconds = Math.ceil((existing.createdAt + COOLDOWN_MS - now) / 1000)
      return res.status(429).json({
        error: `Please wait ${waitSeconds}s before requesting a new code.`,
        cooldownSeconds: waitSeconds,
      })
    }

    // 3. Generate cryptographically strong 6-digit code strictly on the server
    const code = crypto.randomInt(100000, 1000000).toString()
    const codeHash = hashOtpCode(code, TARGET_ADMIN_EMAIL)
    const expiresAt = now + OTP_TTL_MS

    // 4. Save record server-side with hash (never plaintext) and reset attempts
    await saveOtpRecord(
      {
        codeHash,
        email: TARGET_ADMIN_EMAIL,
        attempts: 0,
        expiresAt,
        createdAt: now,
      },
      idToken,
    )

    // 5. Send code via Resend if API key is present
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TwinSpace Security <no-reply@twinspace360.com>',
          to: [TARGET_ADMIN_EMAIL],
          subject: `TwinSpace Admin Verification Code: ${code.slice(0, 3)} ${code.slice(3)}`,
          html: generateOtpEmailHtml(code),
        }),
      })

      if (!resendRes.ok) {
        const errText = await resendRes.text()
        console.error('[send-otp] Resend dispatch error:', resendRes.status, errText)
        return res.status(502).json({
          error: 'Failed to deliver verification email. Please try again.',
        })
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[send-otp] [DEV LOG] OTP generated for ${TARGET_ADMIN_EMAIL}: ${code} (Expires in 5m)`,
      )
    }

    // 6. Return response to frontend WITHOUT THE CODE
    return res.status(200).json({
      success: true,
      expiresAt,
      cooldownSeconds: 45,
      maskedEmail: 'te**@twinspace360.com',
      message: 'A 6-digit verification code has been dispatched to team@twinspace360.com.',
    })
  } catch (err: any) {
    console.error('[send-otp] Handler error:', err)
    return res.status(500).json({
      error: 'Internal server error processing verification code request.',
    })
  }
}
