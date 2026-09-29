import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  StandardLocationProvider,
  rankLocations,
  calculateLocationScore,
  locationQueryCache,
  ALL_STANDARD_LOCATIONS,
  KENYA_CITIES_AND_TOWNS,
  KENYA_COUNTIES,
  COUNTRIES,
} from '../src/lib/location/index.ts'
import suggestHandler from '../api/locations/suggest.ts'
import { resolveLocationPrefixes } from '../src/lib/accountNumber/prefixes.ts'

describe('Location Autocomplete & Suggestion System', () => {
  const provider = new StandardLocationProvider()

  // ── 1. Progressive Narrowing Matches (Prompt Specified Examples) ───────────
  describe('Progressive Typing & Narrowing (N -> Na -> Nai -> Nair)', () => {
    it('Typing "N" returns Nairobi, Nakuru, Naivasha, Nyeri at the top', async () => {
      const results = await provider.search({ query: 'N', limit: 8 })
      assert.ok(results.length > 0, 'Expected results for "N"')

      const names = results.map((r) => r.name)
      // All top results must start with 'N'
      for (const name of names) {
        assert.ok(
          name.toLowerCase().startsWith('n'),
          `Expected "${name}" to start with "N"`,
        )
      }

      // Check key Kenyan hubs starting with N
      assert.ok(names.includes('Nairobi'), 'Expected Nairobi in results for "N"')
      assert.ok(names.includes('Nakuru'), 'Expected Nakuru in results for "N"')
      assert.ok(names.includes('Naivasha'), 'Expected Naivasha in results for "N"')
      assert.ok(names.includes('Nyeri'), 'Expected Nyeri in results for "N"')
    })

    it('Typing "Na" narrows down to Nairobi, Nakuru, Naivasha, Nanyuki', async () => {
      const results = await provider.search({ query: 'Na', limit: 8 })
      assert.ok(results.length > 0)

      const names = results.map((r) => r.name)
      for (const name of names) {
        assert.ok(
          name.toLowerCase().startsWith('na'),
          `Expected "${name}" to start with "Na"`,
        )
      }

      assert.ok(names.includes('Nairobi'))
      assert.ok(names.includes('Nakuru'))
      assert.ok(names.includes('Naivasha'))
      assert.ok(names.includes('Nanyuki'))
      assert.ok(!names.includes('Nyeri'), 'Nyeri should not appear when typing "Na"')
    })

    it('Typing "Nai" narrows down to Nairobi and Naivasha', async () => {
      const results = await provider.search({ query: 'Nai', limit: 8 })
      assert.ok(results.length > 0)

      const names = results.map((r) => r.name)
      for (const name of names) {
        assert.ok(
          name.toLowerCase().startsWith('nai'),
          `Expected "${name}" to start with "Nai"`,
        )
      }

      assert.ok(names.includes('Nairobi'))
      assert.ok(names.includes('Naivasha'))
      assert.ok(!names.includes('Nakuru'), 'Nakuru should not appear when typing "Nai"')
    })

    it('Typing "Nair" isolates Nairobi as top result', async () => {
      const results = await provider.search({ query: 'Nair', limit: 8 })
      assert.ok(results.length > 0)
      assert.equal(results[0].name, 'Nairobi')
    })
  })

  // ── 2. Prefix Matching Strictly Prioritized over Mid-String Substrings ─────
  describe('Prefix Matching Prioritization', () => {
    it('Prioritizes locations starting with query over locations containing it in middle', () => {
      // Mock test candidates: one starts with "nai", one has "nai" in middle
      const candidates = [
        {
          id: 'test-mid',
          name: 'Sinai Estate',
          displayName: 'Sinai Estate, Kenya',
          type: 'area',
          country: 'Kenya',
          countryCode: 'KE',
        },
        {
          id: 'test-prefix',
          name: 'Nairobi',
          displayName: 'Nairobi, Kenya',
          type: 'city',
          country: 'Kenya',
          countryCode: 'KE',
        },
      ]

      const ranked = rankLocations(candidates, { query: 'nai' })
      assert.equal(ranked.length, 2)
      assert.equal(ranked[0].name, 'Nairobi', 'Prefix match should rank first')
      assert.equal(ranked[1].name, 'Sinai Estate', 'Substring match should rank second')
    })

    it('Calculates higher score for prefix match than substring match', () => {
      const prefixItem = {
        id: '1',
        name: 'Westlands',
        displayName: 'Westlands, Nairobi',
        type: 'area',
        country: 'Kenya',
        countryCode: 'KE',
      }
      const midItem = {
        id: '2',
        name: 'Lower Midwest',
        displayName: 'Lower Midwest',
        type: 'area',
        country: 'Kenya',
        countryCode: 'KE',
      }

      const scorePrefix = calculateLocationScore(prefixItem, 'west')
      const scoreMid = calculateLocationScore(midItem, 'west')

      assert.ok(
        scorePrefix > scoreMid,
        `Prefix score (${scorePrefix}) must be greater than substring score (${scoreMid})`,
      )
    })
  })

  // ── 3. Case Insensitivity & Whitespace Resiliency ──────────────────────────
  describe('Case Insensitivity & Query Sanitization', () => {
    it('Matches regardless of casing', async () => {
      const queries = ['mombasa', 'MOMBASA', 'Mombasa', 'mOmBaSa']
      for (const q of queries) {
        const results = await provider.search({ query: q, limit: 5 })
        assert.ok(results.length > 0, `Expected results for "${q}"`)
        assert.equal(results[0].name, 'Mombasa')
      }
    })

    it('Trims leading and trailing spaces safely', async () => {
      const results = await provider.search({ query: '   kilimani   ', limit: 5 })
      assert.ok(results.length > 0)
      assert.equal(results[0].name, 'Kilimani')
    })

    it('Safely handles empty input, whitespace, and special characters', async () => {
      assert.deepEqual(await provider.search({ query: '' }), [])
      assert.deepEqual(await provider.search({ query: '    ' }), [])
      assert.deepEqual(await provider.search({ query: '!!!@@@###$$$' }), [])
    })

    it('Returns empty array for non-matching very long queries without throwing', async () => {
      const longQuery = 'x'.repeat(100)
      const results = await provider.search({ query: longQuery })
      assert.deepEqual(results, [])
    })
  })

  // ── 4. Type Filtering (city, county, country, property) ───────────────────
  describe('Semantic Type Filtering', () => {
    it('Filters for cities only', async () => {
      const results = await provider.search({ query: 'nairobi', type: 'city' })
      assert.ok(results.length > 0)
      for (const r of results) {
        assert.equal(r.type, 'city', `Expected type "city", got "${r.type}" for ${r.name}`)
      }
    })

    it('Filters for counties only', async () => {
      const results = await provider.search({ query: 'nairobi', type: 'county' })
      assert.ok(results.length > 0)
      for (const r of results) {
        assert.equal(r.type, 'county', `Expected type "county", got "${r.type}" for ${r.name}`)
      }
      assert.equal(results[0].name, 'Nairobi County')
    })

    it('Filters for countries only', async () => {
      const results = await provider.search({ query: 'ken', type: 'country' })
      assert.ok(results.length > 0)
      for (const r of results) {
        assert.equal(r.type, 'country')
      }
      assert.equal(results[0].name, 'Kenya')
    })

    it('Filters for properties (matches areas, cities, addresses)', async () => {
      const results = await provider.search({ query: 'westlands', type: 'property' })
      assert.ok(results.length > 0)
      assert.equal(results[0].name, 'Westlands')
      assert.equal(results[0].type, 'area')
    })
  })

  // ── 5. Standardized Dataset Completeness ──────────────────────────────────
  describe('Geographic Dataset Coverage', () => {
    it('Includes all 47 Kenyan Counties', () => {
      assert.equal(KENYA_COUNTIES.length, 47, 'Expected exactly 47 Kenyan Counties')
      const countyNames = KENYA_COUNTIES.map((c) => c.name)
      assert.ok(countyNames.includes('Nairobi County'))
      assert.ok(countyNames.includes('Mombasa County'))
      assert.ok(countyNames.includes('Kisumu County'))
      assert.ok(countyNames.includes('Nakuru County'))
      assert.ok(countyNames.includes('Kiambu County'))
      assert.ok(countyNames.includes('Uasin Gishu County'))
    })

    it('Includes key Kenyan real estate areas', () => {
      const areas = ALL_STANDARD_LOCATIONS.filter((l) => l.type === 'area').map((l) => l.name)
      assert.ok(areas.includes('Westlands'))
      assert.ok(areas.includes('Kilimani'))
      assert.ok(areas.includes('Kileleshwa'))
      assert.ok(areas.includes('Karen'))
      assert.ok(areas.includes('Lavington'))
      assert.ok(areas.includes('Runda'))
      assert.ok(areas.includes('Parklands'))
      assert.ok(areas.includes('Ruaka'))
      assert.ok(areas.includes('Syokimau'))
      assert.ok(areas.includes('Nyali'))
      assert.ok(areas.includes('Diani Beach Road'))
    })

    it('Includes standard global countries', () => {
      const countries = COUNTRIES.map((c) => c.name)
      assert.ok(countries.includes('Kenya'))
      assert.ok(countries.includes('Uganda'))
      assert.ok(countries.includes('Tanzania'))
      assert.ok(countries.includes('Rwanda'))
      assert.ok(countries.includes('United Arab Emirates'))
      assert.ok(countries.includes('United Kingdom'))
      assert.ok(countries.includes('United States'))
    })
  })

  // ── 6. Query Caching & Debounce Optimization ──────────────────────────────
  describe('Query Caching & Deduplication', () => {
    it('Caches search queries in memory', () => {
      locationQueryCache.clear()
      const searchOpts = { query: 'karen', type: 'property', limit: 5 }

      assert.equal(locationQueryCache.get(searchOpts), null, 'Cache must be empty initially')

      const dummyResults = [{ id: '1', name: 'Karen', displayName: 'Karen', type: 'area', country: 'Kenya', countryCode: 'KE' }]
      locationQueryCache.set(searchOpts, dummyResults)

      const retrieved = locationQueryCache.get(searchOpts)
      assert.deepEqual(retrieved, dummyResults, 'Cache must return stored results')
    })
  })

  // ── 7. Serverless API Endpoint Handler ────────────────────────────────────
  describe('Serverless API Endpoint (/api/locations/suggest)', () => {
    it('Rejects non-GET requests with 405 Method Not Allowed', () => {
      let statusCode = 0
      let responseBody = null
      let allowHeader = ''

      const req = { method: 'POST', query: {} }
      const res = {
        setHeader: (k, v) => { if (k === 'Allow') allowHeader = v },
        status: (code) => {
          statusCode = code
          return {
            json: (body) => { responseBody = body },
          }
        },
      }

      suggestHandler(req, res)
      assert.equal(statusCode, 405)
      assert.equal(allowHeader, 'GET, HEAD')
      assert.equal(responseBody.error, 'Method Not Allowed')
    })

    it('Processes valid GET queries with caching headers and standardized results', () => {
      let statusCode = 0
      let responseBody = null
      const headers = {}

      const req = {
        method: 'GET',
        query: { q: 'Nai', type: 'city' },
        headers: { 'x-forwarded-for': '127.0.0.1' },
      }
      const res = {
        setHeader: (k, v) => { headers[k] = v },
        status: (code) => {
          statusCode = code
          return {
            json: (body) => { responseBody = body },
          }
        },
      }

      suggestHandler(req, res)
      assert.equal(statusCode, 200)
      assert.ok(headers['Cache-Control'].includes('public'))
      assert.equal(responseBody.success, true)
      assert.equal(responseBody.query, 'Nai')
      assert.ok(responseBody.count > 0)
      assert.ok(responseBody.suggestions.some((s) => s.name === 'Nairobi'))
    })
  })

  // ── 8. Integration with Account Number Prefix System ──────────────────────
  describe('Integration with Property Account Number Resolution', () => {
    it('Standardized suggestions map cleanly to canonical prefixes', () => {
      // Selected suggestion: City="Nairobi", Location="Westlands"
      const res1 = resolveLocationPrefixes('Nairobi', 'Westlands')
      assert.equal(res1.countyPrefix, 'NRB')
      assert.equal(res1.areaPrefix, 'WES')
      assert.equal(res1.canonicalCounty, 'Nairobi')
      assert.equal(res1.canonicalArea, 'Westlands')

      // Selected suggestion: City="Mombasa", Location="Nyali"
      const res2 = resolveLocationPrefixes('Mombasa', 'Nyali')
      assert.equal(res2.countyPrefix, 'MSA')
      assert.equal(res2.areaPrefix, 'NYA')

      // Selected suggestion: City="Nakuru", Location="Naivasha"
      const res3 = resolveLocationPrefixes('Nakuru', 'Naivasha')
      assert.equal(res3.countyPrefix, 'NAK')
      assert.equal(res3.areaPrefix, 'NVS')
    })
  })
})
