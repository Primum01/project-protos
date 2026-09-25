// Vercel Serverless Function: Health Check Endpoint
// Safe endpoint for uptime monitoring and connectivity verification without exposing environment variables.

export default function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Set security and caching headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  return res.status(200).json({
    status: 'healthy',
    service: 'twinspace-api',
    timestamp: new Date().toISOString(),
  })
}
