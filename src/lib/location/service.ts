import { ALL_STANDARD_LOCATIONS } from './dataset.ts'
import { rankLocations } from './ranking.ts'
import type { LocationProvider, LocationSearchOptions, LocationSuggestion } from './types.ts'

/**
 * Standard Built-in Dataset Provider
 * High performance, zero latency, guaranteed offline availability.
 */
export class StandardLocationProvider implements LocationProvider {
  name = 'standard'
  private locations: LocationSuggestion[]

  constructor(customLocations?: LocationSuggestion[]) {
    this.locations = customLocations || ALL_STANDARD_LOCATIONS
  }

  async search(options: LocationSearchOptions): Promise<LocationSuggestion[]> {
    return rankLocations(this.locations, options)
  }

  searchSync(options: LocationSearchOptions): LocationSuggestion[] {
    return rankLocations(this.locations, options)
  }
}

/**
 * In-memory LRU Cache for search query results
 */
class QueryCache {
  private cache = new Map<string, { timestamp: number; data: LocationSuggestion[] }>()
  private maxSize: number
  private ttlMs: number

  constructor(maxSize = 250, ttlMs = 10 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  private makeKey(options: LocationSearchOptions): string {
    return `${(options.query || '').trim().toLowerCase()}|${options.type || 'all'}|${options.country || ''}|${options.limit || 8}`
  }

  get(options: LocationSearchOptions): LocationSuggestion[] | null {
    const key = this.makeKey(options)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return null
    }
    // Refresh LRU order
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data
  }

  set(options: LocationSearchOptions, data: LocationSuggestion[]): void {
    const key = this.makeKey(options)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
    this.cache.set(key, { timestamp: Date.now(), data })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const locationQueryCache = new QueryCache()

/**
 * Server API Location Provider
 * Routes through secure /api/locations/suggest endpoint to avoid exposing any secret API keys
 * and to benefit from edge caching and server rate limits.
 */
export class ApiLocationProvider implements LocationProvider {
  name = 'api'
  private fallbackProvider: StandardLocationProvider

  constructor(fallbackProvider = new StandardLocationProvider()) {
    this.fallbackProvider = fallbackProvider
  }

  async search(options: LocationSearchOptions): Promise<LocationSuggestion[]> {
    const query = options.query?.trim()
    if (!query) return []

    // 1. Check in-memory client cache
    const cached = locationQueryCache.get(options)
    if (cached) {
      return cached
    }

    try {
      const params = new URLSearchParams({
        q: query,
        type: options.type || 'all',
        limit: String(options.limit || 8),
      })
      if (options.country) {
        params.append('country', options.country)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500) // 3.5s timeout

      const res = await fetch(`/api/locations/suggest?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const body = await res.json()
        if (body.success && Array.isArray(body.suggestions)) {
          locationQueryCache.set(options, body.suggestions)
          return body.suggestions
        }
      }

      // If response not ok or invalid JSON, fall back to built-in standard dataset
      const fallback = await this.fallbackProvider.search(options)
      locationQueryCache.set(options, fallback)
      return fallback
    } catch {
      // In case of network error, fetch aborted, or running in local test environment without dev API server:
      const fallback = await this.fallbackProvider.search(options)
      locationQueryCache.set(options, fallback)
      return fallback
    }
  }
}

/**
 * Hybrid Location Provider
 * Combines instantaneous local dataset matching with server API enrichment.
 */
export class HybridLocationProvider implements LocationProvider {
  name = 'hybrid'
  private standardProvider: StandardLocationProvider
  private apiProvider: ApiLocationProvider

  constructor() {
    this.standardProvider = new StandardLocationProvider()
    this.apiProvider = new ApiLocationProvider(this.standardProvider)
  }

  /**
   * Fast synchronous search for immediate keystroke feedback
   */
  searchSync(options: LocationSearchOptions): LocationSuggestion[] {
    return this.standardProvider.searchSync(options)
  }

  /**
   * Asynchronous search that queries cached or server results
   */
  async search(options: LocationSearchOptions): Promise<LocationSuggestion[]> {
    const cached = locationQueryCache.get(options)
    if (cached) return cached

    // Try API provider (which automatically falls back to standard on error/offline)
    return this.apiProvider.search(options)
  }
}

// Singleton global provider instance
let activeProvider: LocationProvider = new HybridLocationProvider()

/**
 * Set or replace the global location provider
 */
export function setLocationProvider(provider: LocationProvider): void {
  activeProvider = provider
}

/**
 * Get current global location provider
 */
export function getLocationProvider(): LocationProvider {
  return activeProvider
}

/**
 * Search locations using current active provider
 */
export async function searchLocations(options: LocationSearchOptions): Promise<LocationSuggestion[]> {
  return activeProvider.search(options)
}

/**
 * Immediate synchronous search using standard dataset (0ms latency)
 */
export function searchLocationsImmediate(options: LocationSearchOptions): LocationSuggestion[] {
  if ('searchSync' in activeProvider && typeof (activeProvider as any).searchSync === 'function') {
    return (activeProvider as any).searchSync(options)
  }
  const standard = new StandardLocationProvider()
  return standard.searchSync(options)
}
