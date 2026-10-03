import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { subscribeAllListings } from '@/lib/firebase/listings'
import { subscribeMessages } from '@/lib/firebase/messages'
import {
  persistInvoice,
  persistReceipt,
  removeInvoice,
  removeReceipt,
  subscribeInvoices,
  subscribeReceipts,
  persistExpense,
  removeExpense,
  subscribeExpenses,
  persistPayment,
  removePayment,
  subscribePayments,
  clearFinanceMemory,
} from '@/lib/firebase/finance'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { clearAdminCaches } from '@/lib/storage'
import type { Listing } from '@/types/listing'
import type { ContactMessage } from '@/types/message'
import type { ExpenseRecord, PaymentRecord, SavedInvoice, SavedReceipt } from '@/types/finance'

interface AdminDataContextValue {
  listings: Listing[]
  listingsLoading: boolean
  messages: ContactMessage[]
  messagesLoading: boolean
  invoices: SavedInvoice[]
  invoicesLoading: boolean
  receipts: SavedReceipt[]
  receiptsLoading: boolean
  expenses: ExpenseRecord[]
  expensesLoading: boolean
  payments: PaymentRecord[]
  paymentsLoading: boolean
  saveInvoice: (invoice: SavedInvoice) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  saveReceipt: (receipt: SavedReceipt) => Promise<void>
  deleteReceipt: (id: string) => Promise<void>
  saveExpense: (expense: ExpenseRecord) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  savePayment: (payment: PaymentRecord) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextValue>({
  listings: [],
  listingsLoading: true,
  messages: [],
  messagesLoading: true,
  invoices: [],
  invoicesLoading: true,
  receipts: [],
  receiptsLoading: true,
  expenses: [],
  expensesLoading: true,
  payments: [],
  paymentsLoading: true,
  saveInvoice: async () => {},
  deleteInvoice: async () => {},
  saveReceipt: async () => {},
  deleteReceipt: async () => {},
  saveExpense: async () => {},
  deleteExpense: async () => {},
  savePayment: async () => {},
  deletePayment: async () => {},
})

/**
 * Starts real-time Firestore subscriptions for listings + messages + invoices + receipts + expenses + payments.
 * Maintains volatile in-memory state only (no sensitive customer or financial data in Local Storage).
 * Purges memory and admin storage when unauthenticated or on logout.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(isFirebaseConfigured)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(isFirebaseConfigured)
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(isFirebaseConfigured)
  const [receipts, setReceipts] = useState<SavedReceipt[]>([])
  const [receiptsLoading, setReceiptsLoading] = useState(isFirebaseConfigured)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [expensesLoading, setExpensesLoading] = useState(isFirebaseConfigured)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(isFirebaseConfigured)

  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !isAdmin) {
      // Clear sensitive records from memory and local/session caches
      setListings([])
      setMessages([])
      setInvoices([])
      setReceipts([])
      setExpenses([])
      setPayments([])
      clearFinanceMemory()
      clearAdminCaches()
      return
    }

    const unsubListings = subscribeAllListings((data) => {
      setListings(data)
      setListingsLoading(false)
    })

    const unsubMessages = subscribeMessages((data) => {
      setMessages(data)
      setMessagesLoading(false)
    })

    const unsubInvoices = subscribeInvoices((data) => {
      setInvoices(data)
      setInvoicesLoading(false)
    })

    const unsubReceipts = subscribeReceipts((data) => {
      setReceipts(data)
      setReceiptsLoading(false)
    })

    const unsubExpenses = subscribeExpenses((data) => {
      setExpenses(data)
      setExpensesLoading(false)
    })

    const unsubPayments = subscribePayments((data) => {
      setPayments(data)
      setPaymentsLoading(false)
    })

    return () => {
      unsubListings()
      unsubMessages()
      unsubInvoices()
      unsubReceipts()
      unsubExpenses()
      unsubPayments()
    }
  }, [user, isAdmin])

  async function handleSaveInvoice(invoice: SavedInvoice) {
    await persistInvoice(invoice, invoices)
    setInvoices((prev) => [
      invoice,
      ...prev.filter((inv) => inv.id !== invoice.id),
    ])
  }

  async function handleDeleteInvoice(id: string) {
    await removeInvoice(id, invoices)
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
  }

  async function handleSaveReceipt(receipt: SavedReceipt) {
    await persistReceipt(receipt, receipts)
    setReceipts((prev) => [
      receipt,
      ...prev.filter((rec) => rec.id !== receipt.id),
    ])
  }

  async function handleDeleteReceipt(id: string) {
    await removeReceipt(id, receipts)
    setReceipts((prev) => prev.filter((rec) => rec.id !== id))
  }

  async function handleSaveExpense(expense: ExpenseRecord) {
    await persistExpense(expense, expenses)
    setExpenses((prev) => [
      expense,
      ...prev.filter((e) => e.id !== expense.id),
    ])
  }

  async function handleDeleteExpense(id: string) {
    await removeExpense(id, expenses)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleSavePayment(payment: PaymentRecord) {
    await persistPayment(payment, payments)
    setPayments((prev) => [
      payment,
      ...prev.filter((p) => p.id !== payment.id),
    ])
  }

  async function handleDeletePayment(id: string) {
    await removePayment(id, payments)
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <AdminDataContext.Provider
      value={{
        listings,
        listingsLoading,
        messages,
        messagesLoading,
        invoices,
        invoicesLoading,
        receipts,
        receiptsLoading,
        expenses,
        expensesLoading,
        payments,
        paymentsLoading,
        saveInvoice: handleSaveInvoice,
        deleteInvoice: handleDeleteInvoice,
        saveReceipt: handleSaveReceipt,
        deleteReceipt: handleDeleteReceipt,
        saveExpense: handleSaveExpense,
        deleteExpense: handleDeleteExpense,
        savePayment: handleSavePayment,
        deletePayment: handleDeletePayment,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}

/** Drop-in replacement for useAllListings() — reads from volatile memory cache. */
export function useAdminListings() {
  const { listings, listingsLoading } = useContext(AdminDataContext)
  return { listings, loading: listingsLoading, error: null }
}

/** Drop-in replacement for useMessages() — reads from volatile memory cache. */
export function useAdminMessages() {
  const { messages, messagesLoading } = useContext(AdminDataContext)
  return { messages, loading: messagesLoading, error: null }
}

/** Hook for accessing shared admin financial data (invoices, receipts, expenses, payments). */
export function useAdminFinance() {
  const {
    invoices,
    invoicesLoading,
    receipts,
    receiptsLoading,
    expenses,
    expensesLoading,
    payments,
    paymentsLoading,
    saveInvoice,
    deleteInvoice,
    saveReceipt,
    deleteReceipt,
    saveExpense,
    deleteExpense,
    savePayment,
    deletePayment,
  } = useContext(AdminDataContext)

  return {
    invoices,
    invoicesLoading,
    receipts,
    receiptsLoading,
    expenses,
    expensesLoading,
    payments,
    paymentsLoading,
    saveInvoice,
    deleteInvoice,
    saveReceipt,
    deleteReceipt,
    saveExpense,
    deleteExpense,
    savePayment,
    deletePayment,
  }
}
