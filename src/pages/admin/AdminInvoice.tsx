import { useEffect, useMemo, useRef, useState } from 'react'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
import { Button } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'
import { generateNextInvoiceNumber } from '@/lib/firebase/finance'
import { formatExportFilename } from '@/lib/exportFilename'
import { SheetDiaspaceWatermark } from '@/components/common/SheetDiaspaceWatermark'
import { generateUUID } from '@/lib/uuid'
import type { FinanceItem, SavedInvoice } from '@/types/finance'

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-KE')
}

export function AdminInvoice() {
  const { listings } = useAdminListings()
  const { invoices, saveInvoice, deleteInvoice } = useAdminFinance()

  usePageMeta({
    title: 'Generate Invoice — TwinSpace Admin',
    description: 'Create, archive, and export professional client invoices.',
    path: '/admin/invoice',
    noIndex: true,
  })

  // Tab: 'editor' | 'archive'
  const [activeTab, setActiveTab] = useState<'editor' | 'archive'>('editor')

  // Invoice ID & state
  const [currentId, setCurrentId] = useState<string>(() => generateUUID())
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Property Selection & Search Filter
  const [selectedListingId, setSelectedListingId] = useState<string>('custom')
  const [propertySearchQuery, setPropertySearchQuery] = useState('')
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false)
  const propertySearchRef = useRef<HTMLDivElement>(null)

  // Archive Search Filter (by contact name / contact number)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  })
  const [fullInvoiceDate, setFullInvoiceDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  })

  // Client & Property Info
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [propertyLocation, setPropertyLocation] = useState('')

  // Line Items
  const [items, setItems] = useState<FinanceItem[]>([
    { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 25000 },
    { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 3500 },
  ])

  // Adjustments
  const [discount, setDiscount] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa')
  const [paymentDetails, setPaymentDetails] = useState('Paybill: 247247  |  Account: INV-0001')
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for choosing TwinSpace.')
  const [tagline, setTagline] = useState('Immersive spaces. Extraordinary experiences.')

  // Snapshot for cancelling edits
  const originalSnapshotRef = useRef<SavedInvoice | null>(null)

  // Auto-generate invoice number if not initialized
  useEffect(() => {
    if (!invoiceNumber) {
      const next = generateNextInvoiceNumber(invoices)
      setInvoiceNumber(next)
      setPaymentDetails(`Paybill: 247247  |  Account: ${next}`)
    }
  }, [invoices, invoiceNumber])

  // Close property dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (propertySearchRef.current && !propertySearchRef.current.contains(event.target as Node)) {
        setIsPropertyDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  }, [items])

  const totalDue = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0))
  }, [subtotal, discount, tax])

  // Filter listings by property name, contact name, or contact phone/email
  const filteredListings = useMemo(() => {
    if (!propertySearchQuery.trim()) return listings
    const q = propertySearchQuery.toLowerCase()
    return listings.filter((l) => {
      const name = (l.name || '').toLowerCase()
      const contact = (l.contactName || '').toLowerCase()
      const phone = (l.contactPhone || '').toLowerCase()
      const email = (l.contactEmail || '').toLowerCase()
      const loc = (l.location || '').toLowerCase()
      const acc = (l.accountNumber || '').toLowerCase()
      return (
        name.includes(q) ||
        contact.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        loc.includes(q) ||
        acc.includes(q)
      )
    })
  }, [listings, propertySearchQuery])

  // Filter saved archive invoices by contact name or contact number (phone/email)
  const filteredInvoices = useMemo(() => {
    if (!archiveSearchQuery.trim()) return invoices
    const q = archiveSearchQuery.toLowerCase()
    return invoices.filter((inv) => {
      const name = (inv.clientName || '').toLowerCase()
      const contact = (inv.clientContact || '').toLowerCase()
      const num = (inv.invoiceNumber || '').toLowerCase()
      const prop = (inv.propertyName || '').toLowerCase()
      const acc = (inv.accountNumber || '').toLowerCase()
      return (
        name.includes(q) ||
        contact.includes(q) ||
        num.includes(q) ||
        prop.includes(q) ||
        acc.includes(q)
      )
    })
  }, [invoices, archiveSearchQuery])

  function handleListingSelect(id: string) {
    setSelectedListingId(id)
    setIsPropertyDropdownOpen(false)
    if (id === 'custom') {
      setPropertySearchQuery('')
      return
    }

    const l = listings.find((item) => item.id === id)
    if (l) {
      setPropertySearchQuery(l.name)
      setPropertyName(l.name)
      setPropertyLocation([l.location, l.city, l.country].filter(Boolean).join(', '))
      if (l.contactName) setClientName(l.contactName)
      const contactParts = [l.contactPhone, l.contactEmail].filter(Boolean)
      if (contactParts.length > 0) setClientContact(contactParts.join(' · '))
      if (l.accountNumber) setAccountNumber(l.accountNumber)
    }
  }

  function handleClearProperty() {
    setSelectedListingId('custom')
    setPropertySearchQuery('')
    setPropertyName('')
    setPropertyLocation('')
    setClientName('')
    setClientContact('')
    setAccountNumber('')
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: generateUUID(), description: 'Additional 3D Tour Service', qty: 1, rate: 2500 },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateItem(id: string, field: keyof FinanceItem, value: any) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        return item
      }),
    )
  }

  function startNewInvoice() {
    const nextNum = generateNextInvoiceNumber(invoices)
    setCurrentId(generateUUID())
    setInvoiceNumber(nextNum)
    setInvoiceDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase())
    setFullInvoiceDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    setClientName('')
    setClientContact('')
    setAccountNumber('')
    setPropertyName('')
    setPropertyLocation('')
    setSelectedListingId('custom')
    setPropertySearchQuery('')
    setPaymentDetails(`Paybill: 247247  |  Account: ${nextNum}`)
    setItems([
      { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 25000 },
      { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 3500 },
    ])
    setDiscount(0)
    setTax(0)
    setIsSaved(false)
    setIsEditing(true)
    setSaveStatus(null)
    originalSnapshotRef.current = null
    setActiveTab('editor')
  }

  function loadArchivedInvoice(inv: SavedInvoice, autoPrint = false) {
    setCurrentId(inv.id)
    setInvoiceNumber(inv.invoiceNumber)
    setInvoiceDate(inv.invoiceDate)
    setFullInvoiceDate(inv.fullInvoiceDate)
    setClientName(inv.clientName)
    setClientContact(inv.clientContact)
    setAccountNumber(inv.accountNumber || '')
    setPropertyName(inv.propertyName)
    setPropertyLocation(inv.propertyLocation)
    setSelectedListingId(inv.listingId || 'custom')
    setPropertySearchQuery(inv.propertyName || '')
    setItems(inv.items)
    setDiscount(inv.discount)
    setTax(inv.tax)
    setPaymentMethod(inv.paymentMethod)
    setPaymentDetails(inv.paymentDetails)
    setThankYouMessage(inv.thankYouMessage)
    setTagline(inv.tagline)
    setIsSaved(true)
    setIsEditing(false)
    setSaveStatus(null)
    originalSnapshotRef.current = inv
    setActiveTab('editor')

    if (autoPrint) {
      setTimeout(() => {
        handleExportPDF()
      }, 300)
    }
  }

  async function handleSave() {
    try {
      setSaveStatus(null)
      const numTrimmed = invoiceNumber.trim()
      if (!numTrimmed) {
        setSaveStatus({ type: 'error', message: 'Invoice number is required.' })
        return
      }

      // Check if invoice number is already taken by another invoice
      const conflict = invoices.find(
        (inv) => inv.id !== currentId && inv.invoiceNumber.trim().toUpperCase() === numTrimmed.toUpperCase(),
      )
      if (conflict) {
        setSaveStatus({
          type: 'error',
          message: `Invoice number "${numTrimmed}" is already registered to another saved invoice and cannot be replicated.`,
        })
        return
      }

      const invoiceToSave: SavedInvoice = {
        id: currentId,
        invoiceNumber: numTrimmed,
        invoiceDate,
        fullInvoiceDate,
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
        accountNumber: accountNumber.trim(),
        propertyName: propertyName.trim(),
        propertyLocation: propertyLocation.trim(),
        listingId: selectedListingId,
        items,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        subtotal,
        totalDue,
        paymentMethod,
        paymentDetails,
        thankYouMessage,
        tagline,
        createdAt: originalSnapshotRef.current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveInvoice(invoiceToSave)
      originalSnapshotRef.current = invoiceToSave
      setIsSaved(true)
      setIsEditing(false)
      setSaveStatus({
        type: 'success',
        message: `Invoice ${numTrimmed} saved successfully. Number registered uniquely in archive.`,
      })
      setTimeout(() => setSaveStatus(null), 5000)
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save invoice.' })
    }
  }

  function handleCancelEdit() {
    if (originalSnapshotRef.current) {
      loadArchivedInvoice(originalSnapshotRef.current)
    } else {
      setIsEditing(false)
    }
  }

  async function handleDeleteArchived(id: string, num: string) {
    if (!window.confirm(`Are you sure you want to delete invoice ${num}? This cannot be undone.`)) {
      return
    }
    try {
      await deleteInvoice(id)
      if (currentId === id) {
        startNewInvoice()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice.')
    }
  }

  function handleExportPDF() {
    const origTitle = document.title
    const clientOrProp = (clientName.trim() && propertyName.trim())
      ? `${clientName.trim()} - ${propertyName.trim()}`
      : (clientName.trim() || propertyName.trim() || 'Client')

    const linkedListing = listings.find((l) => l.id === selectedListingId)
    const tourType = linkedListing?.propertyType
      ? `${linkedListing.propertyType} 3D Tour`
      : items[0]?.description
        ? items[0].description.toLowerCase().includes('matterport')
          ? 'Matterport 3D Tour'
          : items[0].description.toLowerCase().includes('virtual tour')
            ? '3D Virtual Tour'
            : items[0].description.toLowerCase().includes('3d')
              ? '3D Tour'
              : items[0].description.split('—')[0].split('&')[0].trim() || '3D Virtual Tour'
        : '3D Virtual Tour'

    const pdfFilename = formatExportFilename({
      clientOrProperty: clientOrProp,
      tourType,
      date: fullInvoiceDate || invoiceDate || new Date(),
    })

    document.title = pdfFilename
    window.print()
    setTimeout(() => {
      document.title = origTitle
    }, 1000)
  }

  return (
    <div className="a4-print-container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none">
      {/* ── Screen Action Header & Tabs (Omitted in PDF export) ── */}
      <div className="no-print mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Finance
              </span>
              <span className="text-xs text-ink-400">· Invoice Management</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-ink-950">
              Invoice
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs text-ink-500 leading-relaxed">
              Auto-generates unique sequential numbers. Create, edit, save to archive, and export to A4 PDF.
            </p>
          </div>

          {/* Tab buttons: Editor vs Archive */}
          <div className="flex items-center gap-2 bg-ink-950/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-ink-950 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              📄 Invoice Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'bg-white text-ink-950 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              <span>📂 Archive</span>
              <span className="rounded-full bg-ink-950/10 px-1.5 py-0.2 text-[10px] font-bold">
                {invoices.length}
              </span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveStatus && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-medium flex items-center justify-between transition-all ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-500/20'
                : 'bg-red-50 text-red-800 border border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{saveStatus.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{saveStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveStatus(null)}
              className="text-ink-400 hover:text-ink-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Editor Controls Bar */}
        {activeTab === 'editor' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-950/8 bg-paper p-3.5 shadow-soft">
            {/* Search Filter for Choosing Property */}
            <div className="relative flex-1 min-w-[280px]" ref={propertySearchRef}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-500 shrink-0">
                  Property / Contact:
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by contact name, phone, or property..."
                    value={propertySearchQuery}
                    onFocus={() => setIsPropertyDropdownOpen(true)}
                    onChange={(e) => {
                      setPropertySearchQuery(e.target.value)
                      setIsPropertyDropdownOpen(true)
                    }}
                    disabled={isSaved && !isEditing}
                    className="w-full rounded-lg border border-ink-950/15 bg-paper pl-3 pr-8 py-1.5 text-xs text-ink-950 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none disabled:bg-ink-50 disabled:text-ink-400"
                  />
                  {propertySearchQuery && isEditing && (
                    <button
                      type="button"
                      onClick={handleClearProperty}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-700"
                      title="Clear selection"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Search results dropdown */}
              {isPropertyDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-ink-950/12 bg-white p-1.5 shadow-lifted">
                  <div
                    onClick={() => handleListingSelect('custom')}
                    className="cursor-pointer rounded-lg px-3 py-2 text-xs text-ink-600 hover:bg-sand-100/50 hover:text-ink-950 transition-colors"
                  >
                    <span className="font-semibold">+ Custom Property</span> (Type manually)
                  </div>
                  {filteredListings.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-ink-400 text-center">
                      No matching properties or contacts found
                    </div>
                  ) : (
                    filteredListings.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => handleListingSelect(l.id)}
                        className={`cursor-pointer rounded-lg px-3 py-2 text-xs transition-colors ${
                          selectedListingId === l.id
                            ? 'bg-brand-500/10 text-brand-900 font-medium'
                            : 'hover:bg-sand-100/60 text-ink-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{l.name}</span>
                          <span className="text-[10px] text-ink-400 font-normal">{l.city || l.location}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                          {l.contactName && <span>👤 {l.contactName}</span>}
                          {l.contactPhone && <span>📞 {l.contactPhone}</span>}
                          {l.contactEmail && <span>✉️ {l.contactEmail}</span>}
                          {l.accountNumber && (
                            <span className="font-mono text-brand-600 text-[10px]">
                              Acc: {l.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Save / Edit / New / Export */}
            <div className="flex items-center gap-2 shrink-0">
              {isSaved && !isEditing ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <span>✓</span> Saved
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 shadow-sm"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startNewInvoice}
                    className="gap-1 shadow-sm"
                  >
                    + New
                  </Button>
                </>
              ) : (
                <>
                  {isSaved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-xs text-ink-500 hover:text-ink-800"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft"
                  >
                    💾 Save Invoice
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addItem}
                    className="gap-1"
                  >
                    + Line
                  </Button>
                </>
              )}

              <Button size="sm" onClick={handleExportPDF} className="gap-1.5 shadow-soft">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── ARCHIVE VIEW (Searchable by Contact Name / Contact Number) ── */}
      {activeTab === 'archive' && (
        <div className="no-print rounded-2xl border border-ink-950/10 bg-white p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-ink-950/10">
            <div>
              <h2 className="text-lg font-semibold text-ink-950">Invoice Archive</h2>
              <p className="text-xs text-ink-500">
                Search and manage previously generated and saved client invoices.
              </p>
            </div>

            <Button size="sm" onClick={startNewInvoice} className="shrink-0 gap-1.5 shadow-sm">
              + Create New Invoice
            </Button>
          </div>

          {/* Search bar for Contact Name / Contact Number */}
          <div className="mt-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search archive by contact name or contact number (phone/email)..."
                value={archiveSearchQuery}
                onChange={(e) => setArchiveSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink-950/15 bg-paper pl-9 pr-8 py-2 text-xs text-ink-950 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none"
              />
              {archiveSearchQuery && (
                <button
                  type="button"
                  onClick={() => setArchiveSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-ink-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Archive List */}
          <div className="mt-4 divide-y divide-ink-950/8">
            {filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-400">
                {archiveSearchQuery
                  ? `No saved invoices matching "${archiveSearchQuery}"`
                  : 'No invoices have been saved yet. Click "Create New Invoice" to get started.'}
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3.5 hover:bg-sand-100/30 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink-950">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[11px] text-ink-400">· {inv.invoiceDate}</span>
                      {inv.accountNumber && (
                        <span className="rounded bg-brand-500/10 px-1.5 py-0.2 font-mono text-[10px] font-medium text-brand-700">
                          {inv.accountNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-800">
                      <span className="font-semibold text-ink-950">
                        {inv.clientName || 'Client name not set'}
                      </span>
                      {inv.clientContact && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span className="text-ink-600 font-medium">{inv.clientContact}</span>
                        </>
                      )}
                    </div>
                    {inv.propertyName && (
                      <p className="text-[11px] text-ink-400">
                        📍 {inv.propertyName} {inv.propertyLocation ? `(${inv.propertyLocation})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div className="mr-2">
                      <p className="text-[10px] uppercase font-bold text-ink-400">Total Due</p>
                      <p className="font-mono text-sm font-bold text-ink-950">
                        KSh {formatMoney(inv.totalDue)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadArchivedInvoice(inv, false)}
                        className="text-xs h-8 px-2.5"
                      >
                        Open / Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadArchivedInvoice(inv, true)}
                        className="text-xs h-8 px-2"
                        title="Direct Export PDF"
                      >
                        🖨️ PDF
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArchived(inv.id, inv.invoiceNumber)}
                        className="h-8 w-8 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors text-xs"
                        title="Delete invoice"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── THE INVOICE CONTAINER (Signature Accent Design & A4 Fitted) ── */}
      {activeTab === 'editor' && (
        <div className="a4-document-sheet rounded-2xl border border-ink-950/10 bg-sand-100/60 p-6 sm:p-10 print:p-8 sm:print:p-10 shadow-soft text-ink-950 print:border print:border-ink-950/15 print:rounded-xl print:shadow-none relative">
          {/* Saved Watermark / Indicator on screen only */}
          {isSaved && !isEditing && (
            <div className="no-print absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-xs border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700">
              <span>🔒 Registered &amp; Locked</span>
            </div>
          )}

          {/* ── TOP SECTION: LOGO + INVOICE META ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between gap-4 pb-5 sm:pb-6 print:pb-5 border-b border-ink-950/12">
            {/* Logo */}
            <div>
              <img
                src="/twinspace-analytics-logo.png"
                alt="TwinSpace 360"
                className="h-12 sm:h-14 print:h-14 w-auto object-contain"
              />
            </div>

            {/* Invoice Label, Number & Date */}
            <div className="sm:text-right print:text-right flex flex-col items-start sm:items-end print:items-end">
              <h2 className="text-2xl sm:text-3xl print:text-3xl font-bold tracking-tight text-ink-950 font-display">
                INVOICE
              </h2>
              <div className="mt-1 flex items-center gap-1 sm:justify-end print:justify-end">
                <span className="text-xs print:text-xs font-semibold text-ink-400">Invoice No:</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  disabled={!isEditing}
                  onChange={(e) => {
                    setInvoiceNumber(e.target.value)
                    setPaymentDetails(`Paybill: 247247  |  Account: ${e.target.value}`)
                  }}
                  className="w-32 sm:text-right print:text-right font-mono text-sm print:text-sm font-semibold text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none px-1 disabled:opacity-90"
                />
              </div>
              <div className="mt-0.5">
                <input
                  type="text"
                  value={invoiceDate}
                  disabled={!isEditing}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-36 sm:text-right print:text-right text-xs print:text-xs font-medium text-ink-500 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none px-1 disabled:opacity-90"
                />
              </div>
            </div>
          </div>

          {/* ── MIDDLE SECTION: INVOICE DATE + BILLED TO + PROPERTY ── */}
          <div className="py-5 sm:py-6 print:py-5 border-b border-ink-950/12 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 print:gap-6">
            {/* Left Column: Dates */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">
                INVOICE DATE
              </p>
              <input
                type="text"
                value={fullInvoiceDate}
                disabled={!isEditing}
                onChange={(e) => setFullInvoiceDate(e.target.value)}
                className="w-full text-sm print:text-sm font-medium text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
              />
            </div>

            {/* Right Column: Billed To & Property */}
            <div className="space-y-4 print:space-y-3.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                  BILLED TO
                </p>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={clientName}
                  disabled={!isEditing}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-sm print:text-sm font-semibold text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
                />
                <input
                  type="text"
                  placeholder="Client Phone / Email"
                  value={clientContact}
                  disabled={!isEditing}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="mt-0.5 w-full text-xs print:text-xs text-ink-600 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
                />
                {accountNumber && (
                  <p className="mt-0.5 text-[11px] font-mono text-ink-400">
                    Account No: {accountNumber}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                  PROPERTY
                </p>
                <input
                  type="text"
                  placeholder="Property Name"
                  value={propertyName}
                  disabled={!isEditing}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full text-sm print:text-sm font-medium text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
                />
                <input
                  type="text"
                  placeholder="Property Location"
                  value={propertyLocation}
                  disabled={!isEditing}
                  onChange={(e) => setPropertyLocation(e.target.value)}
                  className="mt-0.5 w-full text-xs print:text-xs text-ink-500 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
                />
              </div>
            </div>
          </div>

          {/* ── SERVICES TABLE ── */}
          <div className="py-5 sm:py-6 print:py-5 border-b border-ink-950/12">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-3 print:mb-2.5">
              SERVICES
            </p>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left print:table-fixed">
                <thead>
                  <tr className="border-b border-ink-950/15 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <th className="pb-2.5 print:pb-2 w-[50%]">DESCRIPTION</th>
                    <th className="pb-2.5 print:pb-2 text-center w-14 print:w-[12%]">QTY</th>
                    <th className="pb-2.5 print:pb-2 text-right w-24 print:w-[18%]">RATE</th>
                    <th className="pb-2.5 print:pb-2 text-right w-28 print:w-[20%]">AMOUNT</th>
                    <th className="pb-2.5 w-8 no-print" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/8 text-xs sm:text-sm print:text-sm">
                  {items.map((item) => {
                    const lineAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0)

                    return (
                      <tr key={item.id} className="group">
                        {/* Description */}
                        <td className="py-2.5 print:py-2.5 pr-3">
                          <input
                            type="text"
                            value={item.description}
                            disabled={!isEditing}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full text-xs sm:text-sm print:text-sm font-medium text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                          />
                        </td>

                        {/* Qty */}
                        <td className="py-2.5 print:py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            disabled={!isEditing}
                            onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value, 10) || 1)}
                            className="w-10 print:w-10 text-center font-mono text-xs sm:text-sm print:text-sm text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                          />
                        </td>

                        {/* Rate */}
                        <td className="py-2.5 print:py-2.5 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[11px] print:text-xs text-ink-400">KSh</span>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={item.rate}
                              disabled={!isEditing}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="w-20 print:w-20 text-right font-mono text-xs sm:text-sm print:text-sm text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                            />
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-2.5 print:py-2.5 pl-3 text-right font-mono font-medium text-ink-950 text-xs sm:text-sm print:text-sm">
                          KSh {formatMoney(lineAmount)}
                        </td>

                        {/* Delete action */}
                        <td className="py-2.5 pl-2 text-right no-print">
                          {items.length > 1 && isEditing && (
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
          <div className="py-5 sm:py-6 print:py-4 border-b border-ink-950/12 flex justify-end">
            <div className="w-full sm:w-80 print:w-80 space-y-2 print:space-y-1.5 text-xs sm:text-sm print:text-sm">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  SUBTOTAL
                </span>
                <span className="font-mono font-medium text-ink-900">
                  KSh {formatMoney(subtotal)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between">
                <span className="text-xs print:text-xs font-medium text-ink-500">Discount:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-[11px] print:text-xs text-ink-400">- KSh</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    disabled={!isEditing}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 print:w-20 text-right text-xs sm:text-sm print:text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                  />
                </div>
              </div>

              {/* Tax / VAT */}
              <div className="flex items-center justify-between">
                <span className="text-xs print:text-xs font-medium text-ink-500">Tax / VAT:</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-[11px] print:text-xs text-ink-400">+ KSh</span>
                  <input
                    type="number"
                    min={0}
                    value={tax}
                    disabled={!isEditing}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="w-20 print:w-20 text-right text-xs sm:text-sm print:text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                  />
                </div>
              </div>

              {/* Total Due */}
              <div className="pt-2.5 print:pt-2 border-t border-ink-950/15 flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm print:text-sm uppercase tracking-wider text-ink-950">
                  TOTAL DUE
                </span>
                <span className="font-display text-lg sm:text-xl print:text-xl font-bold text-ink-950">
                  KSh {formatMoney(totalDue)}
                </span>
              </div>
            </div>
          </div>

          {/* ── PAYMENT INFORMATION & CLOSING ── */}
          <div className="pt-5 sm:pt-6 print:pt-5 space-y-3.5 print:space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                PAYMENT INFORMATION
              </p>
              <div className="flex flex-wrap items-center gap-2 print:gap-2">
                <input
                  type="text"
                  value={paymentMethod}
                  disabled={!isEditing}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="font-semibold text-xs sm:text-sm print:text-sm text-ink-950 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                />
                <span className="text-xs text-ink-300">·</span>
                <input
                  type="text"
                  value={paymentDetails}
                  disabled={!isEditing}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="text-xs print:text-xs font-mono text-ink-600 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none flex-1 min-w-[200px] disabled:opacity-90"
                />
              </div>
            </div>

            <div className="pt-2 print:pt-1.5 text-xs print:text-xs text-ink-500 space-y-0.5">
              <input
                type="text"
                value={thankYouMessage}
                disabled={!isEditing}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full font-medium text-ink-700 bg-transparent border-none p-0 focus:outline-none disabled:opacity-90"
              />
              <input
                type="text"
                value={tagline}
                disabled={!isEditing}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full text-ink-400 bg-transparent border-none p-0 focus:outline-none disabled:opacity-90"
              />
            </div>

            {/* ── Product of DiaSpace Watermark Footer ── */}
            <SheetDiaspaceWatermark />
          </div>
        </div>
      )}
    </div>
  )
}
