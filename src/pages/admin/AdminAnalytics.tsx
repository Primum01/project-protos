import { useMemo, useState } from 'react'
import { useAdminListings } from '@/contexts/AdminDataContext'
import { Button } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'
import { formatExportFilename } from '@/lib/exportFilename'
import { SheetDiaspaceWatermark } from '@/components/common/SheetDiaspaceWatermark'
import { tabStorage } from '@/lib/storage'

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y'

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '1w', label: 'Last 1 week' },
  { id: '1m', label: 'Last 1 month' },
  { id: '3m', label: 'Last 3 months' },
  { id: '6m', label: 'Last 6 months' },
  { id: '1y', label: 'Last 1 year' },
]

interface MetricData {
  totalViews: string
  visitors: string
  impressions: string
}

const STORAGE_KEY = 'ts_admin_analytics_metrics_v1'

// Clean up any legacy localStorage entry from older builds
try {
  localStorage.removeItem(STORAGE_KEY)
} catch {
  /* ignore */
}

function getInitialMetrics(): Record<string, MetricData> {
  try {
    const saved = tabStorage.get(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function AdminAnalytics() {
  const { listings } = useAdminListings()
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [selectedListingId, setSelectedListingId] = useState<string>('all')
  const [clientName, setClientName] = useState<string>('')
  const [metricsMap, setMetricsMap] = useState<Record<string, MetricData>>(getInitialMetrics)

  usePageMeta({
    title: 'Tour Performance Report — TwinSpace',
    description: '3D virtual tour performance report generator.',
    path: '/admin/analytics',
    noIndex: true,
  })

  const selectedListing = useMemo(
    () => listings.find((l) => l.id === selectedListingId),
    [listings, selectedListingId],
  )

  const activeRangeConfig = useMemo(
    () => TIME_RANGES.find((t) => t.id === timeRange) ?? TIME_RANGES[1],
    [timeRange],
  )

  // Current metric values for the selected property
  const currentMetrics = metricsMap[selectedListingId] || {
    totalViews: '',
    visitors: '',
    impressions: '',
  }

  function handleMetricChange(field: keyof MetricData, value: string) {
    setMetricsMap((prev) => {
      const next = {
        ...prev,
        [selectedListingId]: {
          ...(prev[selectedListingId] || { totalViews: '', visitors: '', impressions: '' }),
          [field]: value,
        },
      }
      try {
        tabStorage.set(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  function handleExportPDF() {
    const origTitle = document.title
    const clientOrProp = clientName.trim() || selectedListing?.name || 'All Published Properties'
    const tourType = selectedListing?.propertyType
      ? `${selectedListing.propertyType} 3D Tour`
      : '3D Virtual Tour'
    const pdfFilename = formatExportFilename({
      clientOrProperty: clientOrProp,
      tourType,
      date: new Date(),
    })

    document.title = pdfFilename
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
    <div className="mx-auto max-w-5xl p-6 lg:p-10 a4-print-container">
      {/* ── Screen Controls (Omitted during PDF export) ── */}
      <div className="no-print mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Analytics
              </span>
              <span className="text-xs text-ink-400">· Tour Performance Report</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold text-ink-950">
              Tour Performance Report
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500 leading-relaxed">
              Enter tour metrics below and export a branded PDF performance report for clients and property owners.
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

      {/* ── THE ANALYTICS REPORT CONTAINER (A4 Fitted, 3/4 custom sheet) ── */}
      <div className="a4-document-sheet rounded-2xl border border-ink-950/10 bg-sand-100/60 p-6 sm:p-10 print:p-8 sm:print:p-10 shadow-soft text-ink-950 print:border print:border-ink-950/15 print:rounded-xl print:shadow-none relative">
        {/* ── Formal Print Header (Inside sheet for balanced 3/4 page layout) ── */}
        <div className="print-only border-b border-ink-950/15 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <img
                src="/twinspace-analytics-logo.png"
                alt="TwinSpace 360"
                className="h-12 sm:h-14 print:h-14 w-auto object-contain"
              />
              <p className="mt-1 text-xs text-ink-500 font-medium">Interactive 3D Virtual Tour Performance</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Report Date
              </p>
              <p className="text-sm font-semibold text-ink-950">{currentDateStr}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white/70 border border-ink-950/10 p-4 text-xs">
            <div>
              <p className="text-ink-400 font-bold uppercase tracking-wider text-[11px]">PROPERTY</p>
              <p className="font-semibold text-ink-950 text-sm mt-0.5">
                {selectedListing ? selectedListing.name : 'All Published Properties'}
              </p>
              {selectedListing && (
                <p className="text-ink-500 text-xs mt-0.5">
                  {[selectedListing.location, selectedListing.city, selectedListing.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-ink-400 font-bold uppercase tracking-wider text-[11px]">PREPARED FOR / REPORTING PERIOD</p>
              <p className="font-semibold text-ink-950 text-sm mt-0.5">
                {clientName || 'Property Host / Client'}
              </p>
              <p className="text-ink-500 text-xs mt-0.5">{activeRangeConfig.label}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Title & Badge */}
        <div className="my-5 print:my-4 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink-600 print:text-ink-700">
            {selectedListing ? selectedListing.name : 'Tour Performance'} — {activeRangeConfig.label}
          </p>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink-700 shadow-sm border border-ink-950/10">
            Tour Analytics
          </span>
        </div>

        {/* 3 Metrics: Total views, Visitors, Impressions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 my-auto py-2 print:py-6">
          {/* 1. Total views */}
          <div className="rounded-xl bg-white/90 p-6 print:p-8 text-center shadow-sm border border-ink-950/10 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/50">
            <div className="no-print">
              <input
                id="analytics-input-total-views"
                type="text"
                value={currentMetrics.totalViews}
                onChange={(e) => handleMetricChange('totalViews', e.target.value)}
                placeholder="0"
                className="w-full text-center font-display text-4xl font-bold text-ink-950 bg-transparent rounded-lg hover:bg-ink-50/70 focus:bg-ink-50 focus:outline-none transition-all py-1 placeholder:text-ink-300"
                aria-label="Total views"
              />
              <span className="block mt-1 text-[10px] text-ink-400">Click to enter figure</span>
            </div>
            <p className="print-only font-display text-5xl font-bold text-ink-950 tracking-tight">
              {currentMetrics.totalViews || '0'}
            </p>
            <p className="mt-3 text-xs sm:text-sm print:text-sm font-bold uppercase tracking-wider text-ink-700">
              Total views
            </p>
            <p className="mt-1 text-xs print:text-xs text-ink-500">
              Times your 3D tour was opened and viewed.
            </p>
          </div>

          {/* 2. Visitors */}
          <div className="rounded-xl bg-white/90 p-6 print:p-8 text-center shadow-sm border border-ink-950/10 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/50">
            <div className="no-print">
              <input
                id="analytics-input-visitors"
                type="text"
                value={currentMetrics.visitors}
                onChange={(e) => handleMetricChange('visitors', e.target.value)}
                placeholder="0"
                className="w-full text-center font-display text-4xl font-bold text-ink-950 bg-transparent rounded-lg hover:bg-ink-50/70 focus:bg-ink-50 focus:outline-none transition-all py-1 placeholder:text-ink-300"
                aria-label="Visitors"
              />
              <span className="block mt-1 text-[10px] text-ink-400">Click to enter figure</span>
            </div>
            <p className="print-only font-display text-5xl font-bold text-ink-950 tracking-tight">
              {currentMetrics.visitors || '0'}
            </p>
            <p className="mt-3 text-xs sm:text-sm print:text-sm font-bold uppercase tracking-wider text-ink-700">
              Visitors
            </p>
            <p className="mt-1 text-xs print:text-xs text-ink-500">
              People who viewed your 3D tour.
            </p>
          </div>

          {/* 3. Impressions */}
          <div className="rounded-xl bg-white/90 p-6 print:p-8 text-center shadow-sm border border-ink-950/10 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/50">
            <div className="no-print">
              <input
                id="analytics-input-impressions"
                type="text"
                value={currentMetrics.impressions}
                onChange={(e) => handleMetricChange('impressions', e.target.value)}
                placeholder="0"
                className="w-full text-center font-display text-4xl font-bold text-ink-950 bg-transparent rounded-lg hover:bg-ink-50/70 focus:bg-ink-50 focus:outline-none transition-all py-1 placeholder:text-ink-300"
                aria-label="Impressions"
              />
              <span className="block mt-1 text-[10px] text-ink-400">Click to enter figure</span>
            </div>
            <p className="print-only font-display text-5xl font-bold text-ink-950 tracking-tight">
              {currentMetrics.impressions || '0'}
            </p>
            <p className="mt-3 text-xs sm:text-sm print:text-sm font-bold uppercase tracking-wider text-ink-700">
              Impressions
            </p>
            <p className="mt-1 text-xs print:text-xs text-ink-500">
              Times your 3D tour was shown on a page.
            </p>
          </div>
        </div>

        {/* ── Print Footer (Clean, with TwinSpace Logo & DiaSpace Watermark) ── */}
        <div className="print-only border-t border-ink-950/15 pt-5 text-center text-xs text-ink-500 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/twinspace-analytics-logo.png" alt="TwinSpace 360" className="h-6 w-auto object-contain" />
            <span className="font-semibold text-ink-700">· Professional 3D Property Intelligence</span>
          </div>
          <p className="text-xs text-ink-500">
            Confidential property walkthrough telemetry report prepared for client review.
          </p>
          <SheetDiaspaceWatermark />
        </div>
      </div>

      {/* ── Screen Footer Watermark Preview ── */}
      <div className="no-print mt-8 max-w-4xl mx-auto">
        <SheetDiaspaceWatermark />
      </div>
    </div>
  )
}
