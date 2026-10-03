import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/financeCalculations'
import type { ExpenseRecord } from '@/types/finance'
import { RecordExpenseModal } from './RecordExpenseModal'
import { AdminDropdown } from '@/components/admin/AdminDropdown'

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

      {/* Filters Toolbar - Pill Filter Bar matching Tours.tsx */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Pill */}
          <div className="flex w-full sm:w-auto sm:flex-1 sm:max-w-md items-center gap-2 rounded-full border border-ink-950/10 bg-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm shadow-sm transition-shadow focus-within:shadow-md focus-within:border-ink-950/20">
            <span className="text-ink-400 shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search description, reference, category, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs sm:text-sm text-ink-800 placeholder-ink-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-ink-400 hover:text-ink-700 transition-colors shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Pill */}
          <AdminDropdown<string>
            id="finance-expenses-category-filter"
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            }
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'transport', label: 'Transport' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'software', label: 'Software & Services' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'hosting/infrastructure', label: 'Hosting & Infrastructure' },
              { value: 'office', label: 'Office' },
              { value: 'communication', label: 'Communication' },
              { value: 'miscellaneous', label: 'Miscellaneous' },
            ]}
          />

          {/* Date Range Pill */}
          <AdminDropdown<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>
            id="finance-expenses-date-filter"
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            options={[
              { value: 'all', label: 'All Time' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '12m', label: 'Last 12 Months' },
            ]}
          />

          {/* Reset Filters Chip */}
          {(categoryFilter !== 'all' || dateRange !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all')
                setDateRange('all')
                setSearchQuery('')
              }}
              className="flex items-center gap-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/60 px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              Reset Filters
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Counter row */}
        <div className="flex items-center justify-between text-xs text-ink-500 pt-1">
          <span>
            Showing <strong className="text-ink-950 font-semibold">{filtered.length}</strong> expense items
          </span>
          <span className="text-rose-700 font-semibold">
            Filtered Total: KSh {formatMoney(filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
          </span>
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
