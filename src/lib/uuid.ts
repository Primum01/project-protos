/**
 * Secure, cross-environment RFC 4122 v4 UUID generator.
 *
 * Checks in order:
 * 1. native crypto.randomUUID (supported in secure HTTPS contexts in modern browsers & Node 19+)
 * 2. crypto.getRandomValues (supported in Web Cryptography API across older/mobile browsers)
 * 3. High-entropy timestamp + performance.now + Math.random fallback (for non-secure/legacy environments)
 */
export function generateUUID(): string {
  // 1. Native crypto.randomUUID (fastest, standard in secure HTTPS contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // Fall through if native method throws in non-standard context
    }
  }

  // 2. crypto.getRandomValues fallback (fully cryptographic)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      // RFC 4122 section 4.4: set version to 0100 (4) and variant to 10xx
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    } catch {
      // Fall through to Math.random
    }
  }

  // 3. High-entropy pseudo-random fallback compliant with RFC 4122 v4
  let d = Date.now()
  let d2 =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now() * 1000
      : 0

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16
    if (d > 0) {
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else if (d2 > 0) {
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
