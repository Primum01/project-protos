import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'

const getEnv = (metaVal?: string, processKey?: string): string => {
  if (metaVal) return metaVal
  const proc = typeof globalThis !== 'undefined' ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process : undefined
  if (proc?.env && processKey && proc.env[processKey]) {
    return proc.env[processKey] as string
  }
  return ''
}

const firebaseConfig = {
  apiKey:            getEnv(import.meta.env?.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  authDomain:        getEnv(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnv(import.meta.env?.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getEnv(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnv(import.meta.env?.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
}

/** True once required Firebase env vars have been supplied. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill in your project credentials.',
    )
  }
  return getApps()[0] ?? initializeApp(firebaseConfig)
}
