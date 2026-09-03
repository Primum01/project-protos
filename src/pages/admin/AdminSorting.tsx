import { useMemo, useState } from "react"
import { useAdminListings } from '@/contexts/AdminDataContext'
import type { Listing } from "@/types/listing"

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

/* ── Helpers ────────────────────────────────────────────────────────────── */
type DueBucket = "3-days" | "1-week" | "all"

const SUBSCRIPTION_MONTHS = 1

function nextRenewalDate(datePaid: string): Date | null {
  if (!datePaid) return null
  const paid = new Date(datePaid)
  if (isNaN(paid.getTime())) return null
  const now = new Date()
  const renewal = new Date(paid)
  while (renewal <= now) {
    renewal.setMonth(renewal.getMonth() + SUBSCRIPTION_MONTHS)
  }
  return renewal
}

function daysUntil(date: Date): number {
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getBucket(listing: Listing): { renewal: Date | null; days: number | null; bucket: "3-days" | "1-week" | "none" } {
  const renewal = nextRenewalDate(listing.datePaid)
  if (!renewal) return { renewal: null, days: null, bucket: "none" }
  const days = daysUntil(renewal)
  if (days >= 0 && days <= 3) return { renewal, days, bucket: "3-days" }
  if (days >= 0 && days <= 7) return { renewal, days, bucket: "1-week" }
  return { renewal, days, bucket: "none" }
}

function exportCSV(rows: Array<{ listing: Listing; days: number; renewal: Date }>, label: string) {
  const headers = ["Name", "Email", "Phone", "Property", "Days Until Renewal", "Renewal Date"]
  const lines = rows.map(({ listing, days, renewal }) =>
    [
      listing.contactName,
      listing.contactEmail,
      listing.contactPhone,
      listing.name,
      days,
      renewal.toLocaleDateString("en-KE"),
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  )
  const csv = [headers.join(","), ...lines].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `subscriptions-${label}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Sub-components ─────────────────────────────────────────────────────── */
function DueBadge({ days }: { days: number }) {
  const urgent = days <= 3
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
        urgent
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {days === 0 ? "Due today" : days === 1 ? "1 day" : `${days} days`}
    </span>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
        <IconClock />
      </div>
      <p className="text-sm font-medium text-ink-600">No users {label}</p>
      <p className="mt-1 text-xs text-ink-400">They will appear here once subscription dates are recorded.</p>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export function AdminSorting() {
  const { listings, loading } = useAdminListings()
  const [activeBucket, setActiveBucket] = useState<DueBucket>("all")

  const enriched = useMemo(() => {
    return listings
      .map((l) => {
        const { renewal, days, bucket } = getBucket(l)
        return { listing: l, renewal, days, bucket }
      })
      .filter((r) => r.bucket !== "none") as Array<{
        listing: Listing
        renewal: Date
        days: number
        bucket: "3-days" | "1-week"
      }>
  }, [listings])

  const threeDays = enriched.filter((r) => r.bucket === "3-days")
  const oneWeek = enriched.filter((r) => r.bucket === "1-week")

  const visibleRows =
    activeBucket === "3-days"
      ? threeDays
      : activeBucket === "1-week"
        ? oneWeek
        : enriched

  function handleExport() {
    const label =
      activeBucket === "3-days" ? "3-days" : activeBucket === "1-week" ? "1-week" : "all-due"
    exportCSV(visibleRows, label)
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-950">Subscription Sorting</h1>
        <p className="mt-1 text-sm text-ink-500">
          Users whose subscriptions are coming due — sorted by urgency.
        </p>
      </div>

      {/* Stat cards */}
      {!loading && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">3 Days Due</p>
            <p className="mt-2 font-display text-3xl font-medium text-red-700">{threeDays.length}</p>
            <p className="mt-1 text-xs text-red-400">Needs immediate action</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">1 Week Due</p>
            <p className="mt-2 font-display text-3xl font-medium text-amber-700">{oneWeek.length}</p>
            <p className="mt-1 text-xs text-amber-500">Follow up soon</p>
          </div>
          <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft col-span-2 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Total Due</p>
            <p className="mt-2 font-display text-3xl font-medium text-ink-950">{enriched.length}</p>
            <p className="mt-1 text-xs text-ink-400">Across both windows</p>
          </div>
        </div>
      )}

      {/* Filter tabs + export */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-ink-950/8 bg-paper p-1 shadow-soft">
          {(
            [
              { key: "all", label: "All due" },
              { key: "3-days", label: "3 Days" },
              { key: "1-week", label: "1 Week" },
            ] as { key: DueBucket; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveBucket(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeBucket === tab.key
                  ? "bg-ink-950 text-white"
                  : "text-ink-500 hover:text-ink-900"
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
          Export to Excel (.csv)
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
                  {["Name", "Email", "Phone", "Property", "Renewal Date", "Due In"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/6">
                {visibleRows
                  .sort((a, b) => a.days - b.days)
                  .map(({ listing, renewal, days }) => (
                    <tr key={listing.id} className="transition-colors hover:bg-ink-50">
                      <td className="px-5 py-3.5 font-medium text-ink-950">
                        {listing.contactName || <span className="text-ink-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">
                        {listing.contactEmail ? (
                          <a
                            href={`mailto:${listing.contactEmail}`}
                            className="hover:text-brand-600 hover:underline"
                          >
                            {listing.contactEmail}
                          </a>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">
                        {listing.contactPhone || <span className="text-ink-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-ink-700">{listing.name}</td>
                      <td className="px-5 py-3.5 text-ink-600">
                        {renewal.toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <DueBadge days={days} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && visibleRows.length === 0 && (
        <EmptyState
          label={
            activeBucket === "3-days"
              ? "due within 3 days"
              : activeBucket === "1-week"
                ? "due within 1 week"
                : "with upcoming renewals"
          }
        />
      )}
    </div>
  )
}
