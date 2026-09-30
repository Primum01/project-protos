/**
 * POST /api/auth/session-logout
 *
 * Clears the `ts_otp_verified` HttpOnly session cookie by setting it to an
 * expired, empty value. This is the server-side counterpart to the client-side
 * Firebase sign-out flow.
 *
 * Must be called with a POST request (GET is blocked to prevent CSRF via image tags etc.)
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  // No-cache: prevent auth state from being cached
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')

  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (req.headers.host || '').includes('twinspace360.com')

  // Expire the cookie immediately by setting Max-Age=0
  const cookieParts = [
    'ts_otp_verified=',
    'Max-Age=0',
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Strict',
  ]
  if (isProduction) cookieParts.push('Secure')

  res.setHeader('Set-Cookie', cookieParts.join('; '))

  return res.status(200).json({ success: true, message: 'Session cookie cleared.' })
}
