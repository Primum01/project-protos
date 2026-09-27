import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
import type { Listing } from '@/types/listing'
import {
  calculateRenewalDate,
  findExistingRenewalInvoice,
  formatDisplayDate,
  isEligibleForRenewalInvoice,
  normalizeBillingFrequency,
} from '@/lib/subscriptionRenewal'

/* ── Icons ──────────────────────────────────────────────────────────────── */
function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconFileText() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 14 14" />
      <path d="M3.05 11a9 9 0 0 1 1.5-3.5L3 6" />
    </svg>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
type DueBucket = 'all' | '3-days' | '1-week' | 'overdue'

function exportCSV(rows: Array<{ listing: Listing; days: number; renewal: Date }>, label: string) {
  const headers = ['Name', 'Email', 'Phone', 'Property', 'Package', 'Days Until Renewal', 'Renewal Date']
  const lines = rows.map(({ listing, days, renewal }) =>
    [
      listing.contactName,
      listing.contactEmail,
      listing.contactPhone,
      listing.name,
      normalizeBillingFrequency(listing.package),
      days < 0 ? `Overdue (${Math.abs(days)}d)` : days === 0 ? 'Due today' : `${days} days`,
      formatDisplayDate(renewal),
    ]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = [headers.join(','), ...lines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `subscriptions-${label}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Sub-components ─────────────────────────────────────────────────────── */
function DueBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-red-800">
        Overdue ({Math.abs(days)}d)
      </span>
    )
  }

  const urgent = days <= 3
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
        urgent
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {days === 0 ? 'Due today' : days === 1 ? '1 day' : `${days} days`}
    </span>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
        <IconClock />
      </div>
      <p className="text-sm font-medium text-ink-600">No subscriptions {label}</p>
      <p className="mt-1 text-xs text-ink-400">They will appear here once property payment dates are recorded.</p>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export function AdminSorting() {
  const navigate = useNavigate()
  const { listings, loading: listingsLoading } = useAdminListings()
  const { invoices, invoicesLoading } = useAdminFinance()
  const loading = listingsLoading || invoicesLoading

  const [activeBucket, setActiveBucket] = useState<DueBucket>('all')

  // Enrich listings with calculated renewal date, days until due, eligibility, and existing invoice checks
  const enriched = useMemo(() => {
    return listings
      .map((l) => {
        const renewal = calculateRenewalDate(l.datePaid, l.package)
        if (!renewal) return null

        const { eligible, days, isOverdue } = isEligibleForRenewalInvoice(renewal)
        const daysNum = days ?? 9999
        const existingInvoice = findExistingRenewalInvoice(l.id, renewal, invoices)

        let bucket: 'overdue' | '3-days' | '1-week' | 'future' = 'future'
        if (isOverdue) bucket = 'overdue'
        else if (daysNum <= 3) bucket = '3-days'
        else if (daysNum <= 7) bucket = '1-week'

        return {
          listing: l,
          renewal,
          days: daysNum,
          eligible,
          isOverdue,
          bucket,
          existingInvoice,
        }
      })
      .filter(Boolean) as Array<{
      listing: Listing
      renewal: Date
      days: number
      eligible: boolean
      isOverdue: boolean
      bucket: 'overdue' | '3-days' | '1-week' | 'future'
      existingInvoice: any
    }>
  }, [listings, invoices])

  const overdueRows = useMemo(() => enriched.filter((r) => r.bucket === 'overdue'), [enriched])
  const threeDaysRows = useMemo(() => enriched.filter((r) => r.bucket === '3-days'), [enriched])
  const oneWeekRows = useMemo(() => enriched.filter((r) => r.bucket === '1-week'), [enriched])

  // Rows that are urgent (overdue + 3-days + 1-week) for "all" view
  const allDueRows = useMemo(() => {
    return enriched.filter((r) => r.days <= 14)
  }, [enriched])

  const visibleRows =
    activeBucket === 'overdue'
      ? overdueRows
      : activeBucket === '3-days'
        ? threeDaysRows
        : activeBucket === '1-week'
          ? oneWeekRows
          : allDueRows

  function handleExport() {
    const label =
      activeBucket === 'overdue'
        ? 'overdue'
        : activeBucket === '3-days'
          ? '3-days'
          : activeBucket === '1-week'
            ? '1-week'
            : 'all-due'
    exportCSV(visibleRows, label)
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-950">Subscription Renewals</h1>
        <p className="mt-1 text-sm text-ink-500">
          Monitor active subscriptions, detect renewal windows (3 days before due date), and generate invoices without duplicate billing.
        </p>
      </div>

      {/* Stat cards */}
      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Overdue</p>
            <p className="mt-2 font-display text-3xl font-medium text-red-800">{overdueRows.length}</p>
            <p className="mt-1 text-xs text-red-500">Passed renewal date</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">3 Days Due</p>
            <p className="mt-2 font-display text-3xl font-medium text-amber-900">{threeDaysRows.length}</p>
            <p className="mt-1 text-xs text-amber-600">Invoice ready to generate</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">1 Week Due</p>
            <p className="mt-2 font-display text-3xl font-medium text-blue-800">{oneWeekRows.length}</p>
            <p className="mt-1 text-xs text-blue-500">Upcoming renewals</p>
          </div>
          <div className="col-span-2 rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Total Monitored</p>
            <p className="mt-2 font-display text-3xl font-medium text-ink-950">{enriched.length}</p>
            <p className="mt-1 text-xs text-ink-400">Active client properties</p>
          </div>
        </div>
      )}

      {/* Filter tabs + export */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-ink-950/8 bg-paper p-1 shadow-soft">
          {(
            [
              { key: 'all', label: `All Active (${allDueRows.length})` },
              { key: 'overdue', label: `Overdue (${overdueRows.length})` },
              { key: '3-days', label: `3 Days Due (${threeDaysRows.length})` },
              { key: '1-week', label: `1 Week (${oneWeekRows.length})` },
            ] as { key: DueBucket; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveBucket(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                activeBucket === tab.key
                  ? 'bg-ink-950 text-white'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <IconFilter />
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={visibleRows.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border border-ink-950/10 bg-paper px-4 py-2 text-sm font-medium text-ink-700 shadow-soft transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconDownload />
          Export (.csv)
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      )}

      {/* Table */}
      {!loading && visibleRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/8 bg-ink-50">
                  {['Client', 'Contact', 'Property', 'Package', 'Renewal Date', 'Urgency', 'Renewal Action'].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/6">
                {visibleRows
                  .sort((a, b) => a.days - b.days)
                  .map(({ listing, renewal, days, eligible, existingInvoice }) => {
                    const frequency = normalizeBillingFrequency(listing.package)

                    return (
                      <tr key={listing.id} className="transition-colors hover:bg-ink-50/70">
                        <td className="px-4 py-3.5 font-medium text-ink-950">
                          {listing.contactName || <span className="text-ink-300">—</span>}
                          {listing.accountNumber && (
                            <span className="block text-xs font-normal text-brand-600">
                              {listing.accountNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-ink-600">
                          {listing.contactEmail && (
                            <a
                              href={`mailto:${listing.contactEmail}`}
                              className="block hover:text-brand-600 hover:underline"
                            >
                              {listing.contactEmail}
                            </a>
                          )}
                          {listing.contactPhone && (
                            <span className="block text-ink-500">{listing.contactPhone}</span>
                          )}
                          {!listing.contactEmail && !listing.contactPhone && (
                            <span className="text-ink-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-ink-900">{listing.name}</p>
                          <p className="text-xs text-ink-400">{listing.location || listing.city}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              frequency === 'Annual'
                                ? 'border border-purple-200 bg-purple-50 text-purple-700'
                                : frequency === 'Biannual'
                                  ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                                  : frequency === 'Quarterly'
                                    ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                    : 'border border-ink-950/10 bg-ink-50 text-ink-700'
                            }`}
                          >
                            {frequency}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-ink-700 whitespace-nowrap font-medium">
                          {formatDisplayDate(renewal)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <DueBadge days={days} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Duplicate Prevention Guard */}
                            {existingInvoice ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800" title="Invoice already generated for this renewal period">
                                  ✓ {existingInvoice.invoiceNumber}
                                  {existingInvoice.status && (
                                    <span className="uppercase text-[10px] opacity-75">
                                      ({existingInvoice.status})
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/admin/invoice?search=${encodeURIComponent(existingInvoice.invoiceNumber)}&view=archive`,
                                    )
                                  }
                                  className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
                                >
                                  View
                                </button>
                              </div>
                            ) : eligible ? (
                              /* 3 Days or Overdue Action Button */
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/invoice?listingId=${listing.id}&action=generate_renewal`,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-medium text-white shadow-soft transition-colors hover:bg-brand-600"
                              >
                                <IconFileText />
                                Generate Invoice
                              </button>
                            ) : (
                              /* Premature Window: Do not show Generate Invoice button */
                              <span className="text-xs text-ink-400 italic">
                                Available in {days - 3}d
                              </span>
                            )}

                            {/* Client Invoice History Action */}
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/invoice?listingId=${listing.id}&view=history`,
                                )
                              }
                              title="View Client Invoice & Subscription History"
                              className="rounded-md border border-ink-950/10 p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                            >
                              <IconHistory />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && visibleRows.length === 0 && (
        <EmptyState
          label={
            activeBucket === 'overdue'
              ? 'currently overdue'
              : activeBucket === '3-days'
                ? 'due within 3 days'
                : activeBucket === '1-week'
                  ? 'due within 1 week'
                  : 'with upcoming renewals'
          }
        />
      )}
    </div>
  )
}
