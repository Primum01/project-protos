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
  clearFinanceMemory,
} from '@/lib/firebase/finance'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { clearAdminCaches } from '@/lib/storage'
import type { Listing } from '@/types/listing'
import type { ContactMessage } from '@/types/message'
import type { SavedInvoice, SavedReceipt } from '@/types/finance'

interface AdminDataContextValue {
  listings: Listing[]
  listingsLoading: boolean
  messages: ContactMessage[]
  messagesLoading: boolean
  invoices: SavedInvoice[]
  invoicesLoading: boolean
  receipts: SavedReceipt[]
  receiptsLoading: boolean
  saveInvoice: (invoice: SavedInvoice) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  saveReceipt: (receipt: SavedReceipt) => Promise<void>
  deleteReceipt: (id: string) => Promise<void>
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
  saveInvoice: async () => {},
  deleteInvoice: async () => {},
  saveReceipt: async () => {},
  deleteReceipt: async () => {},
})

/**
 * Starts real-time Firestore subscriptions for listings + messages + invoices + receipts.
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

  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !isAdmin) {
      // Clear sensitive records from memory and local/session caches
      setListings([])
      setMessages([])
      setInvoices([])
      setReceipts([])
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

    return () => {
      unsubListings()
      unsubMessages()
      unsubInvoices()
      unsubReceipts()
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
        saveInvoice: handleSaveInvoice,
        deleteInvoice: handleDeleteInvoice,
        saveReceipt: handleSaveReceipt,
        deleteReceipt: handleDeleteReceipt,
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

/** Hook for accessing shared admin invoices and receipts. */
export function useAdminFinance() {
  const {
    invoices,
    invoicesLoading,
    receipts,
    receiptsLoading,
    saveInvoice,
    deleteInvoice,
    saveReceipt,
    deleteReceipt,
  } = useContext(AdminDataContext)

  return {
    invoices,
    invoicesLoading,
    receipts,
    receiptsLoading,
    saveInvoice,
    deleteInvoice,
    saveReceipt,
    deleteReceipt,
  }
}
