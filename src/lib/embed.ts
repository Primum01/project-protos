/**
 * Extracts a valid HTTPS embed URL from an iframe embed snippet or raw tour URL.
 * Handles Matterport, Kuula, and standard 3D viewer iframe codes.
 */
export function extractEmbedSrc(
  input?: string | null,
  options?: { isMobile?: boolean },
): string {
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
      url.searchParams.set('brand', '0')
      url.searchParams.set('title', '0')
      url.searchParams.set('tourcta', '0')
      url.searchParams.set('help', '0')
      url.searchParams.set('hl', '0')
      url.searchParams.delete('nt')

      if (options?.isMobile) {
        // Mobile view: auto-start inline so Matterport skips the mobile redirect splash
        url.searchParams.set('play', '1')
        url.searchParams.set('qs', '1')
      } else {
        // Desktop view: do NOT auto-start; let the user click the play button to start the tour
        url.searchParams.delete('play')
        url.searchParams.delete('qs')
      }

      return url.toString()
    } catch {
      return src
    }
  }

  return src
}

/**
 * Extracts the Matterport model ID from an embed code or tour URL.
 * Matches ?m=MODEL_ID or /models/MODEL_ID
 */
export function extractMatterportModelId(input?: string | null): string | null {
  if (!input) return null
  const trimmed = input.trim()
  const mMatch = trimmed.match(/[?&]m=([a-zA-Z0-9_-]+)/i)
  if (mMatch && mMatch[1]) return mMatch[1]
  const modelsMatch = trimmed.match(/\/models\/([a-zA-Z0-9_-]+)/i)
  if (modelsMatch && modelsMatch[1]) return modelsMatch[1]
  return null
}

/**
 * Returns a high-resolution preview thumbnail image URL for a Matterport space.
 */
export function getMatterportThumbnail(input?: string | null): string | null {
  const modelId = extractMatterportModelId(input)
  if (!modelId) return null
  return `https://my.matterport.com/api/v1/player/models/${modelId}/thumb`
}
