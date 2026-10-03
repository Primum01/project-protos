import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminDropdown } from '@/components/admin/AdminDropdown'
import { formatMoney } from '@/lib/financeCalculations'
import {
  addMonths,
  calculateRenewalDate,
  findExistingRenewalInvoice,
  formatDisplayDate,
  isEligibleForRenewalInvoice,
  normalizeBillingFrequency,
} from '@/lib/subscriptionRenewal'
import type { BillingFrequency, SavedInvoice, SavedReceipt } from '@/types/finance'
import type { Listing } from '@/types/listing'

interface FinanceHostingProps {
  listings: Listing[]
  invoices: SavedInvoice[]
  receipts: SavedReceipt[]
  onOpenPaymentModal?: () => void
}

interface HostingRow {
  listing: Listing
  billingCycle: 'Quarterly' | 'Biannual' | 'Annual'
  cycleMonths: number
  amount: number
  startDateStr: string
  nextPaymentDate: Date | null
  daysUntilDue: number | null
  status: 'Active' | 'Due' | 'Overdue' | 'Ended'
  existingInvoice: SavedInvoice | null
}

export function FinanceHosting({ listings, invoices, receipts }: FinanceHostingProps) {
  const navigate = useNavigate()
  const [cycleFilter, setCycleFilter] = useState<'all' | 'Quarterly' | 'Biannual' | 'Annual'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHostingRow, setSelectedHostingRow] = useState<HostingRow | null>(null)

  // Enrich listings into standardized Hosting subscriptions
  // Enforces strictly 3 payment structures: Quarterly, Semi-annually (Biannual), Annually (NO monthly)
  const hostingRows = useMemo(() => {
    return listings
      .map((l): HostingRow | null => {
        // Normalize frequency to strictly Quarterly, Biannual, or Annual
        const rawFreq = normalizeBillingFrequency(l.package)
        let billingCycle: 'Quarterly' | 'Biannual' | 'Annual' = 'Quarterly'
        let cycleMonths = 3

        if (rawFreq === 'Annual') {
          billingCycle = 'Annual'
          cycleMonths = 12
        } else if (rawFreq === 'Biannual') {
          billingCycle = 'Biannual'
          cycleMonths = 6
        } else {
          // If Monthly or unspecified, map to Quarterly as per requirements
          billingCycle = 'Quarterly'
          cycleMonths = 3
        }

        // Calculate standard rate if not present
        let amount = 15000
        if (billingCycle === 'Annual') amount = 50000
        else if (billingCycle === 'Biannual') amount = 28000

        // Parse renewal date using existing subscription logic
        const nextPaymentDate = calculateRenewalDate(l.datePaid, billingCycle as BillingFrequency)
        let daysUntilDue: number | null = null
        let status: 'Active' | 'Due' | 'Overdue' | 'Ended' = 'Active'

        if (l.deactivated || l.status === 'sold' || l.status === 'off_market') {
          status = 'Ended'
        } else if (nextPaymentDate) {
          const { days, isOverdue } = isEligibleForRenewalInvoice(nextPaymentDate)
          daysUntilDue = days
          if (isOverdue) {
            status = 'Overdue'
          } else if (days !== null && days <= 7) {
            status = 'Due'
          } else {
            status = 'Active'
          }
        }

        const existingInvoice = nextPaymentDate
          ? findExistingRenewalInvoice(l.id, nextPaymentDate, invoices)
          : null

        return {
          listing: l,
          billingCycle,
          cycleMonths,
          amount,
          startDateStr: l.datePaid || 'Not recorded',
          nextPaymentDate,
          daysUntilDue,
          status,
          existingInvoice: existingInvoice || null,
        }
      })
      .filter(Boolean) as HostingRow[]
  }, [listings, invoices])

  // Filter rows
  const filtered = useMemo(() => {
    let result = [...hostingRows]

    if (cycleFilter !== 'all') {
      result = result.filter((r) => r.billingCycle === cycleFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (r) =>
          r.listing.name.toLowerCase().includes(q) ||
          (r.listing.contactName && r.listing.contactName.toLowerCase().includes(q)) ||
          (r.listing.contactEmail && r.listing.contactEmail.toLowerCase().includes(q)) ||
          (r.listing.contactPhone && r.listing.contactPhone.toLowerCase().includes(q)),
      )
    }

    return result
  }, [hostingRows, cycleFilter, statusFilter, searchQuery])

  // Subscriptions stats
  const activeCount = hostingRows.filter((r) => r.status === 'Active').length
  const dueCount = hostingRows.filter((r) => r.status === 'Due').length
  const overdueCount = hostingRows.filter((r) => r.status === 'Overdue').length
  const totalAnnualizedValue = hostingRows.reduce((acc, r) => {
    const annualFactor = 12 / r.cycleMonths
    return acc + r.amount * annualFactor
  }, 0)

  // Generate period schedule for the selected hosting details drawer
  const periodSchedule = useMemo(() => {
    if (!selectedHostingRow || !selectedHostingRow.nextPaymentDate) return []
    const periods: Array<{
      periodName: string
      dueDate: Date
      amount: number
      status: 'Paid' | 'Upcoming' | 'Overdue'
    }> = []

    const nextDate = new Date(selectedHostingRow.nextPaymentDate)
    const cycleMonths = selectedHostingRow.cycleMonths

    // Preceding cycle (considered Paid)
    const prevDate = addMonths(nextDate, -cycleMonths)
    periods.push({
      periodName: `Previous Cycle (${formatDisplayDate(prevDate)})`,
      dueDate: prevDate,
      amount: selectedHostingRow.amount,
      status: 'Paid',
    })

    // Current next cycle
    periods.push({
      periodName: `Current Cycle (${selectedHostingRow.billingCycle})`,
      dueDate: nextDate,
      amount: selectedHostingRow.amount,
      status: selectedHostingRow.status === 'Overdue' ? 'Overdue' : 'Upcoming',
    })

    // Next future cycle
    const futureDate = addMonths(nextDate, cycleMonths)
    periods.push({
      periodName: `Next Cycle (+${cycleMonths}mo)`,
      dueDate: futureDate,
      amount: selectedHostingRow.amount,
      status: 'Upcoming',
    })

    return periods
  }, [selectedHostingRow])

  // Invoices & Receipts for this specific listing
  const listingInvoices = useMemo(() => {
    if (!selectedHostingRow) return []
    return invoices.filter(
      (inv) =>
        inv.listingId === selectedHostingRow.listing.id ||
        (inv.propertyName &&
          inv.propertyName.toLowerCase() === selectedHostingRow.listing.name.toLowerCase()),
    )
  }, [selectedHostingRow, invoices])

  const listingReceipts = useMemo(() => {
    if (!selectedHostingRow) return []
    return receipts.filter(
      (rec) =>
        (rec.propertyName &&
          rec.propertyName.toLowerCase() === selectedHostingRow.listing.name.toLowerCase()),
    )
  }, [selectedHostingRow, receipts])

  return (
    <div className="space-y-6">
      {/* Header and Sorting Page Link */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">3D Tour Hosting Subscriptions</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Recurring tour hosting managed across Quarterly, Semi-annual, and Annual billing structures.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/sorting')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-2 text-xs font-semibold text-ink-800 shadow-soft transition-all hover:bg-ink-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          Open Subscription Sorter
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Active Hosting</p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">{activeCount}</p>
          <p className="mt-0.5 text-xs text-ink-400">Total properties hosted</p>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-amber-700">Due Soon (≤7d)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-600">{dueCount}</p>
          <p className="mt-0.5 text-xs text-amber-700">Renewals within 1 week</p>
        </div>

        <div className="rounded-xl border border-red-200/80 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-red-700">Overdue</p>
          <p className="mt-1 font-display text-2xl font-semibold text-red-600">{overdueCount}</p>
          <p className="mt-0.5 text-xs text-red-700">Renewal past due date</p>
        </div>

        <div className="rounded-xl border border-indigo-200/80 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-indigo-700">Annualized Run-Rate</p>
          <p className="mt-1 font-display text-2xl font-semibold text-indigo-600">
            KSh {formatMoney(totalAnnualizedValue)}
          </p>
          <p className="mt-0.5 text-xs text-indigo-700">Estimated recurring ARR</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search property, client contact, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <AdminDropdown<'all' | 'Quarterly' | 'Biannual' | 'Annual'>
            id="finance-hosting-cycle-filter"
            value={cycleFilter}
            onChange={(val) => setCycleFilter(val)}
            buttonClassName="py-1.5 px-3 text-xs min-w-[150px]"
            options={[
              { value: 'all', label: 'All Cycles' },
              { value: 'Quarterly', label: 'Quarterly (3 Months)' },
              { value: 'Biannual', label: 'Semi-annually (6 Months)' },
              { value: 'Annual', label: 'Annually (12 Months)' },
            ]}
          />

          <AdminDropdown<string>
            id="finance-hosting-status-filter"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            buttonClassName="py-1.5 px-3 text-xs min-w-[130px]"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'due', label: 'Due Soon' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'ended', label: 'Ended' },
            ]}
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Billing Cycle</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Start / Paid Date</th>
                <th className="px-4 py-3">Next Payment Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/5 text-ink-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-400">
                    No hosting subscriptions found matching selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.listing.id}
                    className="cursor-pointer transition-colors hover:bg-ink-50/40"
                    onClick={() => setSelectedHostingRow(r)}
                  >
                    <td className="px-4 py-3 font-semibold text-ink-950">
                      {r.listing.name}
                      <span className="block text-[11px] text-ink-400 font-normal">
                        {r.listing.location || 'Nairobi'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{r.listing.contactName || '—'}</p>
                      <p className="text-[10px] text-ink-400">{r.listing.contactPhone || r.listing.contactEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                        {r.billingCycle}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-display font-medium tabular-nums text-ink-950">
                      KSh {formatMoney(r.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                      {r.startDateStr}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.nextPaymentDate ? (
                        <div>
                          <p className="font-medium text-ink-900 font-mono text-[11px]">
                            {formatDisplayDate(r.nextPaymentDate)}
                          </p>
                          {r.daysUntilDue !== null && (
                            <span
                              className={`text-[10px] font-medium ${
                                r.daysUntilDue < 0
                                  ? 'text-red-600 font-semibold'
                                  : r.daysUntilDue <= 7
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-ink-400'
                              }`}
                            >
                              {r.daysUntilDue < 0
                                ? `${Math.abs(r.daysUntilDue)}d overdue`
                                : r.daysUntilDue === 0
                                ? 'Due today'
                                : `in ${r.daysUntilDue}d`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          r.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Due'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'Overdue'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedHostingRow(r)}
                          className="rounded px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100"
                        >
                          Details
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/invoice?renewalListingId=${encodeURIComponent(r.listing.id)}`,
                            )
                          }
                          className="rounded px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        >
                          Invoice →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Hosting Details Drawer / Modal */}
      {selectedHostingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-950/15 bg-paper p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-ink-950/10">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-950">
                  {selectedHostingRow.listing.name}
                </h3>
                <p className="text-xs text-ink-500">
                  Client: {selectedHostingRow.listing.contactName || 'General Client'} •{' '}
                  {selectedHostingRow.listing.contactPhone || selectedHostingRow.listing.contactEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedHostingRow(null)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Hosting overview cards */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-ink-50 p-3">
                <span className="text-[10px] uppercase font-semibold text-ink-400">Hosting Status</span>
                <p
                  className={`mt-1 font-semibold text-xs ${
                    selectedHostingRow.status === 'Active'
                      ? 'text-emerald-700'
                      : selectedHostingRow.status === 'Overdue'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}
                >
                  {selectedHostingRow.status}
                </p>
              </div>

              <div className="rounded-lg bg-ink-50 p-3">
                <span className="text-[10px] uppercase font-semibold text-ink-400">Billing Cycle</span>
                <p className="mt-1 font-semibold text-xs text-ink-900">
                  {selectedHostingRow.billingCycle}
                </p>
              </div>

              <div className="rounded-lg bg-ink-50 p-3">
                <span className="text-[10px] uppercase font-semibold text-ink-400">Cycle Rate</span>
                <p className="mt-1 font-display font-semibold text-xs text-ink-900">
                  KSh {formatMoney(selectedHostingRow.amount)}
                </p>
              </div>

              <div className="rounded-lg bg-ink-50 p-3">
                <span className="text-[10px] uppercase font-semibold text-ink-400">Next Due Date</span>
                <p className="mt-1 font-mono font-semibold text-xs text-ink-900">
                  {selectedHostingRow.nextPaymentDate
                    ? formatDisplayDate(selectedHostingRow.nextPaymentDate)
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Billing Periods Table */}
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                Hosting Period Schedule
              </h4>
              <div className="overflow-hidden rounded-lg border border-ink-950/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ink-50 font-medium text-ink-600">
                    <tr>
                      <th className="px-3 py-2">Period</th>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-950/5">
                    {periodSchedule.map((p, idx) => (
                      <tr key={idx} className="hover:bg-ink-50/50">
                        <td className="px-3 py-2 font-medium text-ink-900">{p.periodName}</td>
                        <td className="px-3 py-2 font-mono text-ink-600">
                          {formatDisplayDate(p.dueDate)}
                        </td>
                        <td className="px-3 py-2 text-right font-display tabular-nums text-ink-900">
                          KSh {formatMoney(p.amount)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              p.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'Overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Related Invoices & Receipts for this property */}
            <div className="mt-6 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Historical Property Financial Documents
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Invoices */}
                <div className="rounded-lg border border-ink-950/10 p-3 bg-white">
                  <p className="text-xs font-semibold text-ink-900 mb-2">
                    Invoices ({listingInvoices.length})
                  </p>
                  {listingInvoices.length === 0 ? (
                    <p className="text-[11px] text-ink-400">No invoices issued for this property.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {listingInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between text-xs border-b border-ink-950/5 pb-1"
                        >
                          <span className="font-mono text-[11px] text-brand-600">
                            {inv.invoiceNumber}
                          </span>
                          <span className="tabular-nums text-ink-700">
                            KSh {formatMoney(inv.totalDue)}
                          </span>
                          <span className="text-[10px] text-ink-500 uppercase">{inv.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipts */}
                <div className="rounded-lg border border-ink-950/10 p-3 bg-white">
                  <p className="text-xs font-semibold text-ink-900 mb-2">
                    Receipts ({listingReceipts.length})
                  </p>
                  {listingReceipts.length === 0 ? (
                    <p className="text-[11px] text-ink-400">No receipts issued for this property.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {listingReceipts.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between text-xs border-b border-ink-950/5 pb-1"
                        >
                          <span className="font-mono text-[11px] text-emerald-600">
                            {rec.receiptNumber}
                          </span>
                          <span className="tabular-nums text-emerald-700">
                            KSh {formatMoney(rec.totalPaid)}
                          </span>
                          <span className="text-[10px] text-ink-500">{rec.receiptDate || rec.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-6 flex items-center justify-between border-t border-ink-950/10 pt-4">
              <button
                type="button"
                onClick={() => setSelectedHostingRow(null)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-ink-600 hover:bg-ink-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const id = selectedHostingRow.listing.id
                  setSelectedHostingRow(null)
                  navigate(`/admin/invoice?renewalListingId=${encodeURIComponent(id)}`)
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-brand-700"
              >
                Generate Renewal Invoice →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
