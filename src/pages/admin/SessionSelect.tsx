import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { endSession } from '@/lib/firebase/sessions'
import type { AdminSession } from '@/lib/firebase/sessions'

/* ── User roster ──────────────────────────────────────────────────────────── */
const USERS = [
  {
    name: 'Victor Kiptoo',
    initials: 'VK',
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    ring: 'ring-blue-500/40',
    glow: 'hover:shadow-blue-500/20',
  },
  {
    name: 'Isaac Too',
    initials: 'IT',
    gradient: 'from-violet-500 via-violet-600 to-purple-700',
    ring: 'ring-violet-500/40',
    glow: 'hover:shadow-violet-500/20',
  },
  {
    name: 'Nicholas Mokua',
    initials: 'NM',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
    ring: 'ring-emerald-500/40',
    glow: 'hover:shadow-emerald-500/20',
  },
] as const

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ── Blocked screen ───────────────────────────────────────────────────────── */
function BlockedScreen({
  blocking,
  pendingUser,
  onForce,
  onCancel,
}: {
  blocking: AdminSession
  pendingUser: string
  onForce: () => void
  onCancel: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [forcing, setForcing] = useState(false)

  async function handleForce() {
    setForcing(true)
    try {
      await onForce()
    } finally {
      setForcing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6">
      {/* Warning icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/30">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-center font-display text-2xl font-medium text-white">
        Session already active
      </h1>
      <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-white/50">
        <span className="font-semibold text-white/80">{blocking.user}</span> is currently in an
        active session (started {fmt(blocking.startedAt)}). Only one session is permitted at a time.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {!confirming ? (
          <>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-amber-500/10 px-6 py-2.5 text-sm font-medium text-amber-400 ring-1 ring-amber-500/30 transition-all hover:bg-amber-500/20"
            >
              Force end their session &amp; continue as {pendingUser.split(' ')[0]}
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg px-6 py-2.5 text-sm text-white/30 transition-colors hover:text-white/60"
            >
              Go back
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-xs text-white/40">
              This will log {blocking.user}&apos;s session as ended. Are you sure?
            </p>
            <button
              onClick={handleForce}
              disabled={forcing}
              className="rounded-lg bg-red-500/15 px-6 py-2.5 text-sm font-medium text-red-400 ring-1 ring-red-500/30 transition-all hover:bg-red-500/25 disabled:opacity-50"
            >
              {forcing ? 'Ending session…' : 'Yes, force end session'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg px-6 py-2.5 text-sm text-white/30 transition-colors hover:text-white/60"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function SessionSelect() {
  const { select } = useSession()
  const navigate = useNavigate()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<AdminSession | null>(null)
  const [pendingUser, setPendingUser] = useState<string>('')
  const [error, setError] = useState('')

  async function handleSelect(name: string) {
    setSelecting(name)
    setError('')
    try {
      const result = await select(name)
      if (result.status === 'blocked') {
        setBlocked(result.blocking)
        setPendingUser(name)
      } else {
        // Success — navigate explicitly to ensure the admin shell renders
        navigate('/admin/listings', { replace: true })
      }
    } catch {
      setError('Could not start session. Check your connection and try again.')
    } finally {
      setSelecting(null)
    }
  }

  async function handleForce() {
    if (!blocked) return
    try {
      await endSession(blocked.id)
      const result = await select(pendingUser)
      if (result.status === 'blocked') {
        setError('Still blocked — please try again.')
      }
    } catch {
      setError('Force-end failed. Please try again.')
    }
  }

  if (blocked) {
    return (
      <BlockedScreen
        blocking={blocked}
        pendingUser={pendingUser}
        onForce={handleForce}
        onCancel={() => { setBlocked(null); setPendingUser('') }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6">
      {/* Branding */}
      <div className="mb-10 text-center">
        <p className="font-display text-2xl font-medium tracking-tight text-white">TwinSpace</p>
        <span className="mt-1 inline-block rounded-full bg-brand-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-300">
          Admin
        </span>
      </div>

      <h1 className="mb-1 text-center text-lg font-semibold text-white">Who is in session?</h1>
      <p className="mb-10 text-center text-sm text-white/35">
        Select your name to start a logged session.
      </p>

      {/* User cards */}
      <div className="flex flex-wrap justify-center gap-5">
        {USERS.map((u) => {
          const isLoading = selecting === u.name
          return (
            <button
              key={u.name}
              id={`session-user-${u.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => handleSelect(u.name)}
              disabled={!!selecting}
              className={`
                group flex w-40 flex-col items-center gap-4 rounded-2xl border border-white/8
                bg-white/5 p-6 backdrop-blur-sm transition-all duration-200
                hover:border-white/20 hover:bg-white/10 hover:shadow-2xl ${u.glow}
                disabled:pointer-events-none disabled:opacity-40
                ${isLoading ? 'scale-95 opacity-60' : 'hover:-translate-y-1 active:scale-95'}
              `}
            >
              {/* Avatar */}
              <span
                className={`
                  flex h-16 w-16 items-center justify-center rounded-full
                  bg-gradient-to-br ${u.gradient} text-lg font-bold text-white
                  shadow-lg ring-2 ${u.ring}
                  transition-transform duration-200 group-hover:scale-105
                `}
              >
                {isLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  u.initials
                )}
              </span>

              {/* Name */}
              <span className="text-center text-sm font-medium leading-tight text-white/85">
                {u.name}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-8 max-w-xs text-center text-xs text-red-400">{error}</p>
      )}

      <p className="mt-12 text-center text-xs text-white/20">
        All sessions are logged and stored securely.
      </p>
    </div>
  )
}
