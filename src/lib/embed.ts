/**
 * Extracts a valid HTTPS embed URL from an iframe embed snippet or raw tour URL.
 * Handles Matterport, Kuula, and standard 3D viewer iframe codes.
 */
export function extractEmbedSrc(input?: string | null): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (!trimmed) return ''

  // 1. Try extracting src from an <iframe ... src="..."> snippet
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1]
  }

  // 2. If it's already a direct web URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return ''
}
