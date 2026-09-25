// Vercel Serverless Function: Secure Contact Form Submission Handler
// Validates parameters, enforces rate limiting, and securely stores contact submissions.

interface RateLimitRecord {
  count: number
  firstRequestTime: number
}

// In-memory sliding window store for rate limiting (per serverless instance)
const rateLimitStore = new Map<string, RateLimitRecord>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record) {
    rateLimitStore.set(ip, { count: 1, firstRequestTime: now })
    return false
  }

  if (now - record.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
    // Window expired, reset
    rateLimitStore.set(ip, { count: 1, firstRequestTime: now })
    return false
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  record.count += 1
  return false
}

// Clean up stale IP records periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now - record.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip)
    }
  }
}, 30 * 60 * 1000).unref?.()

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // 1. Enforce POST method only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are permitted.' })
  }

  // 2. Identify client IP for rate limiting
  const forwarded = req.headers['x-forwarded-for']
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : (req.headers['x-real-ip'] as string) || req.socket?.remoteAddress || 'unknown'

  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', '900')
    return res.status(429).json({
      error: 'Too many requests. Please wait a few minutes before submitting another inquiry, or email us directly at info@twinspace360.com.',
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { name, email, phone, message, _gotcha } = body

    // 3. Honeypot check for spam bots
    if (_gotcha) {
      // Silently succeed to fool dumb spam bots without saving garbage
      return res.status(200).json({ success: true, message: 'Message received.' })
    }

    // 4. Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' })
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must not exceed 100 characters.' })
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' })
    }
    if (email.trim().length > 150) {
      return res.status(400).json({ error: 'Email must not exceed 150 characters.' })
    }

    if (phone && (typeof phone !== 'string' || phone.trim().length > 30)) {
      return res.status(400).json({ error: 'Phone number must not exceed 30 characters.' })
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a message with at least 5 characters.' })
    }
    if (message.trim().length > 3000) {
      return res.status(400).json({ error: 'Message must not exceed 3,000 characters.' })
    }

    // Strip HTML tags from strings to neutralize injection vectors
    const cleanStr = (s: string) => s.replace(/[<>]/g, '').trim()

    const sanitizedData = {
      name: cleanStr(name),
      email: email.trim().toLowerCase(),
      phone: phone ? cleanStr(phone) : '',
      message: cleanStr(message),
      submittedAt: new Date().toISOString(),
      clientIp: clientIp === 'unknown' ? '' : clientIp,
    }

    // 5. Store message server-side if Firebase REST / Admin configuration is present
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'twinspace-c113c'
    const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY

    if (projectId && apiKey) {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/messages?key=${apiKey}`
      
      const firestorePayload = {
        fields: {
          name: { stringValue: sanitizedData.name },
          email: { stringValue: sanitizedData.email },
          phone: { stringValue: sanitizedData.phone },
          message: { stringValue: sanitizedData.message },
          read: { booleanValue: false },
          createdAt: { stringValue: sanitizedData.submittedAt },
        },
      }

      const dbRes = await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload),
      })

      if (!dbRes.ok) {
        console.error('[api/contact] Failed to store message in Firestore:', dbRes.status)
        // If Firestore rejected the direct REST write, log securely without exposing to user
      }
    }

    // 6. Return strictly minimal, safe response without exposing credentials or internal errors
    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received and our team will get back to you shortly.',
    })
  } catch (err) {
    console.error('[api/contact] Unexpected error:', err)
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request. Please try again or email us directly at info@twinspace360.com.',
    })
  }
}
