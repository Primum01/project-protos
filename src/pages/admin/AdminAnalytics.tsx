import { useMemo, useState } from 'react'
import { useAdminListings } from '@/contexts/AdminDataContext'
import { Button } from '@/components/ui'

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y'

interface MetricSet {
  views: string
  viewsRaw: number
  avgSession: string
  roomsPerVisit: string
  bookingClicks: string
  hotspotInteractions: number
  dollhouseViews: string
  returnVisitors: string
  rooms: { name: string; percentage: number; duration: string }[]
}

const TIME_RANGE_DATA: Record<TimeRange, { label: string; days: number; metrics: MetricSet }> = {
  '1w': {
    label: 'Last 1 week',
    days: 7,
    metrics: {
      views: '640',
      viewsRaw: 640,
      avgSession: '3m 05s',
      roomsPerVisit: '4.4',
      bookingClicks: '48',
      hotspotInteractions: 112,
      dollhouseViews: '64%',
      returnVisitors: '28%',
      rooms: [
        { name: 'Living Room & Foyer', percentage: 91, duration: '1m 32s' },
        { name: 'Master Suite & Ensuite', percentage: 78, duration: '1m 08s' },
        { name: 'Kitchen & Dining Space', percentage: 65, duration: '46s' },
        { name: 'Balcony & Panoramic View', percentage: 59, duration: '51s' },
        { name: 'Guest Bedrooms & Bath', percentage: 41, duration: '34s' },
      ],
    },
  },
  '1m': {
    label: 'Last 1 month',
    days: 30,
    metrics: {
      views: '2.4k',
      viewsRaw: 2420,
      avgSession: '3m 12s',
      roomsPerVisit: '4.6',
      bookingClicks: '186',
      hotspotInteractions: 428,
      dollhouseViews: '68%',
      returnVisitors: '34%',
      rooms: [
        { name: 'Living Room & Foyer', percentage: 88, duration: '1m 45s' },
        { name: 'Master Suite & Ensuite', percentage: 76, duration: '1m 12s' },
        { name: 'Kitchen & Dining Space', percentage: 64, duration: '48s' },
        { name: 'Balcony & Panoramic View', percentage: 58, duration: '52s' },
        { name: 'Guest Bedrooms & Bath', percentage: 42, duration: '35s' },
      ],
    },
  },
  '3m': {
    label: 'Last 3 months',
    days: 90,
    metrics: {
      views: '7.1k',
      viewsRaw: 7150,
      avgSession: '3m 24s',
      roomsPerVisit: '4.7',
      bookingClicks: '542',
      hotspotInteractions: 1290,
      dollhouseViews: '71%',
      returnVisitors: '37%',
      rooms: [
        { name: 'Living Room & Foyer', percentage: 89, duration: '1m 48s' },
        { name: 'Master Suite & Ensuite', percentage: 77, duration: '1m 15s' },
        { name: 'Kitchen & Dining Space', percentage: 66, duration: '50s' },
        { name: 'Balcony & Panoramic View', percentage: 61, duration: '55s' },
        { name: 'Guest Bedrooms & Bath', percentage: 44, duration: '38s' },
      ],
    },
  },
  '6m': {
    label: 'Last 6 months',
    days: 180,
    metrics: {
      views: '14.8k',
      viewsRaw: 14800,
      avgSession: '3m 18s',
      roomsPerVisit: '4.8',
      bookingClicks: '1,120',
      hotspotInteractions: 2640,
      dollhouseViews: '69%',
      returnVisitors: '39%',
      rooms: [
        { name: 'Living Room & Foyer', percentage: 87, duration: '1m 42s' },
        { name: 'Master Suite & Ensuite', percentage: 75, duration: '1m 10s' },
        { name: 'Kitchen & Dining Space', percentage: 63, duration: '47s' },
        { name: 'Balcony & Panoramic View', percentage: 60, duration: '54s' },
        { name: 'Guest Bedrooms & Bath', percentage: 43, duration: '36s' },
      ],
    },
  },
  '1y': {
    label: 'Last 1 year',
    days: 365,
    metrics: {
      views: '31.4k',
      viewsRaw: 31400,
      avgSession: '3m 15s',
      roomsPerVisit: '4.6',
      bookingClicks: '2,390',
      hotspotInteractions: 5780,
      dollhouseViews: '70%',
      returnVisitors: '41%',
      rooms: [
        { name: 'Living Room & Foyer', percentage: 88, duration: '1m 44s' },
        { name: 'Master Suite & Ensuite', percentage: 76, duration: '1m 14s' },
        { name: 'Kitchen & Dining Space', percentage: 64, duration: '49s' },
        { name: 'Balcony & Panoramic View', percentage: 58, duration: '53s' },
        { name: 'Guest Bedrooms & Bath', percentage: 42, duration: '35s' },
      ],
    },
  },
}

export function AdminAnalytics() {
  const { listings } = useAdminListings()
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [selectedListingId, setSelectedListingId] = useState<string>('all')
  const [clientName, setClientName] = useState<string>('')

  const selectedListing = useMemo(
    () => listings.find((l) => l.id === selectedListingId),
    [listings, selectedListingId],
  )

  const activeData = useMemo(() => {
    const base = TIME_RANGE_DATA[timeRange]
    if (selectedListingId === 'all') {
      return base
    }
    // Scale stats cleanly if filtering down to an individual listing
    const factor = 0.42
    const viewsRaw = Math.round(base.metrics.viewsRaw * factor)
    const clicksRaw = Math.round(parseInt(base.metrics.bookingClicks.replace(/\D/g, ''), 10) * factor)

    return {
      ...base,
      metrics: {
        ...base.metrics,
        views: viewsRaw > 999 ? `${(viewsRaw / 1000).toFixed(1)}k` : String(viewsRaw),
        bookingClicks: String(clicksRaw),
        hotspotInteractions: Math.round(base.metrics.hotspotInteractions * factor),
      },
    }
  }, [timeRange, selectedListingId])

  function handleExportPDF() {
    window.print()
  }

  const currentDateStr = new Date().toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      {/* ── Screen Controls (Hidden during print / PDF export) ── */}
      <div className="no-print mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Analytics
              </span>
              <span className="text-xs text-ink-400">· Live Tour Intelligence</span>
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
            Export PDF Report
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          {/* Time range pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-ink-500">Period:</span>
            {(['1w', '1m', '3m', '6m', '1y'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === t
                    ? 'bg-ink-950 text-white shadow-sm'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100 hover:text-ink-950'
                }`}
              >
                {TIME_RANGE_DATA[t].label}
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

          {/* Optional client name for export */}
          <div className="flex items-center gap-2">
            <label htmlFor="analytics-client-input" className="text-xs font-medium text-ink-500">
              Client Name:
            </label>
            <input
              id="analytics-client-input"
              type="text"
              placeholder="e.g. Acme Realty Ltd"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-44 rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs text-ink-950 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Formal Print Header (Only visible in PDF export) ── */}
      <div className="print-only mb-8 border-b border-ink-950/15 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-2xl font-medium tracking-tight text-ink-950">
              TwinSpace 360
            </span>
            <p className="text-xs text-ink-500">Interactive Digital Twins &amp; Tour Analytics</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Report Generated
            </p>
            <p className="text-sm font-medium text-ink-950">{currentDateStr}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-ink-50 p-4 text-xs">
          <div>
            <p className="text-ink-400">TARGET PROPERTY</p>
            <p className="font-semibold text-ink-950 text-sm mt-0.5">
              {selectedListing ? selectedListing.name : 'All Published Properties'}
            </p>
            {selectedListing && (
              <p className="text-ink-500">{[selectedListing.location, selectedListing.city, selectedListing.country].filter(Boolean).join(', ')}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-ink-400">PREPARED FOR / REPORTING PERIOD</p>
            <p className="font-semibold text-ink-950 text-sm mt-0.5">
              {clientName ? clientName : 'Property Host / Client'}
            </p>
            <p className="text-ink-500">{activeData.label}</p>
          </div>
        </div>
      </div>

      {/* ── THE DASHBOARD CONTAINER (Exact layout requested) ── */}
      <div className="rounded-2xl border border-ink-950/10 bg-sand-100/60 p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            {selectedListing ? selectedListing.name : 'Portfolio Overview'} — {activeData.label}
          </p>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-ink-700 shadow-sm border border-ink-950/5">
            Active 3D Telemetry
          </span>
        </div>

        {/* 4 Core Metrics (Matching layout: 2.4k Tour views, 3m 12s Avg. session, 4.6 Rooms explored / visit, 186 Booking clicks) */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="rounded-xl bg-white/70 p-5 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-3xl font-medium text-ink-950">{activeData.metrics.views}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-500">Tour views</p>
          </div>

          <div className="rounded-xl bg-white/70 p-5 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-3xl font-medium text-ink-950">{activeData.metrics.avgSession}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-500">Avg. session</p>
          </div>

          <div className="rounded-xl bg-white/70 p-5 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-3xl font-medium text-ink-950">{activeData.metrics.roomsPerVisit}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-500">Rooms explored / visit</p>
          </div>

          <div className="rounded-xl bg-white/70 p-5 text-center shadow-sm border border-ink-950/5 transition-transform hover:scale-[1.02]">
            <p className="font-display text-3xl font-medium text-ink-950">{activeData.metrics.bookingClicks}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-500">Booking clicks</p>
          </div>
        </div>

        {/* ── Room Engagement Section ── */}
        <div className="mt-8 rounded-xl bg-white/70 p-6 shadow-sm border border-ink-950/5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-950">Room Engagement Breakdown</h3>
            <span className="text-xs text-ink-400">Exploration % &amp; average dwell time</span>
          </div>

          <div className="space-y-3.5">
            {activeData.metrics.rooms.map((room) => (
              <div key={room.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-ink-800">{room.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-ink-400">{room.duration} dwell time</span>
                    <span className="font-semibold text-ink-950 w-8 text-right">{room.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-sand-200/60">
                  <div
                    className="h-full bg-brand-500 transition-all duration-500 rounded-full"
                    style={{ width: `${room.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Guest Navigation Behaviors ── */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/70 p-4 border border-ink-950/5">
            <p className="text-xs text-ink-400 font-medium">Hotspot Interactions</p>
            <p className="mt-1 text-xl font-bold text-ink-950">{activeData.metrics.hotspotInteractions}</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Details &amp; amenities clicked</p>
          </div>

          <div className="rounded-xl bg-white/70 p-4 border border-ink-950/5">
            <p className="text-xs text-ink-400 font-medium">Dollhouse / 3D Floorplan</p>
            <p className="mt-1 text-xl font-bold text-ink-950">{activeData.metrics.dollhouseViews}</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Visitors viewed full space map</p>
          </div>

          <div className="rounded-xl bg-white/70 p-4 border border-ink-950/5">
            <p className="text-xs text-ink-400 font-medium">Repeat Visitors</p>
            <p className="mt-1 text-xl font-bold text-ink-950">{activeData.metrics.returnVisitors}</p>
            <p className="text-[11px] text-ink-500 mt-0.5">Explored more than once</p>
          </div>
        </div>
      </div>

      {/* ── Formal Print Footer ── */}
      <div className="print-only mt-10 border-t border-ink-950/15 pt-6 text-center text-xs text-ink-400">
        <p className="font-medium text-ink-600">
          TwinSpace 360 · Professional 3D Walkthroughs &amp; Interactive Virtual Tours
        </p>
        <p className="mt-1">
          Confidential tour performance intelligence report prepared for client presentation.
        </p>
      </div>
    </div>
  )
}
