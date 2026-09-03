import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { subscribeAllListings } from '@/lib/firebase/listings'
import { subscribeMessages } from '@/lib/firebase/messages'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import type { Listing } from '@/types/listing'
import type { ContactMessage } from '@/types/message'

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
 * Starts a single Firestore subscription for listings and messages the moment
 * the admin shell mounts. All admin pages read from this shared cache —
 * navigation between pages is instant because the data is already loaded.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [listingsLoading, setListingsLoading] = useState(isFirebaseConfigured)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsubListings = subscribeAllListings((data) => {
      setListings(data)
      setListingsLoading(false)
    })
    const unsubMessages = subscribeMessages((data) => {
      setMessages(data)
      setMessagesLoading(false)
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
