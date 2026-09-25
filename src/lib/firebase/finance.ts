import {
  deleteDocument,
  setDocument,
  subscribeCollection,
} from './firestore'
import { isFirebaseConfigured } from './config'
import type { SavedInvoice, SavedReceipt } from '@/types/finance'

// In-memory volatile fallback (never written to disk or Local Storage)
let memoryInvoices: SavedInvoice[] = []
let memoryReceipts: SavedReceipt[] = []

export function clearFinanceMemory(): void {
  memoryInvoices = []
  memoryReceipts = []
}

/**
 * Auto-generates the next sequential unique invoice number (e.g. INV-0001).
 * Never replicates an existing invoice number.
 */
export function generateNextInvoiceNumber(existingInvoices: SavedInvoice[]): string {
  const existingSet = new Set(existingInvoices.map((inv) => inv.invoiceNumber.trim().toUpperCase()))
  
  // Find highest sequential INV-XXXX
  let max = 0
  for (const inv of existingInvoices) {
    const match = inv.invoiceNumber.trim().match(/^INV-(\d+)$/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > max) {
        max = num
      }
    }
  }

  let next = max + 1
  let candidate = `INV-${String(next).padStart(4, '0')}`
  while (existingSet.has(candidate)) {
    next++
    candidate = `INV-${String(next).padStart(4, '0')}`
  }
  return candidate
}

/**
 * Auto-generates the next sequential unique receipt number (e.g. REC-0001).
 * Never replicates an existing receipt number.
 */
export function generateNextReceiptNumber(existingReceipts: SavedReceipt[]): string {
  const existingSet = new Set(existingReceipts.map((rec) => rec.receiptNumber.trim().toUpperCase()))

  let max = 0
  for (const rec of existingReceipts) {
    const match = rec.receiptNumber.trim().match(/^REC-(\d+)$/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > max) {
        max = num
      }
    }
  }

  let next = max + 1
  let candidate = `REC-${String(next).padStart(4, '0')}`
  while (existingSet.has(candidate)) {
    next++
    candidate = `REC-${String(next).padStart(4, '0')}`
  }
  return candidate
}

/**
 * Save an invoice to Firestore and volatile memory.
 * Enforces strict uniqueness of invoiceNumber.
 */
export async function persistInvoice(
  invoice: SavedInvoice,
  existingInvoices: SavedInvoice[],
): Promise<void> {
  const normalizedNum = invoice.invoiceNumber.trim().toUpperCase()
  if (!normalizedNum) {
    throw new Error('Invoice number is required.')
  }

  // Check for duplicate number across other invoices
  const duplicate = existingInvoices.find(
    (inv) => inv.id !== invoice.id && inv.invoiceNumber.trim().toUpperCase() === normalizedNum,
  )
  if (duplicate) {
    throw new Error(`Invoice number "${invoice.invoiceNumber}" already exists and cannot be replicated.`)
  }

  // Update volatile memory fallback
  memoryInvoices = [
    invoice,
    ...memoryInvoices.filter((inv) => inv.id !== invoice.id),
  ]

  // Persist to Firestore if configured
  if (isFirebaseConfigured) {
    await setDocument('invoices', invoice.id, invoice)
  }
}

/**
 * Delete an invoice from Firestore and volatile memory.
 */
export async function removeInvoice(id: string, _existingInvoices: SavedInvoice[]): Promise<void> {
  memoryInvoices = memoryInvoices.filter((inv) => inv.id !== id)

  if (isFirebaseConfigured) {
    await deleteDocument('invoices', id)
  }
}

/**
 * Save a receipt to Firestore and volatile memory.
 * Enforces strict uniqueness of receiptNumber.
 */
export async function persistReceipt(
  receipt: SavedReceipt,
  existingReceipts: SavedReceipt[],
): Promise<void> {
  const normalizedNum = receipt.receiptNumber.trim().toUpperCase()
  if (!normalizedNum) {
    throw new Error('Receipt number is required.')
  }

  // Check for duplicate number across other receipts
  const duplicate = existingReceipts.find(
    (rec) => rec.id !== receipt.id && rec.receiptNumber.trim().toUpperCase() === normalizedNum,
  )
  if (duplicate) {
    throw new Error(`Receipt number "${receipt.receiptNumber}" already exists and cannot be replicated.`)
  }

  // Update volatile memory fallback
  memoryReceipts = [
    receipt,
    ...memoryReceipts.filter((rec) => rec.id !== receipt.id),
  ]

  // Persist to Firestore if configured
  if (isFirebaseConfigured) {
    await setDocument('receipts', receipt.id, receipt)
  }
}

/**
 * Delete a receipt from Firestore and volatile memory.
 */
export async function removeReceipt(id: string, _existingReceipts: SavedReceipt[]): Promise<void> {
  memoryReceipts = memoryReceipts.filter((rec) => rec.id !== id)

  if (isFirebaseConfigured) {
    await deleteDocument('receipts', id)
  }
}

/**
 * Realtime subscription to invoices collection.
 */
export function subscribeInvoices(callback: (invoices: SavedInvoice[]) => void) {
  if (!isFirebaseConfigured) {
    callback([...memoryInvoices])
    return () => {}
  }
  return subscribeCollection<SavedInvoice>('invoices', callback)
}

/**
 * Realtime subscription to receipts collection.
 */
export function subscribeReceipts(callback: (receipts: SavedReceipt[]) => void) {
  if (!isFirebaseConfigured) {
    callback([...memoryReceipts])
    return () => {}
  }
  return subscribeCollection<SavedReceipt>('receipts', callback)
}
