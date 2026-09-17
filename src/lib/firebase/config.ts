import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey:            'AIzaSyBI1dDPGnipwNXU0pQRAQcJuJZYfvuNGbQ',
  authDomain:        'twinspace-c113c.firebaseapp.com',
  projectId:         'twinspace-c113c',
  storageBucket:     'twinspace-c113c.firebasestorage.app',
  messagingSenderId: '853437626509',
  appId:             '1:853437626509:web:5f75e130dd60a0370ecac4',
}

/** Always true — config is embedded directly so no env vars are needed. */
export const isFirebaseConfigured = true

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig)
}
