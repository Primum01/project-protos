import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'twinspace-c113c.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'twinspace-c113c',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'twinspace-c113c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '853437626509',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:853437626509:web:5f75e130dd60a0370ecac4',
}

/** True once required Firebase credentials have been supplied or defaulted. */
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
