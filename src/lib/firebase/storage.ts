import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from 'firebase/storage'
import { getFirebaseApp } from './config'

function storage() {
  return getStorage(getFirebaseApp())
}

/**
 * Uploads a file directly to Cloud Storage (client -> bucket, not proxied through
 * an app server) and resolves with its download URL once complete.
 */
export function uploadFile(
  path: string,
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage(), path), file)
    task.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes)
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve, reject)
      },
    )
  })
}

/**
 * Deletes a file from Cloud Storage. Silently handles missing files.
 */
export async function deleteStorageFile(path: string): Promise<void> {
  try {
    const fileRef = ref(storage(), path)
    await deleteObject(fileRef)
  } catch (error) {
    console.warn(`[Storage] Failed to delete file at ${path}:`, error)
  }
}
