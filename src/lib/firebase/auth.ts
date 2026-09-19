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

/** The only email address recognized with admin privileges in TwinSpace. */
export const ADMIN_EMAIL = 'team@twinspace360.com'

/** Checks whether a given email address matches the designated admin email. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

/** Checks whether a Firebase Auth user has the admin email address. */
export function isAdminUser(user: FirebaseUser | null): boolean {
  return isAdminEmail(user?.email)
}

function auth() {
  return getAuth(getFirebaseApp())
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isAdminEmail(email)) {
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
  if (!isAdminEmail(credential.user.email)) {
    await firebaseSignOut(auth())
    throw new Error(`Unauthorised: only ${ADMIN_EMAIL} is recognized as admin.`)
  }
  return credential.user
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth(), new GoogleAuthProvider())
  if (!isAdminEmail(credential.user.email)) {
    await firebaseSignOut(auth())
    throw new Error(`Unauthorised: only ${ADMIN_EMAIL} is recognized as admin.`)
  }
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

