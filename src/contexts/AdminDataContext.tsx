import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { subscribeAllListings } from '@/lib/firebase/listings'
import { subscribeMessages } from '@/lib/firebase/messages'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import type { Listing } from '@/types/listing'
import type { ContactMessage } from '@/types/message'

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
}

const AdminDataContext = createContext<AdminDataContextValue>({
  listings: [],
  listingsLoading: true,
  messages: [],
  messagesLoading: true,
})

/**
 * Starts real-time Firestore subscriptions for listings + messages.
 * On first render it seeds state from localStorage so the UI is never blank —
 * Firestore updates replace the cache within milliseconds.
 * Mount this as high as possible in the admin tree so data loads in parallel
 * with auth/session checks rather than waiting for them to finish.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Seed from cache for instant render — loading=false if cache has data
  const cachedListings = readCache<Listing>(LS_LISTINGS)
  const cachedMessages = readCache<ContactMessage>(LS_MESSAGES)

  const [listings, setListings] = useState<Listing[]>(cachedListings)
  const [listingsLoading, setListingsLoading] = useState(
    isFirebaseConfigured && cachedListings.length === 0,
  )
  const [messages, setMessages] = useState<ContactMessage[]>(cachedMessages)
  const [messagesLoading, setMessagesLoading] = useState(
    isFirebaseConfigured && cachedMessages.length === 0,
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

    return () => {
      unsubListings()
      unsubMessages()
    }
  }, [])

  return (
    <AdminDataContext.Provider value={{ listings, listingsLoading, messages, messagesLoading }}>
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
