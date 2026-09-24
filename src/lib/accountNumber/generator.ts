/**
 * Atomic Property Account Number Generator
 *
 * Implements transaction-safe, monotonically increasing, per-area sequential
 * account number generation backed by Cloud Firestore transactions.
 *
 * Rules:
 * 1. Independent per-area counter (e.g. Karen has its own counter, Kilimani has its own counter).
 * 2. Monotonically increasing: deleting a property never decrements or reuses numbers.
 * 3. Concurrency-safe: utilizes Firestore `runTransaction` to serialize concurrent requests.
 * 4. Uniqueness guarantee: writes an explicit uniqueness lock in `account_numbers/{accountNumber}`.
 */

import {
  doc,
  getDoc,
  getFirestore,
  runTransaction,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase/config'
import {
  formatAccountNumber,
  isValidAccountNumber,
  resolveLocationPrefixes,
} from './prefixes'

export interface PropertyCounterData {
  countyPrefix: string
  areaPrefix: string
  canonicalCounty?: string
  canonicalArea?: string
  currentSequence: number
  updatedAt: string
}

export interface AccountNumberAllocationResult {
  accountNumber: string
  countyPrefix: string
  areaPrefix: string
  sequence: number
  counterId: string
}

function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

/**
 * Core atomic allocation function to be executed INSIDE an active Firestore Transaction.
 *
 * Reads the per-area counter, increments it monotonically, locks the account number,
 * and updates the counter document.
 */
export async function allocateAccountNumberInTransaction(
  transaction: Transaction,
  dbInstance: Firestore,
  countyPrefix: string,
  areaPrefix: string,
  listingId: string,
  metadata?: { canonicalCounty?: string; canonicalArea?: string },
): Promise<AccountNumberAllocationResult> {
  const counterId = `${countyPrefix.toUpperCase()}_${areaPrefix.toUpperCase()}`
  const counterRef = doc(dbInstance, 'property_counters', counterId)

  // 1. Read existing per-area counter document inside transaction
  const counterSnap = await transaction.get(counterRef)
  let currentSeq = 0

  if (counterSnap.exists()) {
    const data = counterSnap.data() as PropertyCounterData
    currentSeq = typeof data.currentSequence === 'number' ? data.currentSequence : 0
  }

  let nextSeq = currentSeq + 1
  let accountNumber = formatAccountNumber(countyPrefix, areaPrefix, nextSeq)

  // 2. Uniqueness verification lock
  // We check if account_numbers/{accountNumber} is already occupied.
  // In the extremely rare event of a pre-existing record (e.g. from manual admin entry or legacy),
  // we monotonically probe forward to guarantee zero collision.
  let lockRef = doc(dbInstance, 'account_numbers', accountNumber)
  let lockSnap = await transaction.get(lockRef)

  while (lockSnap.exists()) {
    nextSeq += 1
    accountNumber = formatAccountNumber(countyPrefix, areaPrefix, nextSeq)
    lockRef = doc(dbInstance, 'account_numbers', accountNumber)
    lockSnap = await transaction.get(lockRef)
  }

  const now = new Date().toISOString()

  // 3. Register the uniqueness lock
  transaction.set(lockRef, {
    accountNumber,
    listingId,
    countyPrefix,
    areaPrefix,
    sequence: nextSeq,
    createdAt: now,
  })

  // 4. Update the per-area counter document
  transaction.set(
    counterRef,
    {
      countyPrefix,
      areaPrefix,
      canonicalCounty: metadata?.canonicalCounty || countyPrefix,
      canonicalArea: metadata?.canonicalArea || areaPrefix,
      currentSequence: nextSeq,
      updatedAt: now,
    },
    { merge: true },
  )

  return {
    accountNumber,
    countyPrefix,
    areaPrefix,
    sequence: nextSeq,
    counterId,
  }
}

/**
 * Top-level atomic function to allocate a new property account number.
 * Can be used independently or called directly when registering a property.
 */
export async function generatePropertyAccountNumber(
  city?: string | null,
  location?: string | null,
  listingId?: string,
): Promise<AccountNumberAllocationResult> {
  const dbInstance = getDb()
  const resolved = resolveLocationPrefixes(city, location)
  const targetId = listingId || 'pending'

  return await runTransaction(dbInstance, async (transaction) => {
    return allocateAccountNumberInTransaction(
      transaction,
      dbInstance,
      resolved.countyPrefix,
      resolved.areaPrefix,
      targetId,
      {
        canonicalCounty: resolved.canonicalCounty,
        canonicalArea: resolved.canonicalArea,
      },
    )
  })
}

/**
 * Check if an account number is already registered in the database.
 */
export async function isAccountNumberTaken(accountNumber: string): Promise<boolean> {
  if (!isValidAccountNumber(accountNumber)) return false
  const dbInstance = getDb()
  const lockRef = doc(dbInstance, 'account_numbers', accountNumber)
  const snap = await getDoc(lockRef)
  return snap.exists()
}
