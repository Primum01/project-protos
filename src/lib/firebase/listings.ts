import { orderBy, where } from 'firebase/firestore'
import type { Listing, ListingFormData } from '@/types/listing'
import { deleteDocument, getDocument, setDocument, subscribeCollection } from './firestore'

const COL = 'listings'

/** Create a new listing. Returns the generated ID. */
export async function createListing(data: ListingFormData): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await setDocument(COL, id, { ...data, id, createdAt: now, updatedAt: now })
  return id
}

/** Merge-update fields on an existing listing. */
export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<void> {
  await setDocument(COL, id, { ...data, updatedAt: new Date().toISOString() })
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
