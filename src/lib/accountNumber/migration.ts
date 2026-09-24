/**
 * Migration & Backfill Strategy for Property Account Numbers
 *
 * Safely processes existing listings in the database:
 * 1. Synchronizes counters for properties that already have valid account numbers.
 * 2. Assigns sequential account numbers to unassigned properties in chronological
 *    creation order per area.
 * 3. Handles ambiguous location data safely with fallback logging.
 * 4. Supports dry-run inspection before applying writes.
 */

import {
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase/config'
import type { Listing } from '@/types/listing'
import {
  DEFAULT_AREA_PREFIX,
  DEFAULT_COUNTY_PREFIX,
  isValidAccountNumber,
  parseSequenceFromAccountNumber,
  resolveLocationPrefixes,
} from './prefixes'
import { allocateAccountNumberInTransaction } from './generator'

export interface ListingMigrationRecord {
  listingId: string
  name: string
  city: string
  location: string
  previousAccountNumber?: string
  assignedAccountNumber: string
  resolvedCounty: string
  resolvedArea: string
  isAmbiguousFallback: boolean
}

export interface MigrationReport {
  totalListings: number
  alreadyAssignedCount: number
  migratedCount: number
  dryRun: boolean
  countersSynchronized: { counterId: string; maxSequence: number }[]
  records: ListingMigrationRecord[]
}


/**
 * Execute or dry-run backfill of account numbers for all existing listings.
 */
export async function backfillExistingProperties(
  options: { dryRun?: boolean } = {},
): Promise<MigrationReport> {
  const dryRun = options.dryRun ?? false
  const dbInstance = getFirestore(getFirebaseApp())

  // Fetch all listings ordered chronologically by createdAt
  const listingsSnap = await getDocs(
    query(collection(dbInstance, 'listings'), orderBy('createdAt', 'asc')),
  )

  const allListings = listingsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Listing[]

  const alreadyAssigned: Listing[] = []
  const unassigned: Listing[] = []

  // Step 1: Categorize listings
  for (const listing of allListings) {
    if (listing.accountNumber && isValidAccountNumber(listing.accountNumber)) {
      alreadyAssigned.push(listing)
    } else {
      unassigned.push(listing)
    }
  }

  // Step 2: Track max sequence per area from already assigned properties
  // to ensure counters never generate a number smaller than or equal to existing numbers.
  const areaMaxSequences: Record<string, { countyPrefix: string; areaPrefix: string; maxSeq: number }> = {}

  for (const listing of alreadyAssigned) {
    const acc = listing.accountNumber!
    const parts = acc.split('-')
    const county = parts[0]
    const area = parts[1]
    const seq = parseSequenceFromAccountNumber(acc) || 0
    const counterId = `${county}_${area}`

    if (!areaMaxSequences[counterId] || areaMaxSequences[counterId].maxSeq < seq) {
      areaMaxSequences[counterId] = { countyPrefix: county, areaPrefix: area, maxSeq: seq }
    }
  }

  // Synchronize counters in database for existing assigned listings
  const countersSynchronized: { counterId: string; maxSequence: number }[] = []

  if (!dryRun) {
    for (const [counterId, { countyPrefix, areaPrefix, maxSeq }] of Object.entries(areaMaxSequences)) {
      const counterRef = doc(dbInstance, 'property_counters', counterId)
      await runTransaction(dbInstance, async (t) => {
        const snap = await t.get(counterRef)
        const current = snap.exists() ? (snap.data().currentSequence || 0) : 0
        if (current < maxSeq) {
          t.set(
            counterRef,
            {
              countyPrefix,
              areaPrefix,
              currentSequence: maxSeq,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          )
        }
      })
      countersSynchronized.push({ counterId, maxSequence: maxSeq })
    }
  } else {
    for (const [counterId, { maxSeq }] of Object.entries(areaMaxSequences)) {
      countersSynchronized.push({ counterId, maxSequence: maxSeq })
    }
  }

  // Step 3: Sequentially assign account numbers to unassigned listings in creation order
  const migratedRecords: ListingMigrationRecord[] = []

  for (const listing of unassigned) {
    const resolved = resolveLocationPrefixes(listing.city, listing.location)
    const isAmbiguous =
      resolved.countyPrefix === DEFAULT_COUNTY_PREFIX &&
      resolved.areaPrefix === DEFAULT_AREA_PREFIX &&
      (!listing.city || !listing.location)

    if (dryRun) {
      // Simulate next sequence in memory
      const counterId = resolved.counterId
      const currentArea = areaMaxSequences[counterId] || {
        countyPrefix: resolved.countyPrefix,
        areaPrefix: resolved.areaPrefix,
        maxSeq: 0,
      }
      currentArea.maxSeq += 1
      areaMaxSequences[counterId] = currentArea

      const simulatedSeqStr =
        currentArea.maxSeq < 10000 ? String(currentArea.maxSeq).padStart(4, '0') : String(currentArea.maxSeq)
      const simulatedAcc = `${resolved.countyPrefix}-${resolved.areaPrefix}-${simulatedSeqStr}`

      migratedRecords.push({
        listingId: listing.id,
        name: listing.name,
        city: listing.city,
        location: listing.location,
        previousAccountNumber: listing.accountNumber,
        assignedAccountNumber: simulatedAcc,
        resolvedCounty: resolved.canonicalCounty,
        resolvedArea: resolved.canonicalArea,
        isAmbiguousFallback: isAmbiguous,
      })
    } else {
      // Execute atomic transaction for this listing
      const result = await runTransaction(dbInstance, async (transaction) => {
        const alloc = await allocateAccountNumberInTransaction(
          transaction,
          dbInstance,
          resolved.countyPrefix,
          resolved.areaPrefix,
          listing.id,
          {
            canonicalCounty: resolved.canonicalCounty,
            canonicalArea: resolved.canonicalArea,
          },
        )

        const listingRef = doc(dbInstance, 'listings', listing.id)
        transaction.update(listingRef, {
          accountNumber: alloc.accountNumber,
          updatedAt: new Date().toISOString(),
        })

        return alloc
      })

      migratedRecords.push({
        listingId: listing.id,
        name: listing.name,
        city: listing.city,
        location: listing.location,
        previousAccountNumber: listing.accountNumber,
        assignedAccountNumber: result.accountNumber,
        resolvedCounty: resolved.canonicalCounty,
        resolvedArea: resolved.canonicalArea,
        isAmbiguousFallback: isAmbiguous,
      })
    }
  }

  return {
    totalListings: allListings.length,
    alreadyAssignedCount: alreadyAssigned.length,
    migratedCount: migratedRecords.length,
    dryRun,
    countersSynchronized,
    records: migratedRecords,
  }
}
