/**
 * auth2fa.ts — Client-side 2FA helpers
 *
 * Architecture note (security):
 * The verified 2FA token is stored EXCLUSIVELY in an HttpOnly cookie set by the server
 * (via /api/auth/verify-otp). JS cannot read it. The browser sends it automatically
 * when fetching /api/auth/* endpoints.
 *
 * This module queries /api/auth/session-check to determine verification status
 * without ever touching the token itself.
 *
 * Legacy: The previous approach stored the token in sessionStorage/localStorage, which
 * is readable by any JS on the page and vulnerable to XSS. That code has been removed.
 */

export interface SendOtpResult {
  success: boolean
  expiresAt?: number
  cooldownSeconds?: number
  maskedEmail?: string
  error?: string
}

export interface VerifyOtpResult {
  success: boolean
  remainingAttempts?: number
  error?: string
}

// ── In-memory verification state cache (avoids hammering the API) ─────────────
// This is intentionally volatile: it does NOT survive page refresh.
// On fresh page load, the first check always hits the API, which reads the cookie.
let _verifiedCache: boolean | null = null
let _cacheSetAt = 0
const CACHE_TTL_MS = 60_000 // Re-check the cookie at most once per minute

/**
 * Queries the server to check whether the current browser session has a valid
 * `ts_otp_verified` HttpOnly cookie. The cookie itself is not visible to JS.
 */
export async function is2FAVerified(): Promise<boolean> {
  const now = Date.now()
  if (_verifiedCache !== null && now - _cacheSetAt < CACHE_TTL_MS) {
    return _verifiedCache
  }

  try {
    const res = await fetch('/api/auth/session-check', {
      method: 'GET',
      credentials: 'same-origin', // ensure the cookie is sent
    })
    if (!res.ok) {
      _verifiedCache = false
      _cacheSetAt = now
      try { sessionStorage.removeItem('ts_2fa_verified') } catch {}
      return false
    }
    const data = await res.json()
    const verified = Boolean(data.verified)
    _verifiedCache = verified
    _cacheSetAt = now
    try {
      if (verified) {
        sessionStorage.setItem('ts_2fa_verified', '1')
      } else {
        sessionStorage.removeItem('ts_2fa_verified')
      }
    } catch {}
    return verified
  } catch {
    // Network error: treat as unverified (fail-secure)
    _verifiedCache = false
    _cacheSetAt = now
    try { sessionStorage.removeItem('ts_2fa_verified') } catch {}
    return false
  }
}

/**
 * Synchronous check whether 2FA has been confirmed in this active browser session.
 * Used by skeleton renderers and transition guards to determine whether the user
 * has access to the admin dashboard without triggering network round-trips.
 */
export function is2FAVerifiedCached(): boolean {
  if (_verifiedCache !== null) {
    return _verifiedCache
  }
  try {
    return sessionStorage.getItem('ts_2fa_verified') === '1'
  } catch {
    return false
  }
}

/**
 * Manually update the client-side 2FA verification cache.
 */
export function set2FAVerifiedCached(verified: boolean): void {
  _verifiedCache = verified
  _cacheSetAt = Date.now()
  try {
    if (verified) {
      sessionStorage.setItem('ts_2fa_verified', '1')
    } else {
      sessionStorage.removeItem('ts_2fa_verified')
    }
  } catch {}
}

/**
 * Invalidates the local in-memory cache and session flag. Call after logout so the next
 * is2FAVerified() call hits the server rather than the stale cache.
 */
export function invalidate2FACache(): void {
  _verifiedCache = null
  _cacheSetAt = 0
  try { sessionStorage.removeItem('ts_2fa_verified') } catch {}
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

    const text = await res.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      return {
        success: false,
        error: `Server Error (${res.status}): ${text.slice(0, 150) || res.statusText || 'Unable to connect to verification service.'}`,
      }
    }

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
 *
 * On success the server:
 *   1. Invalidates the OTP (single-use, replay-proof)
 *   2. Sets a `ts_otp_verified` HttpOnly cookie (JS-inaccessible)
 *   3. Returns { success: true } — no token in the response body
 *
 * The client-side cache is refreshed so subsequent is2FAVerified() calls
 * return true immediately without an extra round trip.
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
      credentials: 'same-origin', // include + store the Set-Cookie response
      body: JSON.stringify({ code: code.trim(), idToken }),
    })

    const text = await res.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      return {
        success: false,
        error: `Server Error (${res.status}): ${text.slice(0, 150) || res.statusText || 'Unable to verify authentication code.'}`,
      }
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid verification code.',
        remainingAttempts: data.remainingAttempts,
      }
    }

    // Warm up the local cache: verification was just confirmed server-side
    _verifiedCache = true
    _cacheSetAt = Date.now()
    try { sessionStorage.setItem('ts_2fa_verified', '1') } catch {}

    return { success: true }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error submitting verification code.',
    }
  }
}

/**
 * Calls the server logout endpoint to expire the HttpOnly cookie and clears
 * the local in-memory cache. Should be called alongside Firebase sign-out.
 */
export async function clearOtpSession(): Promise<void> {
  invalidate2FACache()
  try {
    await fetch('/api/auth/session-logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
  } catch {
    // Best-effort: the cookie has an 8-hour natural expiry anyway
  }
}
