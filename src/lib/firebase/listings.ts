import { doc, getFirestore, orderBy, runTransaction, where } from 'firebase/firestore'
import type { Listing, ListingFormData } from '@/types/listing'
import { deleteDocument, getDocument, removeUndefined, setDocument, subscribeCollection } from './firestore'
import { generateUUID } from '@/lib/uuid'
import { getFirebaseApp } from './config'
import {
  allocateAccountNumberInTransaction,
  isValidAccountNumber,
  resolveLocationPrefixes,
} from '@/lib/accountNumber'

const COL = 'listings'

/** In-memory cache for ultra-fast instant navigation between catalog and tour details */
const listingCache = new Map<string, Listing>()

export function getCachedListing(id: string): Listing | undefined {
  return listingCache.get(id)
}

export function cacheListing(listing: Listing): void {
  if (listing?.id) {
    listingCache.set(listing.id, listing)
  }
}

/**
 * Create a new listing with an atomically generated unique Property Account Number.
 * Format: [COUNTY]-[AREA]-[4_DIGIT_SEQUENCE] (e.g. NRB-KAR-0004)
 *
 * Sequence is per area, monotonically increasing, and transaction-safe.
 */
export async function createListing(data: ListingFormData): Promise<string> {
  const id = generateUUID()
  const now = new Date().toISOString()
  const dbInstance = getFirestore(getFirebaseApp())

  // Check if valid account number was explicitly provided (e.g. administrative migration)
  if (data.accountNumber && isValidAccountNumber(data.accountNumber)) {
    const item = { ...data, id, createdAt: now, updatedAt: now }
    await setDocument(COL, id, item)
    listingCache.set(id, item as Listing)
    return id
  }

  // Atomically generate account number within a Firestore transaction
  const resolved = resolveLocationPrefixes(data.city, data.location)

  await runTransaction(dbInstance, async (transaction) => {
    const allocation = await allocateAccountNumberInTransaction(
      transaction,
      dbInstance,
      resolved.countyPrefix,
      resolved.areaPrefix,
      id,
      {
        canonicalCounty: resolved.canonicalCounty,
        canonicalArea: resolved.canonicalArea,
      },
    )

    const listingRef = doc(dbInstance, COL, id)
    const newDoc = removeUndefined({
      ...data,
      id,
      accountNumber: allocation.accountNumber,
      createdAt: now,
      updatedAt: now,
    })
    transaction.set(listingRef, newDoc)
    listingCache.set(id, newDoc as Listing)
  })

  return id
}

/**
 * Merge-update fields on an existing listing.
 * NOTE: As per payment identifier rules, editing property name or location
 * NEVER regenerates or modifies the permanent accountNumber.
 */
export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Prevent accidental blanking out or overwriting of accountNumber with empty string
  if ('accountNumber' in data && (!data.accountNumber || !isValidAccountNumber(data.accountNumber))) {
    delete updatePayload.accountNumber
  }

  await setDocument(COL, id, updatePayload)
  const existing = listingCache.get(id)
  if (existing) {
    listingCache.set(id, { ...existing, ...updatePayload } as Listing)
  }
}

/** Permanently delete a listing. */
export async function deleteListing(id: string): Promise<void> {
  await deleteDocument(COL, id)
  listingCache.delete(id)
}

/** Fetch a single listing by ID with immediate in-memory cache lookup. */
export async function getListingById(id: string): Promise<Listing | null> {
  const cached = listingCache.get(id)
  if (cached) {
    return cached
  }
  const fetched = await getDocument<Listing>(COL, id)
  if (fetched) {
    listingCache.set(id, fetched)
  }
  return fetched
}

/**
 * Subscribe to ALL listings ordered by creation date descending.
 * Used by the admin panel.
 */
export function subscribeAllListings(callback: (listings: Listing[]) => void) {
  return subscribeCollection<Listing>(
    COL,
    (items) => {
      items.forEach((item) => {
        if (item.id) listingCache.set(item.id, item)
      })
      callback(items)
    },
    orderBy('createdAt', 'desc'),
  )
}

/**
 * Subscribe to published, non-deactivated listings only.
 * Sorting and deactivation filtering are done client-side to avoid composite
 * Firestore index requirements (same pattern used for sort order).
 * Used by the public /tours page.
 */
export function subscribePublishedListings(callback: (listings: Listing[]) => void) {
  return subscribeCollection<Listing>(
    COL,
    (listings) => {
      const sorted = [...listings]
        .filter((l) => !l.deactivated)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      sorted.forEach((l) => {
        if (l.id) listingCache.set(l.id, l)
      })
      callback(sorted)
    },
    where('published', '==', true),
  )
}
