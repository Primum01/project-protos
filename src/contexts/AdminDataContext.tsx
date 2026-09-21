import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { subscribeAllListings } from '@/lib/firebase/listings'
import { subscribeMessages } from '@/lib/firebase/messages'
import {
  LS_INVOICES,
  LS_RECEIPTS,
  persistInvoice,
  persistReceipt,
  readFinanceCache,
  removeInvoice,
  removeReceipt,
  subscribeInvoices,
  subscribeReceipts,
  writeFinanceCache,
} from '@/lib/firebase/finance'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import type { Listing } from '@/types/listing'
import type { ContactMessage } from '@/types/message'
import type { SavedInvoice, SavedReceipt } from '@/types/finance'

/* ── localStorage cache keys ─────────────────────────────────────────────── */
const LS_LISTINGS = 'ts_admin_listings_cache'
const LS_MESSAGES = 'ts_admin_messages_cache'

function readCache<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeCache<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* storage full — silently skip */
  }
}

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
 * On first render it seeds state from localStorage so the UI is never blank —
 * Firestore updates replace the cache within milliseconds.
 * Mount this as high as possible in the admin tree so data loads in parallel
 * with auth/session checks rather than waiting for them to finish.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Seed from cache for instant render — loading=false if cache has data
  const cachedListings = readCache<Listing>(LS_LISTINGS)
  const cachedMessages = readCache<ContactMessage>(LS_MESSAGES)
  const cachedInvoices = readFinanceCache<SavedInvoice>(LS_INVOICES)
  const cachedReceipts = readFinanceCache<SavedReceipt>(LS_RECEIPTS)

  const [listings, setListings] = useState<Listing[]>(cachedListings)
  const [listingsLoading, setListingsLoading] = useState(
    isFirebaseConfigured && cachedListings.length === 0,
  )
  const [messages, setMessages] = useState<ContactMessage[]>(cachedMessages)
  const [messagesLoading, setMessagesLoading] = useState(
    isFirebaseConfigured && cachedMessages.length === 0,
  )
  const [invoices, setInvoices] = useState<SavedInvoice[]>(cachedInvoices)
  const [invoicesLoading, setInvoicesLoading] = useState(
    isFirebaseConfigured && cachedInvoices.length === 0,
  )
  const [receipts, setReceipts] = useState<SavedReceipt[]>(cachedReceipts)
  const [receiptsLoading, setReceiptsLoading] = useState(
    isFirebaseConfigured && cachedReceipts.length === 0,
  )

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubListings = subscribeAllListings((data) => {
      setListings(data)
      setListingsLoading(false)
      writeCache(LS_LISTINGS, data)
    })

    const unsubMessages = subscribeMessages((data) => {
      setMessages(data)
      setMessagesLoading(false)
      writeCache(LS_MESSAGES, data)
    })

    const unsubInvoices = subscribeInvoices((data) => {
      setInvoices(data)
      setInvoicesLoading(false)
      writeFinanceCache(LS_INVOICES, data)
    })

    const unsubReceipts = subscribeReceipts((data) => {
      setReceipts(data)
      setReceiptsLoading(false)
      writeFinanceCache(LS_RECEIPTS, data)
    })

    return () => {
      unsubListings()
      unsubMessages()
      unsubInvoices()
      unsubReceipts()
    }
  }, [])

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

/** Drop-in replacement for useAllListings() — reads from shared admin cache. */
export function useAdminListings() {
  const { listings, listingsLoading } = useContext(AdminDataContext)
  return { listings, loading: listingsLoading, error: null }
}

/** Drop-in replacement for useMessages() — reads from shared admin cache. */
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
