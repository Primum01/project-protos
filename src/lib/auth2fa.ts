const TOKEN_KEY = 'ts_2fa_token'
const VERIFIED_AT_KEY = 'ts_2fa_verified_at'

export interface SendOtpResult {
  success: boolean
  expiresAt?: number
  cooldownSeconds?: number
  maskedEmail?: string
  error?: string
}

export interface VerifyOtpResult {
  success: boolean
  verifiedToken?: string
  remainingAttempts?: number
  error?: string
}

export function getStored2FAToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function is2FAVerified(): boolean {
  const token = getStored2FAToken()
  return Boolean(token && token.length > 20)
}

export function set2FAVerified(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(VERIFIED_AT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function clear2FAVerification(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(VERIFIED_AT_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(VERIFIED_AT_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Requests the server to generate and send a 6-digit verification code to team@twinspace360.com.
 * Requires the current Firebase Auth user ID token.
 */
export async function sendOtpRequest(idToken: string): Promise<SendOtpResult> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to dispatch verification code.',
        cooldownSeconds: data.cooldownSeconds,
      }
    }

    return {
      success: true,
      expiresAt: data.expiresAt,
      cooldownSeconds: data.cooldownSeconds || 45,
      maskedEmail: data.maskedEmail || 'te**@twinspace360.com',
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error requesting verification code.',
    }
  }
}

/**
 * Submits the 6-digit candidate code to the server for verification.
 * The server compares the salted hash in constant time and immediately consumes the code.
 */
export async function verifyOtpRequest(
  code: string,
  idToken: string,
): Promise<VerifyOtpResult> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code: code.trim(), idToken }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid verification code.',
        remainingAttempts: data.remainingAttempts,
      }
    }

    if (data.verifiedToken) {
      set2FAVerified(data.verifiedToken)
    }

    return {
      success: true,
      verifiedToken: data.verifiedToken,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error submitting verification code.',
    }
  }
}
