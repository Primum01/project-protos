import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { signOut } from '@/lib/firebase/auth'
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
  try {
    return new Date(iso).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'recently'
  }
}

/* ── Blocked Screen Modal / Overlay ───────────────────────────────────────── */
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
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-400"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-center font-display text-2xl font-medium text-white">
        Another Admin Session is Active
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-white/60">
        <span className="font-semibold text-amber-300">{blocking.user}</span> is currently logged in and has an active session (started {fmt(blocking.startedAt)}).
      </p>

      <div className="mt-4 max-w-sm rounded-xl border border-white/10 bg-white/5 p-4 text-center text-xs leading-relaxed text-white/50">
        <strong>Strict Security Invariant:</strong> Under no circumstance can two admin sessions exist simultaneously. Their session must be terminated for you to enter.
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        {!confirming ? (
          <>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-xl bg-amber-500/20 px-6 py-3 text-sm font-medium text-amber-300 ring-1 ring-amber-500/40 transition-all hover:bg-amber-500/30 shadow-lg"
            >
              Terminate their session &amp; continue as {pendingUser.split(' ')[0]}
            </button>
            <button
              onClick={onCancel}
              className="rounded-lg px-6 py-2 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Choose different user / Cancel
            </button>
          </>
        ) : (
          <div className="max-w-sm space-y-4 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
            <p className="text-xs text-red-200">
              This will immediately terminate <strong>{blocking.user}</strong>&apos;s active session and sign them out of the admin console.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleForce}
                disabled={forcing}
                className="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {forcing ? 'Ending active session…' : 'Yes, terminate session & enter'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="w-full rounded-lg px-4 py-2 text-xs text-white/40 hover:text-white/70"
              >
                Go back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export function SessionSelect() {
  const { select, activeSession } = useSession()
  const navigate = useNavigate()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<AdminSession | null>(null)
  const [pendingUser, setPendingUser] = useState<string>('')
  const [error, setError] = useState('')

  async function handleSelect(name: string, force = false) {
    setSelecting(name)
    setError('')
    try {
      const result = await select(name, force)
      if (result.status === 'blocked') {
        setBlocked(result.blocking)
        setPendingUser(name)
      } else {
        // Success — navigate into admin
        navigate('/admin/listings', { replace: true })
      }
    } catch {
      setError('Could not start session. Check your connection and try again.')
    } finally {
      setSelecting(null)
    }
  }

  async function handleForceEnd() {
    if (!pendingUser) return
    await handleSelect(pendingUser, true)
  }

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch {
      /* ignore */
    }
  }

  if (blocked) {
    return (
      <BlockedScreen
        blocking={blocked}
        pendingUser={pendingUser}
        onForce={handleForceEnd}
        onCancel={() => {
          setBlocked(null)
          setPendingUser('')
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 py-12">
      {/* Branding */}
      <div className="mb-6 text-center">
        <p className="font-display text-2xl font-medium tracking-tight text-white">TwinSpace360</p>
        <span className="mt-1 inline-block rounded-full bg-brand-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-300">
          Admin Portal
        </span>
      </div>

      {/* Active Session Warning Banner (if another admin is currently active) */}
      {activeSession && activeSession.active && (
        <div className="mb-8 max-w-md w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-ink-950">
              !
            </span>
            <div className="text-left text-xs text-amber-200">
              <p className="font-semibold text-amber-100">
                Active Session Detected
              </p>
              <p className="mt-1 text-white/70">
                <strong>{activeSession.user}</strong> is currently active in the console. Selecting your profile will require terminating their session, as only one admin may be active at a time.
              </p>
            </div>
          </div>
        </div>
      )}

      <h1 className="mb-1 text-center text-lg font-semibold text-white">
        Who is in session?
      </h1>
      <p className="mb-8 text-center text-sm text-white/40">
        Select your administrator identity to begin.
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
                group flex w-44 flex-col items-center gap-4 rounded-2xl border border-white/8
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
              <span className="text-center text-sm font-medium leading-tight text-white/90">
                {u.name}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-8 max-w-xs text-center text-xs text-red-400">{error}</p>
      )}

      {/* Sign Out Action */}
      <div className="mt-10 flex items-center gap-4">
        <button
          onClick={handleSignOut}
          className="text-xs text-white/30 hover:text-white/70 transition-colors"
        >
          Sign out of admin
        </button>
      </div>
    </div>
  )
}
