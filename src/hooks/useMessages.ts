import { useEffect, useState } from "react"
import { subscribeMessages } from "@/lib/firebase/messages"
import { isFirebaseConfigured } from "@/lib/firebase/config"
import type { ContactMessage } from "@/types/message"

/** Subscribe to all contact messages in real time (admin only). */
export function useMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    try {
      const unsub = subscribeMessages((data) => {
        setMessages(data)
        setLoading(false)
      })
      return unsub
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages")
      setLoading(false)
    }
  }, [])

  return { messages, loading, error }
}
