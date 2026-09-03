import { useState } from "react"
import { useAdminMessages } from '@/contexts/AdminDataContext'
import { deleteMessage, markMessageRead } from "@/lib/firebase/messages"
import type { ContactMessage } from "@/types/message"

/* ── Icons ──────────────────────────────────────────────────────────────── */
function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

/* ── Message detail panel ───────────────────────────────────────────────── */
function MessagePanel({
  msg,
  onClose,
}: {
  msg: ContactMessage
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm("Delete this message? This cannot be undone.")) return
    setDeleting(true)
    try {
      await deleteMessage(msg.id)
      onClose()
    } catch {
      alert("Failed to delete message.")
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center gap-3 border-b border-ink-950/8 px-6 py-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 transition-colors"
        >
          <span className="rotate-180 inline-flex"><IconChevron /></span>
          Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`mailto:${msg.email}?subject=Re: Your TwinSpace enquiry`}
            className="rounded-lg border border-ink-950/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Reply via email
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <IconTrash />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ink-950">{msg.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
            <a href={`mailto:${msg.email}`} className="hover:text-brand-600 hover:underline">{msg.email}</a>
            {msg.phone && <span>{msg.phone}</span>}
            <span>{new Date(msg.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
        </div>
        <div className="whitespace-pre-wrap rounded-xl border border-ink-950/8 bg-ink-50 p-5 text-sm leading-relaxed text-ink-800">
          {msg.message}
        </div>
      </div>
    </div>
  )
}

/* ── Message row ────────────────────────────────────────────────────────── */
function MessageRow({
  msg,
  selected,
  onClick,
}: {
  msg: ContactMessage
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-ink-950/6 px-5 py-4 text-left transition-colors last:border-0 ${
        selected ? "bg-brand-50" : msg.read ? "bg-paper hover:bg-ink-50" : "bg-amber-50/60 hover:bg-amber-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!msg.read && (
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand-500" />
            )}
            <p className={`truncate text-sm ${msg.read ? "font-normal text-ink-700" : "font-semibold text-ink-950"}`}>
              {msg.name}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-400">{msg.email}</p>
          <p className="mt-1 line-clamp-2 text-xs text-ink-500">{msg.message}</p>
        </div>
        <span className="shrink-0 text-[11px] text-ink-400 tabular-nums">
          {new Date(msg.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
        </span>
      </div>
    </button>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export function AdminMessages() {
  const { messages, loading } = useAdminMessages()
  const [selected, setSelected] = useState<ContactMessage | null>(null)

  const unread = messages.filter((m) => !m.read).length

  async function handleSelect(msg: ContactMessage) {
    setSelected(msg)
    if (!msg.read) {
      await markMessageRead(msg.id, true).catch(() => {/* silent */})
    }
  }

  return (
    <div className="flex h-full">
      {/* ── Inbox list ── */}
      <div className={`flex flex-col border-r border-ink-950/8 bg-paper ${selected ? "hidden md:flex md:w-80 md:shrink-0" : "w-full md:w-80 md:shrink-0"}`}>
        {/* Header */}
        <div className="border-b border-ink-950/8 px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-ink-950">Messages</h1>
            {unread > 0 && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-400">
            {loading ? "Loading…" : `${messages.length} message${messages.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-ink-950/6 px-5 py-4">
                  <div className="h-3 w-28 animate-pulse rounded bg-ink-100" />
                  <div className="mt-2 h-2.5 w-40 animate-pulse rounded bg-ink-100" />
                  <div className="mt-2 h-2 w-full animate-pulse rounded bg-ink-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
                <IconMail />
              </div>
              <p className="text-sm font-medium text-ink-600">No messages yet</p>
              <p className="mt-1 text-xs text-ink-400">Contact form submissions will appear here.</p>
            </div>
          )}

          {!loading && messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              selected={selected?.id === msg.id}
              onClick={() => handleSelect(msg)}
            />
          ))}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected ? (
        <div className="flex-1 overflow-hidden">
          <MessagePanel msg={selected} onClose={() => setSelected(null)} />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <IconMail />
            </div>
            <p className="text-sm font-medium text-ink-600">Select a message to read it</p>
          </div>
        </div>
      )}
    </div>
  )
}
