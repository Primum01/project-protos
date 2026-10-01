/**
 * Client Navigation & Stage Persistence Utility
 * 
 * Provides safe, isolated, and validated session stage persistence for public
 * marketing exploration (e.g. preserving listings page number, category,
 * location filter, search query, and scroll position across detail views).
 * 
 * Security Guardrails:
 * - Scoped exclusively to sessionStorage (cleared automatically when tab is closed).
 * - Stores ZERO authentication tokens, credentials, or PII.
 * - Strict schema validation & sanitization on all retrieved values to prevent
 *   injection, prototype pollution, or malformed data attacks.
 * - Non-destructive to admin storage keys.
 */

export interface ToursStage {
  page: number
  tourType: string
  location: string
  search: string
  scrollY: number
  timestamp: number
}

const TOURS_STAGE_KEY = 'ts_tours_stage_v1'
const SCROLL_CACHE_PREFIX = 'ts_scroll_pos_'
const MAX_SEARCH_LENGTH = 100
const MAX_LOCATION_LENGTH = 80
const MAX_TOUR_TYPE_LENGTH = 50
const STAGE_MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours validity within active tab

/**
 * Sanitizes and validates a string to ensure safe bounds and avoid malicious input.
 */
function sanitizeString(val: unknown, maxLength: number): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLength)
}

/**
 * Sanitizes and bounds integer values.
 */
function sanitizeInteger(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || isNaN(val)) return fallback
  return Math.min(Math.max(Math.floor(val), min), max)
}

/**
 * Persists the user's active exploration stage on the tours catalog.
 */
export function saveToursStage(stage: Partial<ToursStage>): void {
  try {
    const existing = getToursStage() || {
      page: 1,
      tourType: 'AirBnB',
      location: '',
      search: '',
      scrollY: 0,
      timestamp: Date.now(),
    }

    const payload: ToursStage = {
      page: sanitizeInteger(stage.page ?? existing.page, 1, 9999, 1),
      tourType: sanitizeString(stage.tourType ?? existing.tourType, MAX_TOUR_TYPE_LENGTH),
      location: sanitizeString(stage.location ?? existing.location, MAX_LOCATION_LENGTH),
      search: sanitizeString(stage.search ?? existing.search, MAX_SEARCH_LENGTH),
      scrollY: sanitizeInteger(stage.scrollY ?? existing.scrollY, 0, 500000, 0),
      timestamp: Date.now(),
    }

    sessionStorage.setItem(TOURS_STAGE_KEY, JSON.stringify(payload))
  } catch {
    // Gracefully handle environments with disabled storage (e.g. strict private browsing)
  }
}

/**
 * Retrieves and validates the user's last saved tours exploration stage.
 */
export function getToursStage(): ToursStage | null {
  try {
    const raw = sessionStorage.getItem(TOURS_STAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null

    // Check expiry
    const timestamp = typeof parsed.timestamp === 'number' ? parsed.timestamp : 0
    if (Date.now() - timestamp > STAGE_MAX_AGE_MS) {
      sessionStorage.removeItem(TOURS_STAGE_KEY)
      return null
    }

    return {
      page: sanitizeInteger(parsed.page, 1, 9999, 1),
      tourType: sanitizeString(parsed.tourType, MAX_TOUR_TYPE_LENGTH) || 'AirBnB',
      location: sanitizeString(parsed.location, MAX_LOCATION_LENGTH),
      search: sanitizeString(parsed.search, MAX_SEARCH_LENGTH),
      scrollY: sanitizeInteger(parsed.scrollY, 0, 500000, 0),
      timestamp,
    }
  } catch {
    return null
  }
}

/**
 * Persists vertical scroll coordinate for any given route pathname.
 */
export function saveRouteScroll(pathname: string, scrollY: number): void {
  try {
    if (!pathname || typeof pathname !== 'string') return
    const safeKey = `${SCROLL_CACHE_PREFIX}${encodeURIComponent(pathname.slice(0, 100))}`
    const boundedY = sanitizeInteger(scrollY, 0, 500000, 0)
    sessionStorage.setItem(safeKey, boundedY.toString())
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Retrieves the saved vertical scroll coordinate for a route pathname.
 */
export function getRouteScroll(pathname: string): number | null {
  try {
    if (!pathname || typeof pathname !== 'string') return null
    const safeKey = `${SCROLL_CACHE_PREFIX}${encodeURIComponent(pathname.slice(0, 100))}`
    const raw = sessionStorage.getItem(safeKey)
    if (raw === null) return null
    const parsed = parseInt(raw, 10)
    return isNaN(parsed) ? null : Math.max(0, parsed)
  } catch {
    return null
  }
}
