import { orderBy } from "firebase/firestore"
import type { ContactMessage } from "@/types/message"
import { deleteDocument, setDocument, subscribeCollection } from "./firestore"

const COL = "messages"

/** Save a new contact form submission. */
export async function createMessage(
  data: Omit<ContactMessage, "id" | "read" | "createdAt">,
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await setDocument(COL, id, { ...data, id, read: false, createdAt: now })
  return id
}

/** Mark a message as read/unread. */
export async function markMessageRead(id: string, read: boolean): Promise<void> {
  await setDocument(COL, id, { read })
}

/** Delete a message permanently. */
export async function deleteMessage(id: string): Promise<void> {
  await deleteDocument(COL, id)
}

/** Subscribe to all messages ordered newest-first (admin only). */
export function subscribeMessages(callback: (messages: ContactMessage[]) => void) {
  return subscribeCollection<ContactMessage>(COL, callback, orderBy("createdAt", "desc"))
}
