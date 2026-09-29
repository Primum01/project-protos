import type { LocationSearchOptions, LocationSuggestion } from './types.ts'

/**
 * Clean & normalize string for uniform matching
 */
export function normalizeQuery(str?: string | null): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates a match score for a location candidate against a search query.
 * Higher score = higher ranking.
 *
 * Scoring priority:
 * 1. Exact match (1000 pts)
 * 2. Primary name starts with query (500-600 pts, shorter names scored slightly higher)
 * 3. Word in name starts with query (400 pts, e.g. "North Nairobi" for "nairobi")
 * 4. Alias starts with query (350 pts)
 * 5. Name contains query substring (150 pts)
 * 6. Alias contains query substring (100 pts)
 * 7. County / displayName contains query (50 pts)
 */
export function calculateLocationScore(item: LocationSuggestion, rawQuery: string): number {
  const query = normalizeQuery(rawQuery)
  if (!query) return 0

  const nameNorm = normalizeQuery(item.name)
  const displayNorm = normalizeQuery(item.displayName)
  const aliasesNorm = (item.aliases || []).map(normalizeQuery)

  // 1. Exact match
  if (nameNorm === query) {
    return 1000
  }

  for (const alias of aliasesNorm) {
    if (alias === query) return 950
  }

  // 2. Primary name STARTS WITH query (Strict Prefix Priority)
  if (nameNorm.startsWith(query)) {
    // Reward closer length match (e.g. "Nairobi" for "Nai" vs "Nairobi Metropolitan Area")
    const lengthDiffPenalty = Math.min(50, (nameNorm.length - query.length) * 2)
    return 600 - lengthDiffPenalty
  }

  // 3. Any individual word in the name starts with query (Word-boundary prefix)
  const words = nameNorm.split(' ')
  for (const w of words) {
    if (w.startsWith(query)) {
      return 450
    }
  }

  // 4. Any alias starts with query
  for (const alias of aliasesNorm) {
    if (alias.startsWith(query)) {
      return 400
    }
    const aliasWords = alias.split(' ')
    for (const aw of aliasWords) {
      if (aw.startsWith(query)) return 380
    }
  }

  // 5. Name contains query anywhere (Substring match - strictly lower than prefix match)
  const subIndex = nameNorm.indexOf(query)
  if (subIndex > -1) {
    return 200 - Math.min(50, subIndex * 5)
  }

  // 6. Alias contains query anywhere
  for (const alias of aliasesNorm) {
    if (alias.includes(query)) {
      return 150
    }
  }

  // 7. Composite query matching against displayName (e.g. "Karen, Nairobi" or "GTC, Westlands")
  if (rawQuery.includes(',') && displayNorm.includes(query)) {
    return 120
  }

  return 0
}

/**
 * Filter and rank location suggestions based on search options.
 */
export function rankLocations(
  locations: LocationSuggestion[],
  options: LocationSearchOptions,
): LocationSuggestion[] {
  const query = normalizeQuery(options.query)
  const limit = options.limit || 8
  const filterType = options.type || 'all'
  const countryFilter = options.country?.toUpperCase()

  if (!query) {
    // If no query, return empty list or top popular locations if requested
    return []
  }

  const scored: { item: LocationSuggestion; score: number }[] = []

  for (const item of locations) {
    // Country filter if specified
    if (countryFilter && item.countryCode !== countryFilter) {
      continue
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'property') {
        // Properties match areas, cities, and specific addresses
        if (item.type !== 'area' && item.type !== 'city' && item.type !== 'property' && item.type !== 'address') {
          continue
        }
      } else if (filterType === 'city') {
        if (item.type !== 'city') continue
      } else if (filterType === 'county') {
        if (item.type !== 'county') continue
      } else if (filterType === 'country') {
        if (item.type !== 'country') continue
      }
    }

    const score = calculateLocationScore(item, query)
    if (score > 0) {
      // Small bonus for Kenya items when TwinSpace operates in Kenya
      const kenyaBoost = item.countryCode === 'KE' ? 10 : 0
      scored.push({ item, score: score + kenyaBoost })
    }
  }

  // Sort descending by score; if tied, sort alphabetically by name
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.item.name.localeCompare(b.item.name)
  })

  // Deduplicate by name and type to prevent duplicate suggestions
  const seen = new Set<string>()
  const results: LocationSuggestion[] = []

  for (const entry of scored) {
    const key = `${entry.item.name.toLowerCase()}_${entry.item.type}_${entry.item.county || ''}_${entry.item.countryCode}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push(entry.item)
      if (results.length >= limit) break
    }
  }

  return results
}
