import { useMemo, useState } from 'react'
import { useAdminListings } from '@/contexts/AdminDataContext'
import { Button } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'

interface ReceiptItem {
  id: string
  description: string
  qty: number
  rate: number
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-KE')
}

export function AdminReceipt() {
  const { listings } = useAdminListings()

  usePageMeta({
    title: 'Generate Receipt — TwinSpace Admin',
    description: 'Create and export professional client payment receipts.',
    path: '/admin/receipt',
    noIndex: true,
  })

  // Selected property for auto-fill
  const [selectedListingId, setSelectedListingId] = useState<string>('custom')

  // Receipt Metadata
  const [receiptNumber, setReceiptNumber] = useState('REC-0001')
  const [receiptDate, setReceiptDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  })
  const [fullPaymentDate, setFullPaymentDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  })

  // Client & Property Info
  const [clientName, setClientName] = useState('Jane Mwangi')
  const [clientContact, setClientContact] = useState('+254 712 345 678 · client@example.com')
  const [accountNumber, setAccountNumber] = useState('ACC-00124')
  const [propertyName, setPropertyName] = useState('Maisha Makao - 3 Bedroom Villa')
  const [propertyLocation, setPropertyLocation] = useState('Riverside Drive, Nairobi')

  // Line Items
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 25000 },
    { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 3500 },
  ])

  // Adjustments
  const [discount, setDiscount] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa')
  const [transactionRef, setTransactionRef] = useState('M-Pesa Ref: QK9182XX9')
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for choosing TwinSpace.')
  const [tagline, setTagline] = useState('Immersive spaces. Extraordinary experiences.')

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  }, [items])

  const totalPaid = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0))
  }, [subtotal, discount, tax])

  function handleListingSelect(id: string) {
    setSelectedListingId(id)
    if (id === 'custom') return

    const l = listings.find((item) => item.id === id)
    if (l) {
      setPropertyName(l.name)
      setPropertyLocation([l.location, l.city, l.country].filter(Boolean).join(', '))
      if (l.contactName) setClientName(l.contactName)
      const contactParts = [l.contactPhone, l.contactEmail].filter(Boolean)
      if (contactParts.length > 0) setClientContact(contactParts.join(' · '))
      if (l.accountNumber) setAccountNumber(l.accountNumber)
    }
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: 'Additional 3D Tour Service', qty: 1, rate: 2500 },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateItem(id: string, field: keyof ReceiptItem, value: any) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        return item
      }),
    )
  }

  function handleExportPDF() {
    const origTitle = document.title
    document.title = `${receiptNumber} — ${clientName || 'Receipt'} — TwinSpace`
    window.print()
    setTimeout(() => {
      document.title = origTitle
    }, 1000)
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      {/* ── Screen Action Header (Omitted in PDF export) ── */}
      <div className="no-print mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Finance
              </span>
              <span className="text-xs text-ink-400">· Payment Receipt Generator</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold text-ink-950">
              Receipt
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500 leading-relaxed">
              Create, customize, and export client payment receipts with verified payment records.
            </p>
          </div>

          <Button onClick={handleExportPDF} className="shrink-0 gap-2 shadow-soft">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </Button>
        </div>

        {/* Quick Autofill Selector */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-950/8 bg-paper p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <label htmlFor="receipt-property-select" className="text-xs font-medium text-ink-600">
              Autofill from Property:
            </label>
            <select
              id="receipt-property-select"
              value={selectedListingId}
              onChange={(e) => handleListingSelect(e.target.value)}
              className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
            >
              <option value="custom">Custom (Type manually)</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.city ? `(${l.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={addItem}>
              + Add Item Line
            </Button>
          </div>
        </div>
      </div>

      {/* ── THE RECEIPT CONTAINER (Signature Accent Design) ── */}
      <div className="rounded-2xl border border-ink-950/10 bg-sand-100/60 p-8 sm:p-12 shadow-soft text-ink-950">
        {/* ── TOP SECTION: LOGO + RECEIPT META ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-ink-950/12">
          {/* Logo & Company Name */}
          <div>
            <img
              src="/twinspace-analytics-logo.png"
              alt="TwinSpace 360"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <input
              type="text"
              value="TwinSpace 360 Limited"
              readOnly
              className="mt-2 text-xs font-medium text-ink-500 bg-transparent border-none p-0 focus:outline-none"
            />
          </div>

          {/* Receipt Label, Number & Date */}
          <div className="sm:text-right flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-950 font-display">
                RECEIPT
              </h2>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/30">
                PAID
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 sm:justify-end">
              <span className="text-xs font-medium text-ink-400">Receipt No:</span>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-28 sm:text-right font-mono text-sm font-semibold text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none px-1"
              />
            </div>
            <div className="mt-0.5">
              <input
                type="text"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-32 sm:text-right text-xs font-medium text-ink-500 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none px-1"
              />
            </div>
          </div>
        </div>

        {/* ── MIDDLE SECTION: PAYMENT DATE + RECEIVED FROM + PROPERTY ── */}
        <div className="py-8 border-b border-ink-950/12 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left Column: Dates */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
              PAYMENT DATE
            </p>
            <input
              type="text"
              value={fullPaymentDate}
              onChange={(e) => setFullPaymentDate(e.target.value)}
              className="w-full text-sm font-medium text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5"
            />
            <p className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
              <span>✓</span> Payment verified &amp; cleared
            </p>
          </div>

          {/* Right Column: Received From & Property */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                RECEIVED FROM
              </p>
              <input
                type="text"
                placeholder="Client Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-sm font-semibold text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5"
              />
              <input
                type="text"
                placeholder="Client Phone / Email"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="mt-1 w-full text-xs text-ink-600 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5"
              />
              {accountNumber && (
                <p className="mt-1 text-[11px] font-mono text-ink-400">
                  Account No: {accountNumber}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                PROPERTY
              </p>
              <input
                type="text"
                placeholder="Property Name"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full text-sm font-medium text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5"
              />
              <input
                type="text"
                placeholder="Property Location"
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
                className="mt-1 w-full text-xs text-ink-500 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5"
              />
            </div>
          </div>
        </div>

        {/* ── SERVICES / ITEMS PAID TABLE ── */}
        <div className="py-8 border-b border-ink-950/12">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-4">
            SERVICES PAID
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-950/15 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th className="pb-3 w-1/2">DESCRIPTION</th>
                  <th className="pb-3 text-center w-16">QTY</th>
                  <th className="pb-3 text-right w-28">RATE</th>
                  <th className="pb-3 text-right w-32">AMOUNT</th>
                  <th className="pb-3 w-10 no-print" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/8 text-sm">
                {items.map((item) => {
                  const lineAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0)

                  return (
                    <tr key={item.id} className="group">
                      {/* Description */}
                      <td className="py-3.5 pr-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full text-sm font-medium text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-3.5 px-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="w-12 text-center font-mono text-sm text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
                        />
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-ink-400">KSh</span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-mono text-sm text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 pl-4 text-right font-mono font-medium text-ink-950">
                        KSh {formatMoney(lineAmount)}
                      </td>

                      {/* Delete action */}
                      <td className="py-3.5 pl-2 text-right no-print">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-red-600 transition-opacity text-xs"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FINANCIAL TOTALS SECTION ── */}
        <div className="py-8 border-b border-ink-950/12 flex justify-end">
          <div className="w-full sm:w-80 space-y-2.5 text-sm">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                SUBTOTAL
              </span>
              <span className="font-mono font-medium text-ink-900">
                KSh {formatMoney(subtotal)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Discount:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-xs text-ink-400">- KSh</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tax / VAT */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Tax / VAT:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-xs text-ink-400">+ KSh</span>
                <input
                  type="number"
                  min={0}
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-20 text-right text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Total Paid */}
            <div className="pt-3 border-t border-ink-950/15 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-wider text-emerald-800">
                TOTAL PAID
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold text-emerald-900">
                KSh {formatMoney(totalPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* ── PAYMENT VERIFICATION & CLOSING ── */}
        <div className="pt-8 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-1">
              PAYMENT INFORMATION
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="font-semibold text-sm text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none"
              />
              <span className="text-xs text-ink-300">·</span>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="text-xs font-mono text-ink-600 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none flex-1 min-w-[200px]"
              />
            </div>
          </div>

          <div className="pt-3 text-xs text-ink-500 space-y-1">
            <input
              type="text"
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              className="w-full font-medium text-ink-700 bg-transparent border-none p-0 focus:outline-none"
            />
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full text-ink-400 bg-transparent border-none p-0 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
