import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getFirebaseApp } from './config'

/** The only email address permitted to register an admin account. */
const ADMIN_EMAIL = 'team@twinspace360.com'

function auth() {
  return getAuth(getFirebaseApp())
}

export async function signUpWithEmail(email: string, password: string) {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
    throw new Error(
      `Unauthorised: only ${ADMIN_EMAIL} is permitted to create an admin account.`,
    )
  }
  const credential = await createUserWithEmailAndPassword(auth(), email, password)
  await sendEmailVerification(credential.user)
  return credential.user
}

export async function signInWithEmail(email: string, password: string) {
  // Session-only persistence: auth state clears when the tab/browser closes.
  // This ensures the login form is always shown at the start of a new session.
  await setPersistence(auth(), browserSessionPersistence)
  const credential = await signInWithEmailAndPassword(auth(), email, password)
  return credential.user
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth(), new GoogleAuthProvider())
  return credential.user
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth(), email)
}

export async function signOut() {
  await firebaseSignOut(auth())
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth(), callback)
}

export type { FirebaseUser }
