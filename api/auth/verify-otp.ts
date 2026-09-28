import crypto from 'crypto'
import {
  deleteOtpRecord,
  generateVerifiedToken,
  getOtpRecord,
  hashOtpCode,
  incrementOtpAttempts,
  verifyFirebaseAdminToken,
} from '../_lib/otpStore.ts'

const TARGET_ADMIN_EMAIL = 'team@twinspace360.com'
const MAX_ATTEMPTS = 5

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

    // 7. Issue server-signed proof token for this browser session
    const verifiedToken = generateVerifiedToken(TARGET_ADMIN_EMAIL)

    return res.status(200).json({
      success: true,
      verifiedToken,
      message: 'Verification successful. Welcome to the TwinSpace Admin Session.',
    })
  } catch (err: any) {
    console.error('[verify-otp] Handler error:', err)
    return res.status(500).json({
      error: 'Internal server error verifying authentication code.',
    })
  }
}
