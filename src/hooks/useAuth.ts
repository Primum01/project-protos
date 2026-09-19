import { useEffect, useState } from 'react'
import { onAuthChange, isAdminUser, type FirebaseUser } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'

/**
 * Subscribes to Firebase auth state.
 * When Firebase is not yet configured, loading resolves immediately with user=null.
 * Computes isAdmin to verify team@twinspace360.com credentials.
 */
export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  // If Firebase is not configured (dev mode), bypass as admin.
  // Otherwise, only team@twinspace360.com is recognized as admin.
  const isAdmin = !isFirebaseConfigured || isAdminUser(user)

  return { user, loading, isConfigured: isFirebaseConfigured, isAdmin }
}

