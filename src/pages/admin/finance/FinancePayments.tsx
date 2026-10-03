import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/financeCalculations'
import type { PaymentRecord, SavedInvoice } from '@/types/finance'
import type { Listing } from '@/types/listing'
import { RecordPaymentModal } from './RecordPaymentModal'
import { AdminDropdown } from '@/components/admin/AdminDropdown'

interface FinancePaymentsProps {
  payments: PaymentRecord[]
  invoices: SavedInvoice[]
  listings: Listing[]
  onSavePayment: (payment: PaymentRecord) => Promise<void>
  onDeletePayment: (id: string) => Promise<void>
  currentAdminEmail?: string
}

export function FinancePayments({
  payments,
  invoices,
  listings,
  onSavePayment,
  onDeletePayment,
  currentAdminEmail,
}: FinancePaymentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let list = [...payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    if (methodFilter !== 'all') {
      list = list.filter(
        (p) => (p.paymentMethod || p.method || '').toLowerCase() === methodFilter.toLowerCase(),
      )
    }

    if (categoryFilter !== 'all') {
      list = list.filter((p) => (p.category || 'scan').toLowerCase() === categoryFilter.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          (p.clientName && p.clientName.toLowerCase().includes(q)) ||
          (p.propertyName && p.propertyName.toLowerCase().includes(q)) ||
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)),
      )
    }

    return list
  }, [payments, methodFilter, categoryFilter, searchQuery])

  // Method totals
  const stats = useMemo(() => {
    let total = 0
    let mpesa = 0
    let bank = 0
    let other = 0

    for (const p of payments) {
      const amt = Number(p.amount) || 0
      const m = p.paymentMethod || p.method || 'M-Pesa'
      total += amt
      if (m === 'M-Pesa') mpesa += amt
      else if (m === 'Bank Transfer') bank += amt
      else other += amt
    }

    return { total, mpesa, bank, other }
  }, [payments])

  return (
    <div className="space-y-6">
      {/* Header and Record Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Payments Received</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Dedicated payment ledger tracking cash received into TwinSpace accounts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:bg-emerald-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Payment
        </button>
      </div>

      {/* Payment Stats Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Total Collected</p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald-600">
            KSh {formatMoney(stats.total)}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">{payments.length} verified records</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">M-Pesa Payments</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
            KSh {formatMoney(stats.mpesa)}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Mobile money settlements</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Bank Transfers</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
            KSh {formatMoney(stats.bank)}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Direct wire / EFT / RTGS</p>
        </div>

        <div className="rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <p className="text-[11px] font-medium uppercase text-ink-500">Cash / Card / Other</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-950">
            KSh {formatMoney(stats.other)}
          </p>
          <p className="mt-0.5 text-xs text-ink-400">Alternative channels</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by client, property, reference code, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <AdminDropdown<string>
            id="finance-payments-method-filter"
            value={methodFilter}
            onChange={(val) => setMethodFilter(val)}
            buttonClassName="py-1.5 px-3 text-xs min-w-[130px]"
            options={[
              { value: 'all', label: 'All Methods' },
              { value: 'm-pesa', label: 'M-Pesa' },
              { value: 'bank transfer', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <AdminDropdown<string>
            id="finance-payments-category-filter"
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            buttonClassName="py-1.5 px-3 text-xs min-w-[130px]"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'scan', label: 'Scan / Shoot' },
              { value: 'hosting', label: 'Hosting' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-950/8 bg-ink-50/70 font-semibold text-ink-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-right">Amount (KSh)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/5 text-ink-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-ink-400">
                    No payment records match criteria. Click "Record Payment" to log cash received.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-500 font-mono text-[11px]">
                      {p.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-ink-900">
                      {p.reference || '—'}
                      {p.invoiceNumber && (
                        <span className="block text-[10px] text-brand-600">
                          Inv: {p.invoiceNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-950">
                      {p.clientName || 'General Client'}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {p.propertyName || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-700">
                        {p.paymentMethod || p.method || 'M-Pesa'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 capitalize">
                        {p.category || 'scan'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500 max-w-xs truncate" title={p.notes}>
                      {p.notes || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-ink-400">
                      {p.recordedBy || 'Admin'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold text-sm tabular-nums text-emerald-600">
                      +KSh {formatMoney(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete payment record ${p.reference || p.id}?`,
                            )
                          ) {
                            await onDeletePayment(p.id)
                          }
                        }}
                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                        title="Delete record"
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

      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSavePayment={onSavePayment}
        invoices={invoices}
        listings={listings}
        currentAdminEmail={currentAdminEmail}
      />
    </div>
  )
}
