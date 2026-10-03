import { useState } from 'react'
import { generateUUID } from '@/lib/uuid'
import type { PaymentCategory, PaymentMethod, PaymentRecord, SavedInvoice } from '@/types/finance'
import type { Listing } from '@/types/listing'
import { AdminDropdown } from '@/components/admin/AdminDropdown'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSavePayment: (payment: PaymentRecord) => Promise<void>
  invoices: SavedInvoice[]
  listings: Listing[]
  currentAdminEmail?: string
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSavePayment,
  invoices,
  listings,
  currentAdminEmail,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa')
  const [reference, setReference] = useState<string>('')
  const [category, setCategory] = useState<PaymentCategory>('scan')
  const [selectedListingId, setSelectedListingId] = useState<string>('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')
  const [clientName, setClientName] = useState<string>('')
  const [propertyName, setPropertyName] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  // Handle property selection
  const handlePropertyChange = (listingId: string) => {
    setSelectedListingId(listingId)
    if (listingId === 'custom' || !listingId) {
      return
    }
    const listing = listings.find((l) => l.id === listingId)
    if (listing) {
      setPropertyName(listing.name || '')
      setClientName(listing.contactName || '')
    }
  }

  // Handle invoice linkage
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId)
    if (!invId) return
    const inv = invoices.find((i) => i.id === invId)
    if (inv) {
      if (!clientName) setClientName(inv.clientName || '')
      if (!propertyName) setPropertyName(inv.propertyName || '')
      if (!amount && inv.totalDue) setAmount(String(inv.totalDue))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive payment amount.')
      return
    }
    if (!date) {
      setError('Please select a payment date.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)

      const record: PaymentRecord = {
        id: generateUUID(),
        amount: numericAmount,
        date,
        method,
        paymentMethod: method,
        reference: reference.trim() || undefined,
        category,
        clientName: clientName.trim() || 'General Client',
        propertyName: propertyName.trim() || 'General Property',
        listingId: selectedListingId || undefined,
        invoiceId: selectedInvoiceId || undefined,
        invoiceNumber: selectedInvoice?.invoiceNumber || undefined,
        notes: notes.trim() || undefined,
        recordedBy: currentAdminEmail || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onSavePayment(record)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-ink-950/15 bg-paper p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-ink-950/10">
          <div>
            <h3 className="text-base font-semibold text-ink-950">Record Client Payment</h3>
            <p className="text-xs text-ink-500">Record cash actually received by TwinSpace</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Amount Received (KSh) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 35000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-sm font-semibold text-ink-950 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Payment Method *
              </label>
              <AdminDropdown<PaymentMethod>
                id="modal-payment-method"
                value={method}
                onChange={(val) => setMethod(val)}
                buttonClassName="w-full py-2 px-3 text-xs justify-between"
                options={[
                  { value: 'M-Pesa', label: 'M-Pesa' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Card', label: 'Card' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Reference / Transaction Code
              </label>
              <input
                type="text"
                placeholder="e.g. QKH712..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Payment Category
              </label>
              <AdminDropdown<PaymentCategory>
                id="modal-payment-category"
                value={category}
                onChange={(val) => setCategory(val)}
                buttonClassName="w-full py-2 px-3 text-xs justify-between"
                options={[
                  { value: 'scan', label: 'One-time Shoot / Scan' },
                  { value: 'hosting', label: '3D Tour Hosting' },
                  { value: 'other', label: 'Other Service' },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Link to Invoice (Optional)
              </label>
              <AdminDropdown<string>
                id="modal-payment-invoice"
                value={selectedInvoiceId}
                onChange={(val) => handleInvoiceChange(val)}
                searchable
                searchPlaceholder="Search invoices..."
                buttonClassName="w-full py-2 px-3 text-xs justify-between"
                options={[
                  { value: '', label: 'No invoice linked' },
                  ...invoices.map((inv) => ({
                    value: inv.id,
                    label: `${inv.invoiceNumber} — ${inv.propertyName || inv.clientName} (KSh ${inv.totalDue})`,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Property / Project
              </label>
              <AdminDropdown<string>
                id="modal-payment-listing"
                value={selectedListingId}
                onChange={(val) => handlePropertyChange(val)}
                searchable
                searchPlaceholder="Search properties..."
                buttonClassName="w-full py-2 px-3 text-xs justify-between"
                options={[
                  { value: '', label: 'Select Property...' },
                  ...listings.map((l) => ({
                    value: l.id,
                    label: l.name,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-600 mb-1">
                Property Name (Free text)
              </label>
              <input
                type="text"
                placeholder="Property name"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Client Name
            </label>
            <input
              type="text"
              placeholder="e.g. ABC Properties Ltd"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-600 mb-1">
              Notes / Audit Memo
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Paid in full via M-Pesa paybill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-ink-950/20 bg-white px-3 py-2 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-950/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Recording...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
