import { useMemo, useState } from 'react'
import {
  exportTransactionsToCSV,
  formatMoney,
  getDerivedTransactions,
} from '@/lib/financeCalculations'
import type {
  ExpenseRecord,
  PaymentRecord,
  SavedInvoice,
  SavedReceipt,
} from '@/types/finance'
import type { Listing } from '@/types/listing'
import { AdminDropdown } from '@/components/admin/AdminDropdown'

interface FinanceTransactionsProps {
  invoices: SavedInvoice[]
  receipts: SavedReceipt[]
  expenses: ExpenseRecord[]
  payments: PaymentRecord[]
  listings: Listing[]
}

export function FinanceTransactions({
  invoices,
  receipts,
  expenses,
  payments,
  listings,
}: FinanceTransactionsProps) {
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [incomeTypeFilter, setIncomeTypeFilter] = useState<'all' | 'scan' | 'hosting' | 'other'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>('all')

  // Derived unified ledger
  const allTransactions = useMemo(() => {
    return getDerivedTransactions(invoices, receipts, expenses, payments, listings)
  }, [invoices, receipts, expenses, payments, listings])

  // Extract unique properties for filter dropdown
  const propertiesList = useMemo(() => {
    const set = new Set<string>()
    listings.forEach((l) => {
      if (l.name) set.add(l.name)
    })
    allTransactions.forEach((t) => {
      if (t.propertyName) set.add(t.propertyName)
    })
    return Array.from(set).sort()
  }, [listings, allTransactions])

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...allTransactions]

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }

    // Income type filter
    if (incomeTypeFilter !== 'all') {
      result = result.filter((t) => {
        if (t.type !== 'income') return false
        return t.category === incomeTypeFilter
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Property filter
    if (selectedProperty !== 'all') {
      result = result.filter(
        (t) => (t.propertyName || '').toLowerCase() === selectedProperty.toLowerCase(),
      )
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((t) => {
        return (
          t.clientName.toLowerCase().includes(q) ||
          t.propertyName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.reference && t.reference.toLowerCase().includes(q))
        )
      })
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      let days = 30
      if (dateRange === '7d') days = 7
      else if (dateRange === '30d') days = 30
      else if (dateRange === '3m') days = 90
      else if (dateRange === '6m') days = 180
      else if (dateRange === '12m') days = 365

      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      result = result.filter((t) => {
        const d = new Date(t.date)
        return !isNaN(d.getTime()) && d >= cutoff
      })
    }

    return result
  }, [allTransactions, typeFilter, incomeTypeFilter, statusFilter, selectedProperty, searchQuery, dateRange])

  // Calculate summary for currently filtered records
  const filteredSummary = useMemo(() => {
    let income = 0
    let expensesTotal = 0
    for (const t of filtered) {
      if (t.type === 'income') {
        if (t.status === 'paid' || t.status === 'partial') {
          income += t.amount
        }
      } else if (t.type === 'expense') {
        expensesTotal += t.amount
      }
    }
    return { income, expenses: expensesTotal, net: income - expensesTotal }
  }, [filtered])

  return (
    <div className="space-y-6">
      {/* Header and Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Financial Transactions</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Authoritative, unified financial ledger derived from verified invoices, receipts, expenses, and payments.
          </p>
        </div>

        <button
          onClick={() => exportTransactionsToCSV(filtered, 'twinspace-ledger')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-950/12 bg-paper px-3.5 py-2 text-xs font-semibold text-ink-800 shadow-soft transition-all hover:bg-ink-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-ink-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search client, property, note, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1">Type</label>
            <AdminDropdown<'all' | 'income' | 'expense'>
              id="finance-tx-type-filter"
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              buttonClassName="py-1.5 px-3 text-xs w-full"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'income', label: 'Income Only' },
                { value: 'expense', label: 'Expense Only' },
              ]}
            />
          </div>

          {/* Income Service Type */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1">Service</label>
            <AdminDropdown<'all' | 'scan' | 'hosting' | 'other'>
              id="finance-tx-service-filter"
              value={incomeTypeFilter}
              onChange={(val) => setIncomeTypeFilter(val)}
              disabled={typeFilter === 'expense'}
              buttonClassName="py-1.5 px-3 text-xs w-full"
              options={[
                { value: 'all', label: 'All Services' },
                { value: 'scan', label: 'Scan / Shoot' },
                { value: 'hosting', label: 'Hosting' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1">Status</label>
            <AdminDropdown<string>
              id="finance-tx-status-filter"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              buttonClassName="py-1.5 px-3 text-xs w-full"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'paid', label: 'Paid' },
                { value: 'partial', label: 'Partial' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-medium text-ink-500 mb-1">Date Range</label>
            <AdminDropdown<'7d' | '30d' | '3m' | '6m' | '12m' | 'all'>
              id="finance-tx-date-filter"
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              buttonClassName="py-1.5 px-3 text-xs w-full"
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '3m', label: 'Last 3 Months' },
                { value: '6m', label: 'Last 6 Months' },
                { value: '12m', label: 'Last 12 Months' },
              ]}
            />
          </div>
        </div>

        {/* Secondary row for property filter */}
        <div className="mt-3 flex flex-wrap items-center justify-between border-t border-ink-950/5 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-ink-500 shrink-0">Property:</span>
            <AdminDropdown<string>
              id="finance-tx-property-filter"
              value={selectedProperty}
              onChange={(val) => setSelectedProperty(val)}
              searchable
              searchPlaceholder="Search property..."
              buttonClassName="py-1 px-3 text-xs min-w-[200px]"
              options={[
                { value: 'all', label: `All Properties (${propertiesList.length})` },
                ...propertiesList.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>

          <div className="flex items-center gap-4 text-ink-600">
            <span>
              Showing <strong>{filtered.length}</strong> records
            </span>
            <span className="text-emerald-700">
              Income: <strong>KSh {formatMoney(filteredSummary.income)}</strong>
            </span>
            <span className="text-rose-700">
              Expenses: <strong>KSh {formatMoney(filteredSummary.expenses)}</strong>
            </span>
            <span className="font-semibold text-ink-900">
              Net: KSh {formatMoney(filteredSummary.net)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/5 text-ink-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncome = tx.type === 'income'
                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-ink-50/40">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                        {tx.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-950">
                        {tx.clientName || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {tx.propertyName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                          {tx.category ? ` • ${tx.category}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-600 max-w-xs truncate" title={tx.description}>
                        {tx.description}
                        {tx.reference && (
                          <span className="ml-1 text-[10px] text-ink-400 font-mono">
                            ({tx.reference})
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            tx.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.status === 'overdue'
                              ? 'bg-red-100 text-red-800 font-semibold'
                              : tx.status === 'pending'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-ink-100 text-ink-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-sm tabular-nums ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}KSh {formatMoney(tx.amount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
