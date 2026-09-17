import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseApp } from './config'

function db() {
  return getFirestore(getFirebaseApp())
}

/** Fetch a single document by collection + id. Returns null if missing. */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  const snapshot = await getDoc(doc(db(), collectionName, id))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T) : null
}

/** Fetch all documents from a collection with optional query constraints. */
export async function getCollection<T extends DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const snapshot = await getDocs(query(collection(db(), collectionName), ...constraints))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T))
}

/** Create or merge-update a document. */
export async function setDocument(
  collectionName: string,
  id: string,
  data: DocumentData,
): Promise<void> {
  await setDoc(doc(db(), collectionName, id), data, { merge: true })
}

/** Delete a document by collection + id. */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db(), collectionName, id))
}

/** Subscribe to real-time updates for a collection. Returns an unsubscribe fn. */
export function subscribeCollection<T extends DocumentData>(
  collectionName: string,
  callback: (docs: T[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  return onSnapshot(
    query(collection(db(), collectionName), ...constraints),
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T)))
    },
    (error) => {
      // Permission errors or network failures must not cause infinite loading —
      // surface an empty result so the UI can show an appropriate empty state.
      console.error(`[Firestore] subscribeCollection(${collectionName}) error:`, error.message)
      callback([])
    },
  )
}

export { collection, doc, query } from 'firebase/firestore'
