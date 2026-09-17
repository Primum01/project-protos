import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/firebase/auth'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import { useSession } from '@/contexts/SessionContext'
import { SessionSelect } from '@/pages/admin/SessionSelect'

/* ── Inline icons ─────────────────────────────────────────────────────── */
function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}
function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
function IconSort() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M7 12h10M11 18h2" />
    </svg>
  )
}
function IconMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

/* ── Session clock ────────────────────────────────────────────────────────── */
function SessionClock({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    function tick() {
      const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, '0')}m`
          : `${m}m ${String(s).padStart(2, '0')}s`,
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return <span>{elapsed}</span>
}

const navItems = [
  { to: '/admin/listings', label: 'Listings', icon: <IconBuilding /> },
  { to: '/admin/dashboard', label: 'Dashboard', icon: <IconGrid /> },
  { to: '/admin/sorting', label: 'Sorting', icon: <IconSort /> },
  { to: '/admin/messages', label: 'Messages', icon: <IconMessage /> },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isConfigured } = useAuth()
  const { currentUser, activeSession, loading: sessionLoading, end } = useSession()
  const navigate = useNavigate()

  // Prefetch all admin page chunks so navigation is instant
  useEffect(() => {
    void import('@/pages/admin/AdminDashboard')
    void import('@/pages/admin/AdminListings')
    void import('@/pages/admin/AdminListingForm')
    void import('@/pages/admin/AdminMessages')
    void import('@/pages/admin/AdminSorting')
  }, [])

  async function handleSignOut() {
    try {
      await end()      // Log session end in Firestore first
      await signOut()  // Then Firebase sign-out
      navigate('/admin/login')
    } catch {
      /* ignore */
    }
  }

  // ── Session gate ───────────────────────────────────────────────────────────
  if (isConfigured) {
    if (sessionLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )
    }
    if (!currentUser) {
      return <SessionSelect />
    }
  }

  // ── Admin shell ────────────────────────────────────────────────────────────
  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-ink-950">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <Link to="/" className="font-display text-lg font-medium text-white tracking-tight">
          TwinSpace
        </Link>
        <span className="rounded-full bg-brand-500/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-100">
          Admin
        </span>
      </div>

      {/* In Session badge */}
      {currentUser && activeSession && (
        <div className="mx-3 mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {/* Pulsing green dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              In Session
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-white/90">{currentUser}</p>
          <p className="mt-0.5 text-[11px] text-white/35">
            <SessionClock startedAt={activeSession.startedAt} />
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/55 hover:bg-white/6 hover:text-white',
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* View public site */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/35 transition-colors hover:text-white/70"
          >
            <IconGlobe />
            View public site
          </a>
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-4 space-y-2">
        {!isConfigured && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-300">
            Firebase not configured — auth bypassed in dev mode.
          </div>
        )}
        {user?.email && (
          <p className="truncate px-1 text-xs text-white/25">{user.email}</p>
        )}
        {isConfigured && (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/6 hover:text-white"
          >
            <IconLogOut />
            Sign out
          </button>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0">{Sidebar}</div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 h-full w-64" onClick={(e) => e.stopPropagation()}>
            {Sidebar}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink-950/8 bg-paper px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink-700 hover:text-ink-950"
            aria-label="Open menu"
          >
            <IconMenu />
          </button>
          <Link to="/" className="font-display text-base font-medium text-ink-950">
            TwinSpace
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
