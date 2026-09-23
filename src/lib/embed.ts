/**
 * Extracts a valid HTTPS embed URL from an iframe embed snippet or raw tour URL.
 * Handles Matterport, Kuula, and standard 3D viewer iframe codes.
 */
export function extractEmbedSrc(input?: string | null): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (!trimmed) return ''

  // 1. Try extracting src from an <iframe ... src="..."> snippet
  let src = ''
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcMatch && srcMatch[1]) {
    src = srcMatch[1]
  } else if (/^https?:\/\//i.test(trimmed)) {
    src = trimmed
  }

  if (src && src.includes('my.matterport.com/show/')) {
    try {
      const url = new URL(src)
      if (!url.searchParams.has('nt')) {
        url.searchParams.set('nt', '0')
      }
      return url.toString()
    } catch {
      return src
    }
  }

  return src
}
