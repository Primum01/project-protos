import { useEffect, useState } from 'react'
import { subscribeAllListings, subscribePublishedListings } from '@/lib/firebase/listings'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import type { Listing } from '@/types/listing'

/** Subscribe to all listings (admin use). */
export function useAllListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    try {
      const unsub = subscribeAllListings((data) => {
        setListings(data)
        setLoading(false)
      })
      return unsub
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings')
      setLoading(false)
    }
  }, [])

  return { listings, loading, error }
}

/** Subscribe to published listings only (public tours page). */
export function usePublishedListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    let unsub: (() => void) | undefined
    try {
      unsub = subscribePublishedListings((data) => {
        setListings(data)
        setLoading(false)
        setError(null)
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load published listings'
      console.error('[usePublishedListings] Failed to initialize Firestore subscription:', e)
      setError(msg)
      setLoading(false)
    }

    return () => {
      if (unsub) unsub()
    }
  }, [])

  return { listings, loading, error }
}
