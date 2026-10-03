import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  calculateFinanceOverview,
  formatMoney,
  getMoneyToWatch,
} from '@/lib/financeCalculations'
import { formatDisplayDate } from '@/lib/subscriptionRenewal'
import type { ExpenseRecord, PaymentRecord, SavedInvoice, SavedReceipt } from '@/types/finance'
import type { Listing } from '@/types/listing'

interface FinanceOverviewProps {
  invoices: SavedInvoice[]
  receipts: SavedReceipt[]
  expenses: ExpenseRecord[]
  payments: PaymentRecord[]
  listings: Listing[]
  dateRange: '7d' | '30d' | '3m' | '6m' | '12m' | 'all'
  setDateRange: (range: '7d' | '30d' | '3m' | '6m' | '12m' | 'all') => void
  onOpenPaymentModal: () => void
  onOpenExpenseModal: () => void
  onNavigateTab: (tab: string) => void
}

function StatCard({
  label,
  value,
  sub,
  highlight,
  badge,
  icon,
}: {
  label: string
  value: string
  sub?: string
  highlight?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'default'
  badge?: string
  icon?: React.ReactNode
}) {
  const highlightColor =
    highlight === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : highlight === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : highlight === 'rose'
      ? 'text-rose-600 dark:text-rose-400'
      : highlight === 'indigo'
      ? 'text-indigo-600 dark:text-indigo-400'
      : 'text-ink-950 dark:text-ink-50'

  return (
    <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft transition-all hover:border-ink-950/15">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</p>
        {icon && <div className="text-ink-400">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-display text-2xl font-semibold tracking-tight ${highlightColor}`}>
          KSh {value}
        </p>
        {badge && (
          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
            {badge}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  )
}

export function FinanceOverview({
  invoices,
  receipts,
  expenses,
  payments,
  listings,
  dateRange,
  setDateRange,
  onOpenPaymentModal,
  onOpenExpenseModal,
  onNavigateTab,
}: FinanceOverviewProps) {
  const navigate = useNavigate()

  const overview = useMemo(() => {
    return calculateFinanceOverview(invoices, receipts, expenses, payments, listings, dateRange)
  }, [invoices, receipts, expenses, payments, listings, dateRange])

  const moneyToWatch = useMemo(() => {
    return getMoneyToWatch(listings, invoices, payments, receipts)
  }, [listings, invoices, payments, receipts])

  // Calculation for visual performance bar
  const totalVolume = (overview.totalIncome + overview.totalExpenses) || 1
  const incomePct = Math.round((overview.totalIncome / totalVolume) * 100)
  const expensePct = Math.round((overview.totalExpenses / totalVolume) * 100)

  // Revenue proportions
  const totalRev = overview.totalIncome || 1
  const scanPct = Math.round((overview.scanRevenue / totalRev) * 100)
  const hostingPct = Math.round((overview.hostingRevenue / totalRev) * 100)
  const otherPct = Math.max(0, 100 - scanPct - hostingPct)

  return (
    <div className="space-y-8">
      {/* Time Range Filter & Fast Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-ink-950/10 bg-ink-50 p-1 text-xs font-medium">
          {(
            [
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '3m', label: '3 Months' },
              { key: '6m', label: '6 Months' },
              { key: '12m', label: '12 Months' },
              { key: 'all', label: 'All Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setDateRange(t.key)}
              className={`rounded-md px-3 py-1.5 transition-all ${
                dateRange === t.key
                  ? 'bg-paper text-ink-950 shadow-xs font-semibold'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPaymentModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-emerald-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Payment
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-2 text-xs font-semibold text-ink-800 shadow-soft transition-all hover:bg-ink-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Expense
          </button>
        </div>
      </div>

      {/* Top Level Financial Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Income"
          value={formatMoney(overview.totalIncome)}
          sub="Cash actually received"
          highlight="emerald"
          badge="Cash In"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(overview.totalOutstanding)}
          sub="Unpaid client balances"
          highlight={overview.totalOutstanding > 0 ? 'amber' : 'default'}
          badge="Receivables"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(overview.totalExpenses)}
          sub="Recorded business spending"
          highlight="rose"
          badge="Cash Out"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
              <path d="M18 8l4 4-4 4" />
              <path d="M8 12h14" />
            </svg>
          }
        />
        <StatCard
          label="Net Position"
          value={formatMoney(overview.netIncome)}
          sub="Income minus expenses"
          highlight={overview.netIncome >= 0 ? 'emerald' : 'rose'}
          badge={overview.netIncome >= 0 ? 'Surplus' : 'Deficit'}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
        <StatCard
          label="Hosting Revenue"
          value={formatMoney(overview.hostingRevenue)}
          sub={`${overview.activeHostingCount} active hosting plans`}
          highlight="indigo"
          badge="Recurring"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          }
        />
      </div>

      {/* Financial Performance & Revenue Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Visualization */}
        <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-950">Financial Performance</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Income received vs recorded business expenses ({dateRange.toUpperCase()})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-ink-400">Net Margin</span>
              <p className="font-display text-sm font-semibold text-ink-950">
                {overview.totalIncome > 0
                  ? `${Math.round((overview.netIncome / overview.totalIncome) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-emerald-700">
                Income: KSh {formatMoney(overview.totalIncome)} ({incomePct}%)
              </span>
              <span className="font-medium text-rose-700">
                Expenses: KSh {formatMoney(overview.totalExpenses)} ({expensePct}%)
              </span>
            </div>
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-ink-100 p-0.5">
              <div
                style={{ width: `${incomePct}%` }}
                className="rounded-l-full bg-emerald-500 transition-all duration-500"
                title={`Income: KSh ${formatMoney(overview.totalIncome)}`}
              />
              <div
                style={{ width: `${expensePct}%` }}
                className="rounded-r-full bg-rose-500 transition-all duration-500"
                title={`Expenses: KSh ${formatMoney(overview.totalExpenses)}`}
              />
            </div>
          </div>

          {/* Quick Metrics Comparison */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink-950/8 pt-5">
            <div className="rounded-lg bg-ink-50/60 p-3">
              <p className="text-[11px] font-medium uppercase text-ink-500">Total Billed</p>
              <p className="mt-1 font-display text-base font-semibold text-ink-900">
                KSh {formatMoney(overview.totalInvoiced)}
              </p>
            </div>
            <div className="rounded-lg bg-ink-50/60 p-3">
              <p className="text-[11px] font-medium uppercase text-ink-500">Collected Cash</p>
              <p className="mt-1 font-display text-base font-semibold text-emerald-600">
                KSh {formatMoney(overview.totalIncome)}
              </p>
            </div>
            <div className="rounded-lg bg-ink-50/60 p-3">
              <p className="text-[11px] font-medium uppercase text-ink-500">Net Surplus</p>
              <p className="mt-1 font-display text-base font-semibold text-ink-900">
                KSh {formatMoney(overview.netIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-ink-950">Revenue Breakdown</h2>
          <p className="mt-0.5 text-xs text-ink-500">Income segmented by primary service source</p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-600">Scan & 3D Shoot</span>
                <span className="font-semibold text-ink-950">
                  KSh {formatMoney(overview.scanRevenue)} ({scanPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  style={{ width: `${scanPct}%` }}
                  className="h-full rounded-full bg-brand-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-600">3D Tour Hosting (Recurring)</span>
                <span className="font-semibold text-ink-950">
                  KSh {formatMoney(overview.hostingRevenue)} ({hostingPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  style={{ width: `${hostingPct}%` }}
                  className="h-full rounded-full bg-indigo-600 transition-all"
                />
              </div>
            </div>

            {overview.otherRevenue > 0 && (
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-600">Other Services & Fees</span>
                  <span className="font-semibold text-ink-950">
                    KSh {formatMoney(overview.otherRevenue)} ({otherPct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    style={{ width: `${otherPct}%` }}
                    className="h-full rounded-full bg-amber-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950">
            <div className="flex items-center gap-2 font-medium">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              Hosting Health
            </div>
            <p className="mt-1 text-indigo-700">
              {overview.activeHostingCount} properties currently on recurring quarterly, semi-annual, or annual hosting.
            </p>
          </div>
        </div>
      </div>

      {/* Money to Watch: Overdue, Upcoming, Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Overdue */}
        <div className="rounded-xl border border-red-200/80 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-ink-950/8">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-600" />
              <h3 className="text-sm font-semibold text-ink-950">Overdue</h3>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
              {moneyToWatch.overdue.length}
            </span>
          </div>

          <div className="mt-4 divide-y divide-ink-950/5">
            {moneyToWatch.overdue.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">No overdue items. All accounts up to date.</p>
            ) : (
              moneyToWatch.overdue.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-ink-900">{item.client}</p>
                      <p className="text-[11px] text-ink-500">{item.property}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-red-600">
                        KSh {formatMoney(item.amount)}
                      </p>
                      <span className="inline-block text-[10px] font-semibold text-red-700">
                        {item.daysOverdue}d overdue
                      </span>
                    </div>
                  </div>
                  {item.type === 'hosting' ? (
                    <button
                      onClick={() =>
                        navigate(`/admin/invoice?renewalListingId=${encodeURIComponent(item.id)}`)
                      }
                      className="mt-1.5 text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      Issue Renewal Invoice →
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateTab('invoices')}
                      className="mt-1.5 text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      View Invoice →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="rounded-xl border border-amber-200/80 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-ink-950/8">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-ink-950">Upcoming Payments</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {moneyToWatch.upcoming.length}
            </span>
          </div>

          <div className="mt-4 divide-y divide-ink-950/5">
            {moneyToWatch.upcoming.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">No renewals due in the next 14 days.</p>
            ) : (
              moneyToWatch.upcoming.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-ink-900">{item.client}</p>
                      <p className="text-[11px] text-ink-500">{item.property}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-ink-900">
                        KSh {formatMoney(item.amount)}
                      </p>
                      <span className="inline-block text-[10px] font-medium text-amber-700">
                        Due in {item.daysRemaining}d ({formatDisplayDate(item.dueDate)})
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments Received */}
        <div className="rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-ink-950/8">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-ink-950">Recent Payments</h3>
            </div>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-xs text-brand-600 hover:underline"
            >
              All →
            </button>
          </div>

          <div className="mt-4 divide-y divide-ink-950/5">
            {moneyToWatch.recentPayments.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">No recent payments recorded.</p>
            ) : (
              moneyToWatch.recentPayments.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-ink-900">
                        {p.clientName || 'General Client'}
                      </p>
                      <p className="text-[11px] text-ink-500">
                        {p.propertyName || 'Property Project'} • {p.paymentMethod || p.method || 'M-Pesa'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-600">
                        +KSh {formatMoney(p.amount)}
                      </p>
                      <p className="text-[10px] text-ink-400">{p.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
