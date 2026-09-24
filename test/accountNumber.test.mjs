import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  resolveCountyPrefix,
  resolveAreaPrefix,
  resolveLocationPrefixes,
  formatAccountNumber,
  isValidAccountNumber,
  cleanLocationString,
  ACCOUNT_NUMBER_REGEX,
  parseSequenceFromAccountNumber,
} from '../src/lib/accountNumber/prefixes.ts'


describe('Property Account Number System', () => {
  // ── 1. Prefix Normalization & Case Insensitivity ──────────────────────────
  describe('Prefix Normalization & Case Insensitivity', () => {
    it('Different capitalization of an area resolves to the same prefix', () => {
      const cases = ['Karen', 'KAREN', 'karen', '  karen  ', 'KaReN']
      for (const input of cases) {
        const res = resolveAreaPrefix(input)
        assert.equal(
          res.prefix,
          'KAR',
          `Expected "${input}" to resolve to "KAR", but got "${res.prefix}"`,
        )
      }
    })

    it('Resolves standard canonical areas accurately', () => {
      assert.equal(resolveAreaPrefix('Kilimani').prefix, 'KIL')
      assert.equal(resolveAreaPrefix('Westlands').prefix, 'WES')
      assert.equal(resolveAreaPrefix('Lavington').prefix, 'LAV')
      assert.equal(resolveAreaPrefix('Parklands').prefix, 'PRK')
      assert.equal(resolveAreaPrefix('Nyali').prefix, 'NYA')
      assert.equal(resolveAreaPrefix('Diani').prefix, 'DIA')
      assert.equal(resolveAreaPrefix('Ruaka').prefix, 'RUA')
    })

    it('Resolves area correctly from composite address strings', () => {
      const complexAddress = 'GTC Office Tower, 14th Floor, Westlands, Nairobi'
      const res = resolveLocationPrefixes('Nairobi', complexAddress)
      assert.equal(res.countyPrefix, 'NRB')
      assert.equal(res.areaPrefix, 'WES')
      assert.equal(res.canonicalArea, 'Westlands')
    })

    it('Resolves county prefix accurately', () => {
      assert.equal(resolveCountyPrefix('Nairobi').prefix, 'NRB')
      assert.equal(resolveCountyPrefix('NAIROBI').prefix, 'NRB')
      assert.equal(resolveCountyPrefix('Mombasa').prefix, 'MSA')
      assert.equal(resolveCountyPrefix('Kisumu').prefix, 'KSM')
      assert.equal(resolveCountyPrefix('Nakuru').prefix, 'NAK')
    })

    it('Invalid/missing location data is handled safely with canonical fallbacks', () => {
      const emptyRes = resolveLocationPrefixes('', '')
      assert.equal(emptyRes.countyPrefix, 'NRB')
      assert.equal(emptyRes.areaPrefix, 'GEN')

      const nullRes = resolveLocationPrefixes(null, null)
      assert.equal(nullRes.countyPrefix, 'NRB')
      assert.equal(nullRes.areaPrefix, 'GEN')

      const undefinedRes = resolveLocationPrefixes(undefined, undefined)
      assert.equal(undefinedRes.countyPrefix, 'NRB')
      assert.equal(undefinedRes.areaPrefix, 'GEN')
    })
  })

  // ── 2. Format & Validation Rules ──────────────────────────────────────────
  describe('Format & Validation Rules', () => {
    it('Form matches exactly [COUNTY_PREFIX]-[AREA_PREFIX]-[4_DIGIT_SEQUENCE]', () => {
      assert.equal(formatAccountNumber('NRB', 'KAR', 1), 'NRB-KAR-0001')
      assert.equal(formatAccountNumber('NRB', 'KAR', 2), 'NRB-KAR-0002')
      assert.equal(formatAccountNumber('NRB', 'KIL', 1), 'NRB-KIL-0001')
      assert.equal(formatAccountNumber('MSA', 'NYA', 1), 'MSA-NYA-0001')
      assert.equal(formatAccountNumber('NRB', 'KAR', 10), 'NRB-KAR-0010')
      assert.equal(formatAccountNumber('NRB', 'KAR', 9999), 'NRB-KAR-9999')
    })

    it('Validates legitimate account numbers strictly', () => {
      assert.equal(isValidAccountNumber('NRB-KAR-0001'), true)
      assert.equal(isValidAccountNumber('NRB-KAR-0010'), true)
      assert.equal(isValidAccountNumber('NRB-KIL-0001'), true)
      assert.equal(isValidAccountNumber('MSA-NYA-0001'), true)
    })

    it('Rejects invalid account numbers without proper padding or wrong format', () => {
      assert.equal(isValidAccountNumber('NRB-KAR-1'), false)
      assert.equal(isValidAccountNumber('NRB-KAR-01'), false)
      assert.equal(isValidAccountNumber('NRB-KAR-001'), false)
      assert.equal(isValidAccountNumber('nrb-kar-0001'), false)
      assert.equal(isValidAccountNumber('NRB_KAR_0001'), false)
      assert.equal(isValidAccountNumber('NRBKAR0001'), false)
      assert.equal(isValidAccountNumber(''), false)
      assert.equal(isValidAccountNumber(null), false)
    })

    it('Gracefully handles sequence overflow beyond 9999', () => {
      const overflowAcc = formatAccountNumber('NRB', 'KAR', 10000)
      assert.equal(overflowAcc, 'NRB-KAR-10000')
      assert.equal(isValidAccountNumber(overflowAcc), true)
    })

    it('Parses sequence number accurately from account number', () => {
      assert.equal(parseSequenceFromAccountNumber('NRB-KAR-0004'), 4)
      assert.equal(parseSequenceFromAccountNumber('NRB-KAR-0010'), 10)
      assert.equal(parseSequenceFromAccountNumber('NRB-KAR-10000'), 10000)
      assert.equal(parseSequenceFromAccountNumber('invalid'), null)
    })
  })

  // ── 3. Sequence, Concurrency & Monotonicity Simulation ────────────────────
  describe('Sequence, Concurrency & Monotonicity Rules', () => {
    // In-memory atomic store mimicking Firestore transaction & counter behavior
    class MockFirestoreStore {
      constructor() {
        this.counters = new Map() // key: "NRB_KAR" -> currentSequence
        this.accountNumbers = new Set() // lock set of registered account numbers
        this.listings = new Map() // key: listingId -> listing document
      }

      async allocateTransaction(city, location, listingId) {
        const resolved = resolveLocationPrefixes(city, location)
        const counterKey = `${resolved.countyPrefix}_${resolved.areaPrefix}`

        // Atomic transaction read-modify-write
        let currentSeq = this.counters.get(counterKey) || 0
        let nextSeq = currentSeq + 1
        let accNum = formatAccountNumber(resolved.countyPrefix, resolved.areaPrefix, nextSeq)

        // Monotonic check against taken numbers
        while (this.accountNumbers.has(accNum)) {
          nextSeq += 1
          accNum = formatAccountNumber(resolved.countyPrefix, resolved.areaPrefix, nextSeq)
        }

        // Commit transaction
        this.counters.set(counterKey, nextSeq)
        this.accountNumbers.add(accNum)

        const listingDoc = {
          id: listingId,
          city,
          location,
          accountNumber: accNum,
          name: 'Test Property',
        }
        this.listings.set(listingId, listingDoc)

        return accNum
      }

      deleteListing(listingId) {
        const listing = this.listings.get(listingId)
        if (listing) {
          this.listings.delete(listingId)
          // Notice: We do NOT decrement the counter in this.counters!
          // Deleted account numbers are NEVER reused.
        }
      }

      updateListing(listingId, updates) {
        const listing = this.listings.get(listingId)
        if (!listing) throw new Error('Listing not found')

        // Payment identifier preservation: Never overwrite or regenerate accountNumber
        const { accountNumber: _ignored, ...allowedUpdates } = updates
        Object.assign(listing, allowedUpdates)
        return listing
      }
    }

    it('First property in an area receives sequence 0001', async () => {
      const store = new MockFirestoreStore()
      const acc = await store.allocateTransaction('Nairobi', 'Karen', 'prop-1')
      assert.equal(acc, 'NRB-KAR-0001')
    })

    it('Second property in the same area receives sequence 0002', async () => {
      const store = new MockFirestoreStore()
      const acc1 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-1')
      const acc2 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-2')

      assert.equal(acc1, 'NRB-KAR-0001')
      assert.equal(acc2, 'NRB-KAR-0002')
    })

    it('First property in another area receives its own independent sequence 0001', async () => {
      const store = new MockFirestoreStore()
      const karen1 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-kar-1')
      const karen2 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-kar-2')
      const kilimani1 = await store.allocateTransaction('Nairobi', 'Kilimani', 'prop-kil-1')

      assert.equal(karen1, 'NRB-KAR-0001')
      assert.equal(karen2, 'NRB-KAR-0002')
      // Kilimani has its own independent sequence
      assert.equal(kilimani1, 'NRB-KIL-0001')
    })

    it('Sequence reaches 0010 with correct zero-padding', async () => {
      const store = new MockFirestoreStore()
      let lastAcc = ''
      for (let i = 1; i <= 10; i++) {
        lastAcc = await store.allocateTransaction('Nairobi', 'Westlands', `prop-wes-${i}`)
      }
      assert.equal(lastAcc, 'NRB-WES-0010')
    })

    it('Deleted property does not cause sequence reuse (Monotonically increasing)', async () => {
      const store = new MockFirestoreStore()
      await store.allocateTransaction('Nairobi', 'Karen', 'prop-1') // NRB-KAR-0001
      await store.allocateTransaction('Nairobi', 'Karen', 'prop-2') // NRB-KAR-0002
      await store.allocateTransaction('Nairobi', 'Karen', 'prop-3') // NRB-KAR-0003
      const prop4 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-4') // NRB-KAR-0004
      assert.equal(prop4, 'NRB-KAR-0004')

      // Delete property 4
      store.deleteListing('prop-4')

      // Register the next property in Karen: Must receive NRB-KAR-0005, NOT reuse 0004
      const prop5 = await store.allocateTransaction('Nairobi', 'Karen', 'prop-5')
      assert.equal(prop5, 'NRB-KAR-0005')
      assert.notEqual(prop5, 'NRB-KAR-0004')
    })

    it('Simultaneous property creation does not produce duplicates (Concurrency safety)', async () => {
      const store = new MockFirestoreStore()

      // Spawn 20 concurrent creation promises in the same area
      const promises = []
      for (let i = 1; i <= 20; i++) {
        promises.push(store.allocateTransaction('Nairobi', 'Karen', `concurrent-${i}`))
      }

      const results = await Promise.all(promises)
      const uniqueAccountNumbers = new Set(results)

      // All 20 must be completely distinct
      assert.equal(uniqueAccountNumbers.size, 20)

      // Sequence must span 0001 through 0020
      for (let i = 1; i <= 20; i++) {
        const expected = `NRB-KAR-${String(i).padStart(4, '0')}`
        assert.ok(uniqueAccountNumbers.has(expected), `Missing expected account number ${expected}`)
      }
    })

    it('Duplicate account number is rejected by uniqueness check', async () => {
      const store = new MockFirestoreStore()
      const acc = await store.allocateTransaction('Nairobi', 'Karen', 'prop-1')
      assert.equal(acc, 'NRB-KAR-0001')

      // Attempting to manually force 'NRB-KAR-0001' again must be detected as taken
      assert.equal(store.accountNumbers.has('NRB-KAR-0001'), true)
    })

    it('Property name changes do not change the account number', async () => {
      const store = new MockFirestoreStore()
      const acc = await store.allocateTransaction('Nairobi', 'Karen', 'prop-1')
      assert.equal(acc, 'NRB-KAR-0001')

      // Update property name
      const updated = store.updateListing('prop-1', { name: 'Renamed Luxury Villa' })
      assert.equal(updated.name, 'Renamed Luxury Villa')
      assert.equal(updated.accountNumber, 'NRB-KAR-0001')
    })

    it('Location edits do not silently regenerate an existing account number', async () => {
      const store = new MockFirestoreStore()
      const acc = await store.allocateTransaction('Nairobi', 'Karen', 'prop-1')
      assert.equal(acc, 'NRB-KAR-0001')

      // Edit location from Karen to Kilimani
      const updated = store.updateListing('prop-1', {
        location: 'Argwings Kodhek, Kilimani',
        city: 'Nairobi',
      })

      // The original account number MUST be preserved because it is a payment identifier
      assert.equal(updated.accountNumber, 'NRB-KAR-0001')
      assert.notEqual(updated.accountNumber, 'NRB-KIL-0001')
    })
  })

  // ── 4. Existing Property Migration / Backfill ─────────────────────────────
  describe('Existing Property Migration Strategy', () => {
    it('Assigns sequential numbers in chronological registration order', () => {
      // Sample existing properties without account numbers
      const mockListings = [
        { id: '1', name: 'Early Karen Villa', city: 'Nairobi', location: 'Karen', createdAt: '2026-01-01T10:00:00Z' },
        { id: '2', name: 'Westlands Loft', city: 'Nairobi', location: 'Westlands', createdAt: '2026-01-02T10:00:00Z' },
        { id: '3', name: 'Later Karen Cottage', city: 'Nairobi', location: 'Karen', createdAt: '2026-01-03T10:00:00Z' },
      ]

      // Sort chronologically
      mockListings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      const areaSequences = new Map()
      const migrated = mockListings.map((listing) => {
        const resolved = resolveLocationPrefixes(listing.city, listing.location)
        const key = `${resolved.countyPrefix}_${resolved.areaPrefix}`
        const current = areaSequences.get(key) || 0
        const next = current + 1
        areaSequences.set(key, next)
        return {
          ...listing,
          accountNumber: formatAccountNumber(resolved.countyPrefix, resolved.areaPrefix, next),
        }
      })

      assert.equal(migrated[0].accountNumber, 'NRB-KAR-0001') // Early Karen Villa
      assert.equal(migrated[1].accountNumber, 'NRB-WES-0001') // Westlands Loft
      assert.equal(migrated[2].accountNumber, 'NRB-KAR-0002') // Later Karen Cottage
    })

    it('Area counters synchronize after backfill so new properties do not collide', () => {
      // If backfill established Karen counter at 2
      const karenCounter = 2
      const nextSequence = karenCounter + 1
      const nextAcc = formatAccountNumber('NRB', 'KAR', nextSequence)

      assert.equal(nextAcc, 'NRB-KAR-0003')
    })
  })
})
