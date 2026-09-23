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
      url.searchParams.set('play', '1')
      url.searchParams.set('qs', '1')
      url.searchParams.set('brand', '0')
      url.searchParams.set('title', '0')
      url.searchParams.set('tourcta', '0')
      url.searchParams.set('help', '0')
      url.searchParams.set('hl', '0')
      url.searchParams.delete('nt')
      return url.toString()
    } catch {
      return src
    }
  }

  return src
}
