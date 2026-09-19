import { useEffect, useState } from 'react'
import { getAllSessions, type AdminSession } from '@/lib/firebase/sessions'
import { useSession } from '@/contexts/SessionContext'
import { Badge, Button } from '@/components/ui'

const USER_ROSTER: Record<string, { initials: string; gradient: string }> = {
  'Victor Kiptoo': {
    initials: 'VK',
    gradient: 'from-blue-500 to-indigo-600',
  },
  'Isaac Too': {
    initials: 'IT',
    gradient: 'from-violet-500 to-purple-600',
  },
  'Nicholas Mokua': {
    initials: 'NM',
    gradient: 'from-emerald-500 to-teal-600',
  },
}

function getInitials(name: string): string {
  if (USER_ROSTER[name]) return USER_ROSTER[name].initials
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getGradient(name: string): string {
  if (USER_ROSTER[name]) return USER_ROSTER[name].gradient
  return 'from-ink-600 to-ink-800'
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function fmtDuration(startIso: string, endIso: string | null): string {
  try {
    const start = new Date(startIso).getTime()
    const end = endIso ? new Date(endIso).getTime() : Date.now()
    const diffSec = Math.max(0, Math.floor((end - start) / 1000))
    const h = Math.floor(diffSec / 3600)
    const m = Math.floor((diffSec % 3600) / 60)
    const s = diffSec % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m`
    return `${s}s`
  } catch {
    return '—'
  }
}

export function AdminLogs() {
  const { currentUser, activeSession } = useSession()
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  async function loadLogs() {
    setLoading(true)
    try {
      const logs = await getAllSessions()
      // If we have an active session in local state not yet written or refreshed, make sure it appears
      if (activeSession && !logs.some((s) => s.id === activeSession.id)) {
        setSessions([activeSession, ...logs])
      } else {
        setSessions(logs)
      }
    } catch {
      if (activeSession) setSessions([activeSession])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
    const interval = setInterval(loadLogs, 30000)
    return () => clearInterval(interval)
  }, [activeSession])

  const filtered = sessions.filter((s) => {
    if (filterUser !== 'all' && s.user !== filterUser) return false
    if (filterStatus === 'active' && !s.active) return false
    if (filterStatus === 'completed' && s.active) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchUser = s.user.toLowerCase().includes(term)
      const matchId = s.id.toLowerCase().includes(term)
      if (!matchUser && !matchId) return false
    }
    return true
  })

  const activeCount = sessions.filter((s) => s.active).length

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-950">Admin Logs</h1>
          <p className="mt-1 text-sm text-ink-500">
            Login history and active session tracking across administrators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Active Sessions
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-2xl font-bold text-ink-950">{activeCount}</span>
            <span className="text-xs text-ink-500 font-medium">live now</span>
          </div>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Current User In Session
          </p>
          <p className="mt-2 text-lg font-semibold text-ink-950 truncate">
            {currentUser || 'None'}
          </p>
          <p className="text-xs text-ink-400">30 min idle timeout active</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Total Logged Sessions
          </p>
          <p className="mt-2 text-2xl font-bold text-ink-950">{sessions.length}</p>
          <p className="text-xs text-ink-400">Recorded history</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ink-950/8 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Member Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-800 transition-colors focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Admins</option>
            <option value="Victor Kiptoo">Victor Kiptoo</option>
            <option value="Isaac Too">Isaac Too</option>
            <option value="Nicholas Mokua">Nicholas Mokua</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'completed')}
            className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-800 transition-colors focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search member or session ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs text-ink-950 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-950/8 bg-ink-50/70 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-6 py-3.5">Admin Member</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Session Started</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Session ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/6">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mb-2" />
                    <p className="text-xs">Loading admin session records…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-400">
                    <p className="text-sm font-medium text-ink-600">No session logs found</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {searchTerm || filterUser !== 'all' || filterStatus !== 'all'
                        ? 'Try clearing your search or filters.'
                        : 'New logins will be automatically recorded here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const initials = getInitials(s.user)
                  const gradient = getGradient(s.user)
                  const duration = fmtDuration(s.startedAt, s.endedAt)

                  return (
                    <tr key={s.id} className="transition-colors hover:bg-ink-50/50">
                      {/* Admin member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-semibold text-white shadow-sm`}
                          >
                            {initials}
                          </span>
                          <div>
                            <p className="font-medium text-ink-950">{s.user}</p>
                            <p className="text-[11px] text-ink-400">
                              {s.user === currentUser ? 'Your current session' : 'Administrator'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {s.active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active now
                          </span>
                        ) : (
                          <Badge className="text-xs font-normal text-ink-600 bg-ink-100">
                            Completed
                          </Badge>
                        )}
                      </td>

                      {/* Session started */}
                      <td className="px-6 py-4 text-xs text-ink-700 font-medium">
                        {fmtDate(s.startedAt)}
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-xs text-ink-600">
                        {s.active ? (
                          <span className="font-semibold text-emerald-700">
                            {duration} elapsed
                          </span>
                        ) : (
                          <span>{duration}</span>
                        )}
                      </td>

                      {/* Session ID */}
                      <td className="px-6 py-4 font-mono text-[11px] text-ink-400">
                        {s.id.slice(0, 8)}…{s.id.slice(-4)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
