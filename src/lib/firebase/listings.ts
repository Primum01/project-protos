import { doc, getFirestore, orderBy, runTransaction, where } from 'firebase/firestore'
import type { Listing, ListingFormData } from '@/types/listing'
import { deleteDocument, getDocument, setDocument, subscribeCollection } from './firestore'
import { generateUUID } from '@/lib/uuid'
import { getFirebaseApp } from './config'
import {
  allocateAccountNumberInTransaction,
  isValidAccountNumber,
  resolveLocationPrefixes,
} from '@/lib/accountNumber'

const COL = 'listings'

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
    await setDocument(COL, id, { ...data, id, createdAt: now, updatedAt: now })
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
    transaction.set(listingRef, {
      ...data,
      id,
      accountNumber: allocation.accountNumber,
      createdAt: now,
      updatedAt: now,
    })
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
}

/** Permanently delete a listing. */
export async function deleteListing(id: string): Promise<void> {
  await deleteDocument(COL, id)
}

/** Fetch a single listing by ID. */
export async function getListingById(id: string): Promise<Listing | null> {
  return getDocument<Listing>(COL, id)
}

/**
 * Subscribe to ALL listings ordered by creation date descending.
 * Used by the admin panel.
 */
export function subscribeAllListings(callback: (listings: Listing[]) => void) {
  return subscribeCollection<Listing>(COL, callback, orderBy('createdAt', 'desc'))
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
      callback(sorted)
    },
    where('published', '==', true),
  )
}
