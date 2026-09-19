import { useEffect, useMemo, useState } from 'react'
import { useAdminListings } from '@/contexts/AdminDataContext'
import {
  subscribeRealAnalytics,
  type AnalyticsRecord,
} from '@/lib/firebase/analytics'
import { Button } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y'

const TIME_RANGES: { id: TimeRange; label: string; days: number }[] = [
  { id: '1w', label: 'Last 1 week', days: 7 },
  { id: '1m', label: 'Last 1 month', days: 30 },
  { id: '3m', label: 'Last 3 months', days: 90 },
  { id: '6m', label: 'Last 6 months', days: 180 },
  { id: '1y', label: 'Last 1 year', days: 365 },
]

function formatSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim()
  return `${s}s`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AdminAnalytics() {
  const { listings } = useAdminListings()
  const [records, setRecords] = useState<AnalyticsRecord[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [selectedListingId, setSelectedListingId] = useState<string>('all')
  const [clientName, setClientName] = useState<string>('')

  usePageMeta({
    title: 'Tour Performance Report — TwinSpace',
    description: 'Real-time 3D tour analytics and guest telemetry.',
    path: '/admin/analytics',
    noIndex: true,
  })

  // Subscribe to real-time telemetry events starting from now
  useEffect(() => {
    const unsubscribe = subscribeRealAnalytics((liveRecords) => {
      setRecords(liveRecords)
    })
    return () => unsubscribe()
  }, [])

  const selectedListing = useMemo(
    () => listings.find((l) => l.id === selectedListingId),
    [listings, selectedListingId],
  )

  const activeRangeConfig = useMemo(
    () => TIME_RANGES.find((t) => t.id === timeRange) ?? TIME_RANGES[1],
    [timeRange],
  )

  // Filter records by selected time window and optional property filter
  const filteredRecords = useMemo(() => {
    const cutoff = Date.now() - activeRangeConfig.days * 24 * 60 * 60 * 1000
    return records.filter((r) => {
      const time = new Date(r.timestamp).getTime()
      if (isNaN(time) || time < cutoff) return false
      if (selectedListingId !== 'all') {
        const matchesId = r.tourId === selectedListingId
        const matchesSlug = selectedListing && r.tourId === selectedListing.id
        if (!matchesId && !matchesSlug) return false
      }
      return true
    })
  }, [records, activeRangeConfig, selectedListingId, selectedListing])

  // Compute real metrics
  const stats = useMemo(() => {
    const views = filteredRecords.filter((r) => r.type === 'tour_view').length
    const shares = filteredRecords.filter((r) => r.type === 'link_shared').length
    const durationEvents = filteredRecords.filter(
      (r) => r.type === 'session_duration' && typeof r.durationSeconds === 'number',
    )
    const totalDuration = durationEvents.reduce((acc, r) => acc + (r.durationSeconds ?? 0), 0)
    const avgDuration = durationEvents.length > 0 ? Math.round(totalDuration / durationEvents.length) : 0

    return {
      tourViews: views,
      avgSession: formatSeconds(avgDuration),
      linksShared: shares,
      totalTrackedEvents: filteredRecords.length,
    }
  }, [filteredRecords])

  function handleExportPDF() {
    const origTitle = document.title
    const reportSubject = selectedListing ? selectedListing.name : 'Tour Performance Report'
    document.title = `${reportSubject} — TwinSpace`

    window.print()

    setTimeout(() => {
      document.title = origTitle
    }, 1000)
  }

  const currentDateStr = new Date().toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      {/* ── Screen Controls (Omitted during PDF export) ── */}
      <div className="no-print mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Analytics
              </span>
              <span className="text-xs text-ink-400">· Real Guest Telemetry</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold text-ink-950">
              See how guests actually explore your space
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500 leading-relaxed">
              Every tour comes with a dashboard showing views, room engagement, and booking clicks,
              so you know what's working.
            </p>
          </div>

          <Button onClick={handleExportPDF} className="shrink-0 gap-2 shadow-soft">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          {/* Time range buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-ink-500">Period:</span>
            {TIME_RANGES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeRange(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === t.id
                    ? 'bg-ink-950 text-white shadow-sm'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100 hover:text-ink-950'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Property selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-property-select" className="text-xs font-medium text-ink-500">
              Property:
            </label>
            <select
              id="analytics-property-select"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
              className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Properties (Portfolio)</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.city})
                </option>
              ))}
            </select>
          </div>

          {/* Optional client name for report header */}
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-client-input" className="text-xs font-medium text-ink-500">
              Client Name:
            </label>
            <input
              id="analytics-client-input"
              type="text"
              placeholder="e.g. Acme Properties"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-40 rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs text-ink-950 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Formal Print Header (Clean PDF layout without admin references) ── */}
      <div className="print-only mb-8 border-b border-ink-950/15 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-2xl font-medium tracking-tight text-ink-950">
              TwinSpace
            </span>
            <p className="text-xs text-ink-500">Interactive 3D Virtual Tour Performance</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Report Date
            </p>
            <p className="text-sm font-medium text-ink-950">{currentDateStr}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-ink-50 p-4 text-xs">
          <div>
            <p className="text-ink-400 font-medium">PROPERTY</p>
            <p className="font-semibold text-ink-950 text-sm mt-0.5">
              {selectedListing ? selectedListing.name : 'All Published Properties'}
            </p>
            {selectedListing && (
              <p className="text-ink-500">
                {[selectedListing.location, selectedListing.city, selectedListing.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-ink-400 font-medium">PREPARED FOR / REPORTING PERIOD</p>
            <p className="font-semibold text-ink-950 text-sm mt-0.5">
              {clientName || 'Property Host / Client'}
            </p>
            <p className="text-ink-500">{activeRangeConfig.label}</p>
          </div>
        </div>
      </div>

      {/* ── THE DASHBOARD CONTAINER (Exact layout requested) ── */}
      <div className="rounded-2xl border border-ink-950/10 bg-sand-100/60 p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            {selectedListing ? selectedListing.name : 'Tour Performance'} — {activeRangeConfig.label}
          </p>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-ink-700 shadow-sm border border-ink-950/5">
            Real Telemetry
          </span>
        </div>

        {/* 3 Real Telemetry Stats: Tour views, Avg. session, Links shared */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/70 p-6 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-4xl font-medium text-ink-950">
              {stats.tourViews.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              Tour views
            </p>
            <p className="mt-1 text-[11px] text-ink-400">Total verified walkthrough opens</p>
          </div>

          <div className="rounded-xl bg-white/70 p-6 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-4xl font-medium text-ink-950">
              {stats.avgSession}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              Avg. session
            </p>
            <p className="mt-1 text-[11px] text-ink-400">Average exploration time spent</p>
          </div>

          <div className="rounded-xl bg-white/70 p-6 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-4xl font-medium text-ink-950">
              {stats.linksShared.toLocaleString()}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-ink-500">
              Links shared
            </p>
            <p className="mt-1 text-[11px] text-ink-400">Total shares &amp; link copies</p>
          </div>
        </div>
      </div>

      {/* ── Live Telemetry Log Feed (Real visitor activity recorded starting now) ── */}
      <div className="no-print mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-950">Real Event Activity Log</h2>
            <p className="text-xs text-ink-500">
              Live events captured from active visitor sessions and link shares.
            </p>
          </div>
          <span className="text-xs font-medium text-ink-400">
            {filteredRecords.length} event{filteredRecords.length === 1 ? '' : 's'} in selected period
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-950/8 bg-ink-50/70 uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">Property / Tour</th>
                  <th className="px-5 py-3">Duration / Value</th>
                  <th className="px-5 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/6">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-ink-400">
                      <p className="text-sm font-medium text-ink-600">No events captured yet</p>
                      <p className="mt-1 text-xs text-ink-400">
                        Real tour views, session durations, and link shares will appear here as visitors interact with published tours.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.slice(0, 50).map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-ink-50/50">
                      <td className="px-5 py-3.5 font-medium">
                        {record.type === 'tour_view' && (
                          <span className="inline-flex items-center gap-1.5 text-brand-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                            Tour Viewed
                          </span>
                        )}
                        {record.type === 'session_duration' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Session Ended
                          </span>
                        )}
                        {record.type === 'link_shared' && (
                          <span className="inline-flex items-center gap-1.5 text-purple-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            Link Shared
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-950 font-medium">
                        {record.tourTitle || record.tourId}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600 font-mono">
                        {record.durationSeconds ? formatSeconds(record.durationSeconds) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-ink-400">
                        {formatDate(record.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Print Footer (Clean, no https link or admin text) ── */}
      <div className="print-only mt-10 border-t border-ink-950/15 pt-6 text-center text-xs text-ink-400">
        <p className="font-medium text-ink-600">
          TwinSpace · Professional 3D Property Intelligence
        </p>
        <p className="mt-1">
          Confidential property walkthrough telemetry report prepared for client review.
        </p>
      </div>
    </div>
  )
}
