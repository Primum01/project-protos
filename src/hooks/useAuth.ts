import { useEffect, useState } from 'react'
import { onAuthChange, type FirebaseUser } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'

/**
 * Subscribes to Firebase auth state.
 * When Firebase is not yet configured, loading resolves immediately with user=null.
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

  return { user, loading, isConfigured: isFirebaseConfigured }
}
