import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/financeCalculations'
import type { ExpenseRecord } from '@/types/finance'
import { RecordExpenseModal } from './RecordExpenseModal'

interface FinanceExpensesProps {
  expenses: ExpenseRecord[]
  onSaveExpense: (expense: ExpenseRecord) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
  currentAdminEmail?: string
}

export function FinanceExpenses({
  expenses,
  onSaveExpense,
  onDeleteExpense,
  currentAdminEmail,
}: FinanceExpensesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>('all')

  // Filtered expenses
  const filtered = useMemo(() => {
    let list = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.reference && e.reference.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)),
      )
    }

    if (dateRange !== 'all') {
      const now = new Date()
      let days = 30
      if (dateRange === '7d') days = 7
      else if (dateRange === '30d') days = 30
      else if (dateRange === '3m') days = 90
      else if (dateRange === '6m') days = 180
      else if (dateRange === '12m') days = 365

      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      list = list.filter((e) => {
        const d = new Date(e.date)
        return !isNaN(d.getTime()) && d >= cutoff
      })
    }

    return list
  }, [expenses, categoryFilter, searchQuery, dateRange])

  // Aggregate category stats
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>()
    let total = 0
    let highestCategory = 'None'
    let highestAmt = 0

    for (const e of expenses) {
      const amt = Number(e.amount) || 0
      total += amt
      const current = (map.get(e.category) || 0) + amt
      map.set(e.category, current)
      if (current > highestAmt) {
        highestAmt = current
        highestCategory = e.category
      }
    }

    return { total, highestCategory, highestAmt, breakdown: Array.from(map.entries()) }
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Header and Record Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Business Expenses</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Track operational spending, equipment, transport, hosting fees, and contractor charges.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-rose-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Expense
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Total Recorded Outflow</p>
          <p className="mt-1 font-display text-2xl font-semibold text-rose-600">
            KSh {formatMoney(categoryStats.total)}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">{expenses.length} expense items</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Largest Category</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950 truncate">
            {categoryStats.highestCategory}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            KSh {formatMoney(categoryStats.highestAmt)}
          </p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Filtered Outflow</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
            KSh {formatMoney(filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">{filtered.length} matching entries</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Active Categories</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
            {categoryStats.breakdown.length}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Configured expense buckets</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search description, reference, category, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-ink-950/15 bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="transport">Transport</option>
            <option value="equipment">Equipment</option>
            <option value="software">Software & Services</option>
            <option value="marketing">Marketing</option>
            <option value="contractor">Contractor</option>
            <option value="hosting/infrastructure">Hosting & Infrastructure</option>
            <option value="office">Office</option>
            <option value="communication">Communication</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-lg border border-ink-950/15 bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Receipt / File</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-right">Amount (KSh)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/5 text-ink-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-400">
                    No expense records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                      {e.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-950 max-w-xs truncate" title={e.description}>
                      {e.description}
                      {e.notes && (
                        <span className="block text-[10px] text-ink-400 font-normal">
                          {e.notes}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {e.paymentMethod || 'M-Pesa'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-ink-600">
                      {e.reference || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {e.attachmentUrl ? (
                        <a
                          href={e.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-ink-300 italic">None</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-ink-400">
                      {e.recordedBy || 'Admin'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-sm tabular-nums text-rose-600">
                      -KSh {formatMoney(e.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete expense "${e.description}"?`,
                            )
                          ) {
                            await onDeleteExpense(e.id)
                          }
                        }}
                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                        title="Delete expense"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveExpense={onSaveExpense}
        currentAdminEmail={currentAdminEmail}
      />
    </div>
  )
}
