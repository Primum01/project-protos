import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatMoney, getInvoicePaidAmount } from '@/lib/financeCalculations'
import type { PaymentRecord, SavedInvoice, SavedReceipt } from '@/types/finance'
import type { Listing } from '@/types/listing'

interface FinanceInvoicesReceiptsProps {
  invoices: SavedInvoice[]
  receipts: SavedReceipt[]
  payments: PaymentRecord[]
  listings: Listing[]
  onDeleteInvoice: (id: string) => Promise<void>
  onDeleteReceipt: (id: string) => Promise<void>
}

export function FinanceInvoicesReceipts({
  invoices,
  receipts,
  payments,
  listings: _listings,
  onDeleteInvoice,
  onDeleteReceipt,
}: FinanceInvoicesReceiptsProps) {
  const navigate = useNavigate()
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'receipts'>('invoices')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    let list = [...invoices].sort(
      (a, b) =>
        new Date(b.createdAt || b.invoiceDate || b.date || 0).getTime() -
        new Date(a.createdAt || a.invoiceDate || a.date || 0).getTime(),
    )

    if (statusFilter !== 'all') {
      list = list.filter((inv) => (inv.status || 'draft').toLowerCase() === statusFilter.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          inv.propertyName.toLowerCase().includes(q) ||
          (inv.accountNumber && inv.accountNumber.toLowerCase().includes(q)),
      )
    }

    return list
  }, [invoices, statusFilter, searchQuery])

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    let list = [...receipts].sort(
      (a, b) =>
        new Date(b.createdAt || b.receiptDate || b.date || 0).getTime() -
        new Date(a.createdAt || a.receiptDate || a.date || 0).getTime(),
    )

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (rec) =>
          rec.receiptNumber.toLowerCase().includes(q) ||
          rec.clientName.toLowerCase().includes(q) ||
          rec.propertyName.toLowerCase().includes(q) ||
          (rec.invoiceNumber && rec.invoiceNumber.toLowerCase().includes(q)),
      )
    }

    return list
  }, [receipts, searchQuery])

  return (
    <div className="space-y-6">
      {/* Top Bar with Subtabs and Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 border-b border-ink-950/10 pb-2 sm:border-none sm:pb-0">
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'invoices'
                ? 'bg-ink-950 text-white shadow-soft'
                : 'bg-paper text-ink-600 border border-ink-950/10 hover:bg-ink-50'
            }`}
          >
            <span>Invoices</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeSubTab === 'invoices' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('receipts')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'receipts'
                ? 'bg-ink-950 text-white shadow-soft'
                : 'bg-paper text-ink-600 border border-ink-950/10 hover:bg-ink-50'
            }`}
          >
            <span>Receipts</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeSubTab === 'receipts' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-600'
              }`}
            >
              {receipts.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'invoices' ? (
            <button
              onClick={() => navigate('/admin/invoice')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-brand-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create New Invoice
            </button>
          ) : (
            <button
              onClick={() => navigate('/admin/receipt')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-brand-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create New Receipt
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={
              activeSubTab === 'invoices'
                ? 'Search by invoice #, client, property, account...'
                : 'Search by receipt #, invoice #, client, property...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {activeSubTab === 'invoices' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-ink-950/15 bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Invoices List */}
      {activeSubTab === 'invoices' && (
        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/5 text-ink-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-ink-400">
                      No invoices found. Click "Create New Invoice" to start billing.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const paid = getInvoicePaidAmount(inv, receipts, payments)
                    const totalDue = Number(inv.totalDue) || 0
                    const balance = Math.max(0, totalDue - paid)
                    const status = inv.status || 'draft'

                    return (
                      <tr key={inv.id} className="transition-colors hover:bg-ink-50/40">
                        <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-brand-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-950">
                          {inv.clientName || '—'}
                          {inv.accountNumber && (
                            <span className="block text-[10px] text-ink-400 font-mono">
                              Acc: {inv.accountNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {inv.propertyName || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                          {inv.invoiceDate || inv.date || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-display font-medium tabular-nums text-ink-950">
                          KSh {formatMoney(totalDue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-display font-medium tabular-nums text-emerald-600">
                          KSh {formatMoney(paid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold tabular-nums text-ink-900">
                          KSh {formatMoney(balance)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/invoice?id=${encodeURIComponent(inv.id)}`)}
                              className="rounded px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100 hover:text-ink-950"
                              title="Edit/View in Engine"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/admin/receipt?invoiceId=${encodeURIComponent(inv.id)}`)
                              }
                              className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                              title="Issue Receipt for this Invoice"
                            >
                              Receipt
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete invoice ${inv.invoiceNumber}?`,
                                  )
                                ) {
                                  await onDeleteInvoice(inv.id)
                                }
                              }}
                              className="rounded px-1.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                              title="Delete"
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
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipts List */}
      {activeSubTab === 'receipts' && (
        <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Invoice Ref</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount Received</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/5 text-ink-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-400">
                      No payment receipts found.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rec) => (
                    <tr key={rec.id} className="transition-colors hover:bg-ink-50/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-emerald-700">
                        {rec.receiptNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-ink-500">
                        {rec.invoiceNumber || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-950">
                        {rec.clientName || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {rec.propertyName || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                        {rec.receiptDate || rec.date || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-700">
                          {rec.paymentMethod || 'M-Pesa'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-sm tabular-nums text-emerald-600">
                        KSh {formatMoney(Number(rec.totalPaid) || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/receipt?id=${encodeURIComponent(rec.id)}`)}
                            className="rounded px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100 hover:text-ink-950"
                            title="View / Edit Receipt"
                          >
                            View
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete receipt ${rec.receiptNumber}?`,
                                )
                              ) {
                                await onDeleteReceipt(rec.id)
                              }
                            }}
                            className="rounded px-1.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            title="Delete"
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
                        </div>
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
