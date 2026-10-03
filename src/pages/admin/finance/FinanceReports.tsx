import { useMemo, useState } from 'react'
import { AdminDropdown } from '@/components/admin/AdminDropdown'
import {
  calculateFinanceOverview,
  exportFinancialSummaryToCSV,
  formatMoney,
  getClientFinancialSummaries,
  getPropertyFinancialSummaries,
} from '@/lib/financeCalculations'
import type { ExpenseRecord, PaymentRecord, SavedInvoice, SavedReceipt } from '@/types/finance'
import type { Listing } from '@/types/listing'

interface FinanceReportsProps {
  invoices: SavedInvoice[]
  receipts: SavedReceipt[]
  expenses: ExpenseRecord[]
  payments: PaymentRecord[]
  listings: Listing[]
}

export function FinanceReports({
  invoices,
  receipts,
  expenses,
  payments,
  listings,
}: FinanceReportsProps) {
  const [reportTab, setReportTab] = useState<
    'profit-loss' | 'revenue' | 'expenses' | 'clients' | 'properties'
  >('profit-loss')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>('all')

  const overview = useMemo(() => {
    return calculateFinanceOverview(invoices, receipts, expenses, payments, listings, dateRange)
  }, [invoices, receipts, expenses, payments, listings, dateRange])

  const clientSummaries = useMemo(() => {
    return getClientFinancialSummaries(invoices, receipts, payments, listings)
  }, [invoices, receipts, payments, listings])

  const propertySummaries = useMemo(() => {
    return getPropertyFinancialSummaries(listings, invoices, receipts, payments)
  }, [listings, invoices, receipts, payments])

  // Category breakdown
  const expenseCategories = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    let grandTotal = 0

    for (const e of expenses) {
      const amt = Number(e.amount) || 0
      grandTotal += amt
      const prev = map.get(e.category) || { total: 0, count: 0 }
      map.set(e.category, { total: prev.total + amt, count: prev.count + 1 })
    }

    return Array.from(map.entries())
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Financial Reports & Auditing</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Real-time analytics across cash flow, revenue lines, client accounts, and property assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminDropdown<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>
            id="finance-reports-date-filter"
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            buttonClassName="py-2 px-3 text-xs min-w-[130px]"
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '12m', label: 'Last 12 Months' },
            ]}
          />

          <button
            onClick={() =>
              exportFinancialSummaryToCSV(overview, clientSummaries, propertySummaries)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-2 text-xs font-semibold text-ink-800 shadow-soft hover:bg-ink-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export All Data (CSV)
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-ink-950/10 pb-2">
        {(
          [
            { id: 'profit-loss', label: 'Net Profit & Loss' },
            { id: 'revenue', label: 'Revenue Sources' },
            { id: 'expenses', label: 'Expense Categories' },
            { id: 'clients', label: `Clients (${clientSummaries.length})` },
            { id: 'properties', label: `Properties (${propertySummaries.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              reportTab === tab.id
                ? 'bg-ink-950 text-white shadow-soft'
                : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Profit & Loss / Net Financial Position */}
      {reportTab === 'profit-loss' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
              <span className="text-xs uppercase font-medium text-ink-500">Collected Income</span>
              <p className="mt-2 font-display text-2xl font-semibold text-emerald-600">
                KSh {formatMoney(overview.totalIncome)}
              </p>
              <p className="mt-1 text-xs text-ink-400">Actual cash in bank</p>
            </div>

            <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
              <span className="text-xs uppercase font-medium text-ink-500">Recorded Expenses</span>
              <p className="mt-2 font-display text-2xl font-semibold text-rose-600">
                KSh {formatMoney(overview.totalExpenses)}
              </p>
              <p className="mt-1 text-xs text-ink-400">Operational outflows</p>
            </div>

            <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
              <span className="text-xs uppercase font-medium text-ink-500">Net Surplus</span>
              <p
                className={`mt-2 font-display text-2xl font-semibold ${
                  overview.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                KSh {formatMoney(overview.netIncome)}
              </p>
              <p className="mt-1 text-xs text-ink-400">Income minus expenses</p>
            </div>

            <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
              <span className="text-xs uppercase font-medium text-ink-500">Net Margin</span>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-950">
                {overview.totalIncome > 0
                  ? `${Math.round((overview.netIncome / overview.totalIncome) * 100)}%`
                  : '0%'}
              </p>
              <p className="mt-1 text-xs text-ink-400">Return on cash receipts</p>
            </div>
          </div>

          <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-ink-950">Net Position Audit Summary</h3>
            <div className="mt-4 divide-y divide-ink-950/8 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-ink-600">Total Invoiced (Accrual Billed)</span>
                <span className="font-semibold text-ink-950 font-display">
                  KSh {formatMoney(overview.totalInvoiced)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-600">Cash Actually Collected (Total Income)</span>
                <span className="font-semibold text-emerald-600 font-display">
                  +KSh {formatMoney(overview.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-600">Uncollected Client Receivables (Outstanding)</span>
                <span className="font-semibold text-amber-600 font-display">
                  KSh {formatMoney(overview.totalOutstanding)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-ink-600">Total Operating Expenses (Money Out)</span>
                <span className="font-semibold text-rose-600 font-display">
                  -KSh {formatMoney(overview.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between py-3 font-semibold text-sm bg-ink-50/50 px-2 rounded-md">
                <span className="text-ink-950">Net Financial Position</span>
                <span
                  className={`font-display ${
                    overview.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  KSh {formatMoney(overview.netIncome)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Revenue Sources */}
      {reportTab === 'revenue' && (
        <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-ink-950">Revenue Breakdown by Product Line</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              One-time shoot fees vs recurring Matterport 3D tour hosting
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-950/10 p-4">
              <span className="text-xs uppercase font-medium text-ink-500">Scan / 3D Shoot</span>
              <p className="mt-2 font-display text-xl font-semibold text-brand-600">
                KSh {formatMoney(overview.scanRevenue)}
              </p>
              <p className="mt-1 text-xs text-ink-400">One-time production shoots</p>
            </div>

            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/30 p-4">
              <span className="text-xs uppercase font-medium text-indigo-700">3D Tour Hosting</span>
              <p className="mt-2 font-display text-xl font-semibold text-indigo-600">
                KSh {formatMoney(overview.hostingRevenue)}
              </p>
              <p className="mt-1 text-xs text-indigo-600/80">Quarterly, Biannual & Annual recurring</p>
            </div>

            <div className="rounded-xl border border-ink-950/10 p-4">
              <span className="text-xs uppercase font-medium text-ink-500">Other Services</span>
              <p className="mt-2 font-display text-xl font-semibold text-ink-900">
                KSh {formatMoney(overview.otherRevenue)}
              </p>
              <p className="mt-1 text-xs text-ink-400">Add-ons & consultations</p>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Expense Categories */}
      {reportTab === 'expenses' && (
        <div className="rounded-xl border border-ink-950/8 bg-paper shadow-soft overflow-hidden">
          <div className="p-4 border-b border-ink-950/8">
            <h3 className="text-sm font-semibold text-ink-950">Operating Expenses by Category</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-50/70 border-b border-ink-950/8 font-semibold text-ink-600">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Entries</th>
                <th className="px-4 py-3 text-right">Share</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/5">
              {expenseCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-400">
                    No expense records available.
                  </td>
                </tr>
              ) : (
                expenseCategories.map((c) => (
                  <tr key={c.category} className="hover:bg-ink-50/40">
                    <td className="px-4 py-3 font-medium text-ink-950">{c.category}</td>
                    <td className="px-4 py-3 text-center text-ink-500">{c.count}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-600">{c.percent}%</td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-rose-600 tabular-nums">
                      KSh {formatMoney(c.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 4: Clients */}
      {reportTab === 'clients' && (
        <div className="rounded-xl border border-ink-950/8 bg-paper shadow-soft overflow-hidden">
          <div className="p-4 border-b border-ink-950/8">
            <h3 className="text-sm font-semibold text-ink-950">Client Financial Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50/70 border-b border-ink-950/8 font-semibold text-ink-600">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-center">Properties</th>
                  <th className="px-4 py-3 text-center">Active Hosting</th>
                  <th className="px-4 py-3 text-right">Total Billed</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/5">
                {clientSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-400">
                      No client financial data available.
                    </td>
                  </tr>
                ) : (
                  clientSummaries.map((c) => (
                    <tr key={c.clientName} className="hover:bg-ink-50/40">
                      <td className="px-4 py-3 font-medium text-ink-950">
                        {c.clientName}
                        {(c.contactEmail || c.clientEmail || c.contactPhone || c.clientPhone) && (
                          <span className="block text-[10px] text-ink-400">
                            {c.contactPhone || c.clientPhone || c.contactEmail || c.clientEmail}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-ink-600 font-medium">
                        {c.propertyCount}
                      </td>
                      <td className="px-4 py-3 text-center text-indigo-600 font-semibold">
                        {c.activeHostingCount ?? c.activeSubscriptionsCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-ink-800">
                        KSh {formatMoney(c.totalBilled)}
                      </td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-emerald-600 font-medium">
                        KSh {formatMoney(c.totalPaid)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-display tabular-nums font-semibold ${
                          c.totalOutstanding > 0 ? 'text-amber-600' : 'text-ink-400'
                        }`}
                      >
                        KSh {formatMoney(c.totalOutstanding)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Properties */}
      {reportTab === 'properties' && (
        <div className="rounded-xl border border-ink-950/8 bg-paper shadow-soft overflow-hidden">
          <div className="p-4 border-b border-ink-950/8">
            <h3 className="text-sm font-semibold text-ink-950">Property Financial Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50/70 border-b border-ink-950/8 font-semibold text-ink-600">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Scan Revenue</th>
                  <th className="px-4 py-3 text-right">Hosting Revenue</th>
                  <th className="px-4 py-3 text-right">Total Collected</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/5">
                {propertySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-400">
                      No property financial data available.
                    </td>
                  </tr>
                ) : (
                  propertySummaries.map((p) => (
                    <tr key={p.listingId || p.propertyId} className="hover:bg-ink-50/40">
                      <td className="px-4 py-3 font-semibold text-ink-950">
                        {p.propertyName}
                        {p.location && (
                          <span className="block text-[10px] text-ink-400 font-normal">
                            {p.location}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{p.clientName}</td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-ink-800">
                        KSh {formatMoney(p.scanRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-indigo-600 font-medium">
                        KSh {formatMoney(p.hostingRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-display tabular-nums text-emerald-600 font-semibold">
                        KSh {formatMoney(p.totalCollected ?? p.totalRevenue ?? 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-display tabular-nums font-semibold ${
                          (p.totalOutstanding ?? p.outstanding ?? 0) > 0 ? 'text-amber-600' : 'text-ink-400'
                        }`}
                      >
                        KSh {formatMoney(p.totalOutstanding ?? p.outstanding ?? 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
