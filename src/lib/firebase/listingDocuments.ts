import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseApp, isFirebaseConfigured } from './config'
import { deleteStorageFile, uploadFile } from './storage'
import type { ListingDocument } from '@/types/listing'
import { generateUUID } from '@/lib/uuid'

function db() {
  return getFirestore(getFirebaseApp())
}

/** 10 MB maximum document size. */
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Allowed document mime types. */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

/** Allowed document file extensions. */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

export function isValidDocumentFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    }
  }

  const name = file.name.toLowerCase()
  const hasValidExt = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext))
  const hasValidType = ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type.toLowerCase())

  if (!hasValidExt && !hasValidType) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF, JPG, or PNG document.',
    }
  }

  return { valid: true }
}

/**
 * Upload an invoice or receipt file for a listing, store in Cloud Storage,
 * and persist metadata in the listing's private documents subcollection.
 */
export async function uploadListingDocument(
  listingId: string,
  file: File,
  uploadedBy: string,
  onProgress?: (progress: number) => void,
): Promise<ListingDocument> {
  const check = isValidDocumentFile(file)
  if (!check.valid) {
    throw new Error(check.error || 'Invalid document file.')
  }

  const docId = generateUUID()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `listings/${listingId}/documents/${docId}_${sanitizedName}`

  const downloadUrl = await uploadFile(storagePath, file, onProgress)

  const docData: ListingDocument = {
    id: docId,
    listingId,
    originalFileName: file.name,
    storagePath,
    downloadUrl,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  }

  if (isFirebaseConfigured) {
    await setDoc(doc(db(), 'listings', listingId, 'documents', docId), docData)
  }

  return docData
}

/**
 * Permanently delete a listing document from both Cloud Storage and Firestore.
 */
export async function deleteListingDocument(
  listingId: string,
  docItem: ListingDocument,
): Promise<void> {
  if (docItem.storagePath) {
    await deleteStorageFile(docItem.storagePath)
  }

  if (isFirebaseConfigured && listingId && docItem.id) {
    await deleteDoc(doc(db(), 'listings', listingId, 'documents', docItem.id))
  }
}

/**
 * Fetch all documents saved for a listing.
 */
export async function getListingDocuments(listingId: string): Promise<ListingDocument[]> {
  if (!isFirebaseConfigured || !listingId) return []
  try {
    const q = query(
      collection(db(), 'listings', listingId, 'documents'),
      orderBy('uploadedAt', 'desc'),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => d.data() as ListingDocument)
  } catch (err) {
    console.warn(`[ListingDocuments] getListingDocuments(${listingId}) failed:`, err)
    return []
  }
}

/**
 * Subscribe to real-time updates for a listing's saved documents.
 */
export function subscribeListingDocuments(
  listingId: string,
  callback: (docs: ListingDocument[]) => void,
): Unsubscribe {
  if (!isFirebaseConfigured || !listingId) {
    callback([])
    return () => {}
  }

  const q = query(
    collection(db(), 'listings', listingId, 'documents'),
    orderBy('uploadedAt', 'desc'),
  )

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => d.data() as ListingDocument))
    },
    (error) => {
      console.warn(`[ListingDocuments] subscribeListingDocuments(${listingId}) error:`, error.message)
      callback([])
    },
  )
}
