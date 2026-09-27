import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { generateNextReceiptNumber } from '@/lib/firebase/finance'
import { formatExportFilename } from '@/lib/exportFilename'
import { SheetDiaspaceWatermark } from '@/components/common/SheetDiaspaceWatermark'
import { generateUUID } from '@/lib/uuid'
import { formatWhatsAppReceiptMessage } from '@/lib/subscriptionRenewal'
import type { FinanceItem, SavedReceipt, SendingLog } from '@/types/finance'

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-KE')
}

export function AdminReceipt() {
  const [searchParams] = useSearchParams()
  const { listings } = useAdminListings()
  const { receipts, invoices, saveReceipt, deleteReceipt, saveInvoice } = useAdminFinance()

  usePageMeta({
    title: 'Generate Receipt — TwinSpace Admin',
    description: 'Create, archive, and export professional client payment receipts.',
    path: '/admin/receipt',
    noIndex: true,
  })

  // Tab: 'editor' | 'archive'
  const [activeTab, setActiveTab] = useState<'editor' | 'archive'>('editor')

  // Receipt ID & state
  const [currentId, setCurrentId] = useState<string>(() => generateUUID())
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Linked Invoice & Renewal fields
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string>('')
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState<string>('')
  const [clientEmail, setClientEmail] = useState<string>('')
  const [clientPhone, setClientPhone] = useState<string>('')
  const [sendingHistory, setSendingHistory] = useState<SendingLog[]>([])

  // Property Selection & Search Filter
  const [selectedListingId, setSelectedListingId] = useState<string>('custom')
  const [propertySearchQuery, setPropertySearchQuery] = useState('')
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false)
  const propertySearchRef = useRef<HTMLDivElement>(null)

  // Archive Search Filter
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')

  // Dispatch Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sendModalMethod, setSendModalMethod] = useState<'email' | 'whatsapp'>('email')
  const [sendModalEmail, setSendModalEmail] = useState('')
  const [sendModalPhone, setSendModalPhone] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Receipt Metadata
  const [receiptNumber, setReceiptNumber] = useState('')
  const [receiptDate, setReceiptDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  })
  const [fullPaymentDate, setFullPaymentDate] = useState(() => {
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
    { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 0 },
    { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 0 },
  ])

  // Adjustments
  const [discount, setDiscount] = useState<number>(0)
  const [isTaxCustom, setIsTaxCustom] = useState<boolean>(false)
  const [tax, setTax] = useState<number>(0)

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa')
  const [transactionRef, setTransactionRef] = useState('M-Pesa Ref: QK9182XX9')
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for choosing TwinSpace.')
  const [tagline, setTagline] = useState('Immersive spaces. Extraordinary experiences.')

  // Snapshot for cancelling edits
  const originalSnapshotRef = useRef<SavedReceipt | null>(null)

  // Auto-generate receipt number if not initialized
  useEffect(() => {
    if (!receiptNumber) {
      const next = generateNextReceiptNumber(receipts)
      setReceiptNumber(next)
    }
  }, [receipts, receiptNumber])

  // Handle URL Search Params (e.g. from Paid Invoice "Generate Receipt")
  const processedParamRef = useRef<string>('')
  useEffect(() => {
    const invoiceIdParam = searchParams.get('invoiceId')
    const actionParam = searchParams.get('action')
    const searchParam = searchParams.get('search')

    const paramKey = `${invoiceIdParam}_${actionParam}_${searchParam}`
    if (processedParamRef.current === paramKey) return
    processedParamRef.current = paramKey

    if (searchParam) {
      const found = receipts.find(
        (rec) => rec.receiptNumber.trim().toUpperCase() === searchParam.trim().toUpperCase(),
      )
      if (found) {
        loadArchivedReceipt(found)
        return
      }
    }

    if (actionParam === 'generate_receipt' && invoiceIdParam && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === invoiceIdParam)
      if (!invoice) {
        setSaveStatus({
          type: 'error',
          message: 'Referenced invoice not found in archive.',
        })
        return
      }

      // Security check: Must NOT generate receipt for unpaid invoice
      if (invoice.status !== 'paid') {
        setSaveStatus({
          type: 'error',
          message: `Cannot generate receipt: Invoice ${invoice.invoiceNumber} is marked as '${invoice.status || 'unpaid'}'. A receipt can only be generated for a confirmed paid invoice.`,
        })
        return
      }

      // Check if a receipt already exists for this invoice
      const existingReceipt = receipts.find((r) => r.invoiceId === invoice.id)
      if (existingReceipt) {
        loadArchivedReceipt(existingReceipt)
        setSaveStatus({
          type: 'warning',
          message: `Receipt already generated for invoice ${invoice.invoiceNumber} (${existingReceipt.receiptNumber}). Loaded existing receipt.`,
        })
        return
      }

      // Pre-populate fields automatically from the paid invoice
      const nextNum = generateNextReceiptNumber(receipts)
      const newReceiptId = generateUUID()
      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
      const todayFull = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      setCurrentId(newReceiptId)
      setReceiptNumber(nextNum)
      setReceiptDate(todayFormatted)
      setFullPaymentDate(todayFull)
      setClientName(invoice.clientName || '')
      setClientContact(invoice.clientContact || '')
      setClientEmail(invoice.clientEmail || '')
      setClientPhone(invoice.clientPhone || '')
      setAccountNumber(invoice.accountNumber || '')
      setPropertyName(invoice.propertyName || '')
      setPropertyLocation(invoice.propertyLocation || '')
      setSelectedListingId(invoice.listingId || 'custom')
      setPropertySearchQuery(invoice.propertyName || '')
      setItems(invoice.items || [])
      setDiscount(invoice.discount || 0)
      setTax(invoice.tax || 0)
      setIsTaxCustom(true)
      setPaymentMethod(invoice.paymentMethod || 'M-Pesa')
      setTransactionRef(`Paid against ${invoice.invoiceNumber}`)
      setLinkedInvoiceId(invoice.id)
      setLinkedInvoiceNumber(invoice.invoiceNumber)

      setIsSaved(false)
      setIsEditing(true)
      originalSnapshotRef.current = null
      setActiveTab('editor')

      setSaveStatus({
        type: 'success',
        message: `Receipt pre-populated from paid invoice ${invoice.invoiceNumber}. Total paid: KES ${formatMoney(invoice.totalDue)}. Review and save or dispatch.`,
      })
    }
  }, [searchParams, invoices, receipts])

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

  const totalPaid = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0))
  }, [subtotal, discount, tax])

  // Automatically calculate 16% VAT when subtotal changes, unless customized
  useEffect(() => {
    if (!isTaxCustom) {
      setTax(Math.round(subtotal * 0.16))
    }
  }, [subtotal, isTaxCustom])

  // Filter listings
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

  // Filter saved archive receipts
  const filteredReceipts = useMemo(() => {
    if (!archiveSearchQuery.trim()) return receipts
    const q = archiveSearchQuery.toLowerCase()
    return receipts.filter((rec) => {
      const name = (rec.clientName || '').toLowerCase()
      const contact = (rec.clientContact || '').toLowerCase()
      const num = (rec.receiptNumber || '').toLowerCase()
      const prop = (rec.propertyName || '').toLowerCase()
      const acc = (rec.accountNumber || '').toLowerCase()
      const ref = (rec.transactionRef || '').toLowerCase()
      return (
        name.includes(q) ||
        contact.includes(q) ||
        num.includes(q) ||
        prop.includes(q) ||
        acc.includes(q) ||
        ref.includes(q)
      )
    })
  }, [receipts, archiveSearchQuery])

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
      if (l.contactEmail) setClientEmail(l.contactEmail)
      if (l.contactPhone) setClientPhone(l.contactPhone)
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
    setClientEmail('')
    setClientPhone('')
    setAccountNumber('')
    setLinkedInvoiceId('')
    setLinkedInvoiceNumber('')
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: generateUUID(), description: 'Additional 3D Tour Service', qty: 1, rate: 0 },
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

  function startNewReceipt() {
    const nextNum = generateNextReceiptNumber(receipts)
    setCurrentId(generateUUID())
    setReceiptNumber(nextNum)
    setReceiptDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase())
    setFullPaymentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    setClientName('')
    setClientContact('')
    setClientEmail('')
    setClientPhone('')
    setAccountNumber('')
    setPropertyName('')
    setPropertyLocation('')
    setSelectedListingId('custom')
    setPropertySearchQuery('')
    setItems([
      { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 0 },
      { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 0 },
    ])
    setDiscount(0)
    setIsTaxCustom(false)
    setTax(0)
    setTransactionRef('M-Pesa Ref: QK9182XX9')
    setLinkedInvoiceId('')
    setLinkedInvoiceNumber('')
    setSendingHistory([])
    setIsSaved(false)
    setIsEditing(true)
    setSaveStatus(null)
    originalSnapshotRef.current = null
    setActiveTab('editor')
  }

  function loadArchivedReceipt(rec: SavedReceipt, autoPrint = false) {
    setCurrentId(rec.id)
    setReceiptNumber(rec.receiptNumber)
    setReceiptDate(rec.receiptDate)
    setFullPaymentDate(rec.fullPaymentDate)
    setClientName(rec.clientName)
    setClientContact(rec.clientContact)
    setClientEmail(rec.clientEmail || '')
    setClientPhone(rec.clientPhone || '')
    setAccountNumber(rec.accountNumber || '')
    setPropertyName(rec.propertyName)
    setPropertyLocation(rec.propertyLocation)
    setSelectedListingId(rec.listingId || 'custom')
    setPropertySearchQuery(rec.propertyName || '')
    setItems(rec.items)
    setDiscount(rec.discount)
    setTax(rec.tax)
    setIsTaxCustom(true)
    setPaymentMethod(rec.paymentMethod)
    setTransactionRef(rec.transactionRef)
    setThankYouMessage(rec.thankYouMessage)
    setTagline(rec.tagline)
    setLinkedInvoiceId(rec.invoiceId || '')
    setLinkedInvoiceNumber(rec.invoiceNumber || '')
    setSendingHistory(rec.sendingHistory || [])
    setIsSaved(true)
    setIsEditing(false)
    setSaveStatus(null)
    originalSnapshotRef.current = rec
    setActiveTab('editor')

    if (autoPrint) {
      setTimeout(() => {
        handleExportPDF()
      }, 300)
    }
  }

  async function handleSave(additionalHistory?: SendingLog) {
    try {
      setSaveStatus(null)
      const numTrimmed = receiptNumber.trim()
      if (!numTrimmed) {
        setSaveStatus({ type: 'error', message: 'Receipt number is required.' })
        return
      }

      // Check if receipt number is already registered to another receipt
      const conflict = receipts.find(
        (rec) => rec.id !== currentId && rec.receiptNumber.trim().toUpperCase() === numTrimmed.toUpperCase(),
      )
      if (conflict) {
        setSaveStatus({
          type: 'error',
          message: `Receipt number "${numTrimmed}" is already registered to another saved receipt and cannot be replicated.`,
        })
        return
      }

      const updatedHistory = additionalHistory
        ? [additionalHistory, ...(sendingHistory || [])]
        : sendingHistory || []

      const receiptToSave: SavedReceipt = {
        id: currentId,
        receiptNumber: numTrimmed,
        receiptDate,
        fullPaymentDate,
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        accountNumber: accountNumber.trim(),
        propertyName: propertyName.trim(),
        propertyLocation: propertyLocation.trim(),
        listingId: selectedListingId,
        items,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        subtotal,
        totalPaid,
        paymentMethod,
        transactionRef,
        thankYouMessage,
        tagline,
        invoiceId: linkedInvoiceId,
        invoiceNumber: linkedInvoiceNumber,
        sendingHistory: updatedHistory,
        createdAt: originalSnapshotRef.current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveReceipt(receiptToSave)

      // If linked to an invoice, update the invoice with receiptId
      if (linkedInvoiceId) {
        const inv = invoices.find((i) => i.id === linkedInvoiceId)
        if (inv && inv.receiptId !== currentId) {
          await saveInvoice({ ...inv, receiptId: currentId, status: 'paid' })
        }
      }

      originalSnapshotRef.current = receiptToSave
      setSendingHistory(updatedHistory)
      setIsSaved(true)
      setIsEditing(false)
      setSaveStatus({
        type: 'success',
        message: `Receipt ${numTrimmed} saved successfully.`,
      })
      setTimeout(() => setSaveStatus(null), 5000)
      return receiptToSave
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save receipt.' })
    }
  }

  function handleCancelEdit() {
    if (originalSnapshotRef.current) {
      loadArchivedReceipt(originalSnapshotRef.current)
    } else {
      setIsEditing(false)
    }
  }

  async function handleDeleteArchived(id: string, num: string) {
    if (!window.confirm(`Are you sure you want to delete receipt ${num}? This cannot be undone.`)) {
      return
    }
    try {
      await deleteReceipt(id)
      if (currentId === id) {
        startNewReceipt()
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete receipt.')
    }
  }

  // Open Dispatch Modal
  function openSendModal() {
    const emailToUse = clientEmail || (clientContact.includes('@') ? clientContact.split('·').find((p) => p.includes('@'))?.trim() || '' : '')
    const phoneToUse = clientPhone || (clientContact.replace(/[^0-9+]/g, '').length >= 9 ? clientContact.split('·').find((p) => p.replace(/[^0-9]/g, '').length >= 9)?.trim() || '' : '')

    setSendModalEmail(emailToUse)
    setSendModalPhone(phoneToUse)
    setIsSendModalOpen(true)
  }

  // Send via Serverless Email (no-reply@twinspace360.com)
  async function handleSendEmail() {
    if (!sendModalEmail.trim()) {
      alert('Please enter a valid recipient email address.')
      return
    }

    setIsSendingEmail(true)
    try {
      const payload = {
        type: 'receipt',
        recipientEmail: sendModalEmail.trim(),
        clientName: clientName.trim() || 'Client',
        propertyName: propertyName.trim() || 'Virtual Tour Property',
        propertyLocation,
        accountNumber,
        documentNumber: receiptNumber,
        documentDate: receiptDate,
        dueDateOrPaymentDate: fullPaymentDate,
        items,
        subtotal,
        discount,
        tax,
        totalAmount: totalPaid,
        paymentMethod,
        paymentDetailsOrRef: transactionRef,
      }

      const res = await fetch('/api/finance/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error sending receipt email.')
      }

      const logEntry: SendingLog = {
        id: generateUUID(),
        date: new Date().toISOString(),
        method: 'email',
        recipient: sendModalEmail.trim(),
        status: 'sent',
      }

      await handleSave(logEntry)
      setIsSendModalOpen(false)
      setSaveStatus({
        type: 'success',
        message: data.message || `Receipt ${receiptNumber} sent via email to ${sendModalEmail} from no-reply@twinspace360.com.`,
      })
    } catch (err: any) {
      const failureLog: SendingLog = {
        id: generateUUID(),
        date: new Date().toISOString(),
        method: 'email',
        recipient: sendModalEmail.trim(),
        status: 'failed',
        error: err.message,
      }
      setSendingHistory((prev) => [failureLog, ...prev])
      setSaveStatus({
        type: 'error',
        message: `Email dispatch failed: ${err.message}.`,
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // WhatsApp Handoff / Web Dispatch
  function handleSendWhatsApp() {
    const rawPhone = sendModalPhone.trim() || clientPhone.trim()
    if (!rawPhone) {
      alert('Please enter a valid WhatsApp phone number.')
      return
    }

    const cleanPhone = rawPhone.replace(/[^\d]/g, '')
    const currentReceiptSnapshot: SavedReceipt = {
      id: currentId,
      receiptNumber,
      receiptDate,
      fullPaymentDate,
      clientName,
      clientContact,
      clientEmail,
      clientPhone: rawPhone,
      accountNumber,
      propertyName,
      propertyLocation,
      items,
      discount,
      tax,
      subtotal,
      totalPaid,
      paymentMethod,
      transactionRef,
      thankYouMessage,
      tagline,
      invoiceNumber: linkedInvoiceNumber,
      createdAt: originalSnapshotRef.current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const messageText = formatWhatsAppReceiptMessage(currentReceiptSnapshot)
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    window.open(waUrl, '_blank')

    const logEntry: SendingLog = {
      id: generateUUID(),
      date: new Date().toISOString(),
      method: 'whatsapp',
      recipient: rawPhone,
      status: 'prepared',
    }

    handleSave(logEntry)
    setIsSendModalOpen(false)
    setSaveStatus({
      type: 'success',
      message: `Receipt ${receiptNumber} prepared and shared via WhatsApp handoff.`,
    })
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
      date: fullPaymentDate || receiptDate || new Date(),
    })

    document.title = pdfFilename
    window.print()
    setTimeout(() => {
      document.title = origTitle
    }, 1000)
  }

  return (
    <div className="a4-print-container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none">
      {/* ── Screen Action Header & Tabs ── */}
      <div className="no-print mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Finance
              </span>
              <span className="text-xs text-ink-400">· Payment Receipt Management</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-ink-950">
              Receipt Management
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs text-ink-500 leading-relaxed">
              Auto-generate receipts from confirmed paid invoices, dispatch via Email &amp; WhatsApp, and maintain clean audit records.
            </p>
          </div>

          {/* Tab buttons */}
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
              📄 Receipt Editor
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
                {receipts.length}
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
                : saveStatus.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-500/20'
                  : 'bg-red-50 text-red-800 border border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{saveStatus.type === 'success' ? '✓' : saveStatus.type === 'warning' ? 'ℹ️' : '⚠️'}</span>
              <span>{saveStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveStatus(null)}
              className="text-ink-400 hover:text-ink-700 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {activeTab === 'editor' && (
        <>
          {/* Action Bar */}
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-950/8 bg-white p-3 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                CONFIRMED PAID
              </span>
              {linkedInvoiceNumber && (
                <span className="text-xs text-ink-500">
                  Linked to Invoice: <strong className="text-ink-800">{linkedInvoiceNumber}</strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSaved && !isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sand-100 shadow-soft"
                  >
                    ✏️ Edit Receipt
                  </button>
                  <button
                    type="button"
                    onClick={openSendModal}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 text-xs font-medium shadow-soft"
                  >
                    📤 Send Receipt
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="rounded-lg bg-ink-950 hover:bg-ink-900 text-white px-3.5 py-1.5 text-xs font-medium shadow-soft"
                  >
                    💾 Save Receipt
                  </button>
                  {isSaved && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sand-100 shadow-soft"
                    >
                      Cancel Edit
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={handleExportPDF}
                className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sand-100 shadow-soft"
              >
                🖨️ Export PDF (A4)
              </button>

              <button
                type="button"
                onClick={startNewReceipt}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                + New Receipt
              </button>
            </div>
          </div>

          {/* Property Selection / Pre-fill */}
          <div className="no-print mb-6 rounded-2xl border border-ink-950/8 bg-white p-4 shadow-soft">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Auto-fill from Property
            </label>
            <div className="relative" ref={propertySearchRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by property, client name, phone, or account number..."
                  value={propertySearchQuery}
                  onFocus={() => setIsPropertyDropdownOpen(true)}
                  onChange={(e) => {
                    setPropertySearchQuery(e.target.value)
                    setIsPropertyDropdownOpen(true)
                  }}
                  className="w-full rounded-xl border border-ink-950/12 bg-white px-3.5 py-2 text-xs text-ink-900 shadow-soft focus:border-brand-500 focus:outline-none"
                />
                {selectedListingId !== 'custom' && (
                  <button
                    type="button"
                    onClick={handleClearProperty}
                    className="rounded-xl border border-ink-950/10 px-3 py-2 text-xs font-medium text-ink-500 hover:bg-ink-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              {isPropertyDropdownOpen && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-ink-950/10 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleListingSelect('custom')}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-ink-600 hover:bg-ink-50"
                  >
                    ✏️ Manual / Custom Client
                  </button>
                  {filteredListings.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleListingSelect(l.id)}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-ink-50 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{l.name}</span>
                        {l.accountNumber && (
                          <span className="text-[10px] font-mono text-brand-600 font-bold">{l.accountNumber}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-500 flex gap-2">
                        {l.contactName && <span>{l.contactName}</span>}
                        {l.contactPhone && <span>· {l.contactPhone}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Printable A4 Layout ── */}
          <div className="relative overflow-hidden rounded-2xl border border-ink-950/8 bg-white p-6 sm:p-10 shadow-soft print:border-none print:shadow-none print:p-8">
            <SheetDiaspaceWatermark />

            {/* Document Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-ink-950/8 pb-6">
              <div>
                <span className="font-display text-2xl font-bold tracking-tight text-ink-950">TWINSPACE</span>
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                  Virtual Tours &amp; Digital Twins
                </span>
                <p className="mt-2 text-xs text-ink-500">
                  Nairobi, Kenya &bull; info@twinspace360.com &bull; +254 700 000 000
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  PAYMENT RECEIPT
                </span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex sm:justify-end gap-2 text-ink-600">
                    <span className="text-ink-400">Receipt #:</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                      className="font-mono font-bold text-ink-950 disabled:bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none w-28 text-right"
                    />
                  </div>
                  {linkedInvoiceNumber && (
                    <div className="flex sm:justify-end gap-2 text-ink-600">
                      <span className="text-ink-400">Invoice Ref:</span>
                      <span className="font-mono font-bold text-brand-600">{linkedInvoiceNumber}</span>
                    </div>
                  )}
                  <div className="flex sm:justify-end gap-2 text-ink-600">
                    <span className="text-ink-400">Payment Date:</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="font-medium text-ink-900 disabled:bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none w-28 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Received From / Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold uppercase tracking-wider text-ink-400 text-[10px]">Received From</p>
                <input
                  type="text"
                  placeholder="Client / Company Name"
                  disabled={!isEditing}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="block w-full font-bold text-sm text-ink-950 disabled:bg-transparent border-b border-dashed border-ink-200 focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Email or Phone / WhatsApp"
                  disabled={!isEditing}
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="block w-full text-ink-600 disabled:bg-transparent border-b border-dashed border-ink-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:text-right">
                <p className="font-semibold uppercase tracking-wider text-ink-400 text-[10px]">Property Details</p>
                <input
                  type="text"
                  placeholder="Property Name"
                  disabled={!isEditing}
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="block w-full sm:text-right font-semibold text-ink-900 disabled:bg-transparent border-b border-dashed border-ink-200 focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Location / County"
                  disabled={!isEditing}
                  value={propertyLocation}
                  onChange={(e) => setPropertyLocation(e.target.value)}
                  className="block w-full sm:text-right text-ink-500 disabled:bg-transparent border-b border-dashed border-ink-200 focus:border-brand-500 focus:outline-none"
                />
                <div className="flex sm:justify-end gap-1.5 items-center">
                  <span className="text-ink-400 text-[11px]">Account ID:</span>
                  <input
                    type="text"
                    placeholder="e.g. NBI-KIL-0001"
                    disabled={!isEditing}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                    className="font-mono font-bold text-brand-600 text-xs disabled:bg-transparent border-b border-dashed border-ink-200 focus:border-brand-500 focus:outline-none w-32 sm:text-right"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="my-6 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink-950/8 bg-ink-50/50 text-left text-ink-500">
                    <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Description</th>
                    <th className="py-2.5 px-3 text-center font-semibold uppercase tracking-wider w-20">Qty</th>
                    <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-28">Rate (KES)</th>
                    <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-28">Amount</th>
                    {isEditing && <th className="py-2.5 px-2 text-center w-10 no-print"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/6">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full text-ink-900 font-medium disabled:bg-transparent focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          disabled={!isEditing}
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="w-14 text-center text-ink-700 disabled:bg-transparent focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          disabled={!isEditing}
                          value={item.rate === 0 ? '' : item.rate}
                          placeholder="0"
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-24 text-right text-ink-700 disabled:bg-transparent focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-ink-950">
                        {formatMoney((Number(item.qty) || 1) * (Number(item.rate) || 0))}
                      </td>
                      {isEditing && (
                        <td className="py-2.5 px-2 text-center no-print">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditing && (
                <button
                  type="button"
                  onClick={addItem}
                  className="no-print mt-3 text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  + Add Line Item
                </button>
              )}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 border-t border-ink-950/8 pt-6 text-xs">
              <div className="space-y-2">
                <p className="font-semibold uppercase tracking-wider text-ink-400 text-[10px]">Payment Proof Details</p>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-3 text-xs">
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full font-semibold text-emerald-900 disabled:bg-transparent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Payment confirmed and reconciled to TwinSpace Finance Accounts.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-ink-900">KES {formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-ink-600">
                  <span>VAT (16%):</span>
                  <div className="flex items-center gap-1">
                    <span>KES</span>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={tax}
                      onChange={(e) => {
                        setIsTaxCustom(true)
                        setTax(parseFloat(e.target.value) || 0)
                      }}
                      className="w-20 text-right font-semibold text-ink-900 disabled:bg-transparent border-b border-dashed border-ink-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-ink-950/8 pt-2 flex justify-between text-sm font-bold text-ink-950">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600 text-base">KES {formatMoney(totalPaid)}</span>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-ink-950/8 pt-6 mt-8 text-center text-xs text-ink-400 space-y-1">
              <input
                type="text"
                disabled={!isEditing}
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full text-center font-medium text-ink-600 disabled:bg-transparent focus:outline-none"
              />
              <p className="text-[11px] text-ink-400">{tagline}</p>
            </div>
          </div>
        </>
      )}

      {/* ── Archive Tab ── */}
      {activeTab === 'archive' && (
        <div className="no-print space-y-4">
          <div className="rounded-2xl border border-ink-950/8 bg-white p-4 shadow-soft flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search receipts by client, property, receipt number, or reference..."
              value={archiveSearchQuery}
              onChange={(e) => setArchiveSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-ink-950/12 bg-white px-3.5 py-2 text-xs text-ink-900 shadow-soft focus:border-brand-500 focus:outline-none"
            />
            {archiveSearchQuery && (
              <button
                type="button"
                onClick={() => setArchiveSearchQuery('')}
                className="text-xs text-ink-400 hover:text-ink-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink-950/8 bg-ink-50/50 text-left text-ink-400">
                    <th className="py-3 px-4 font-semibold uppercase">Receipt #</th>
                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                    <th className="py-3 px-4 font-semibold uppercase">Client</th>
                    <th className="py-3 px-4 font-semibold uppercase">Property</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold uppercase">Reference</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/6">
                  {filteredReceipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-ink-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-ink-950">{rec.receiptNumber}</td>
                      <td className="py-3 px-4 text-ink-600">{rec.receiptDate}</td>
                      <td className="py-3 px-4 font-medium text-ink-900">{rec.clientName || '—'}</td>
                      <td className="py-3 px-4 text-ink-700">{rec.propertyName || '—'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">KES {formatMoney(rec.totalPaid)}</td>
                      <td className="py-3 px-4 text-ink-600">{rec.transactionRef || '—'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => loadArchivedReceipt(rec)}
                          className="text-brand-600 hover:text-brand-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => loadArchivedReceipt(rec, true)}
                          className="text-ink-600 hover:text-ink-950 font-semibold"
                        >
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArchived(rec.id, rec.receiptNumber)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-ink-400">
                        No receipts found in archive.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SEND RECEIPT VIA EMAIL / WHATSAPP ── */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-ink-950/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-950/8 pb-3">
              <h3 className="text-base font-semibold text-ink-950">Send Receipt {receiptNumber}</h3>
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="text-ink-400 hover:text-ink-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex items-center justify-center gap-2 rounded-xl bg-ink-100 p-1">
              <button
                type="button"
                onClick={() => setSendModalMethod('email')}
                className={`w-1/2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  sendModalMethod === 'email' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600'
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => setSendModalMethod('whatsapp')}
                className={`w-1/2 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  sendModalMethod === 'whatsapp' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600'
                }`}
              >
                💬 WhatsApp
              </button>
            </div>

            {sendModalMethod === 'email' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Sender</label>
                  <input
                    type="text"
                    disabled
                    value="TwinSpace <no-reply@twinspace360.com>"
                    className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-ink-600 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={sendModalEmail}
                    onChange={(e) => setSendModalEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full rounded-lg border border-ink-300 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="rounded-lg bg-ink-50 p-3 text-[11px] text-ink-600 space-y-1">
                  <p><strong>Subject:</strong> Twinspace Payment Receipt – {receiptNumber}</p>
                  <p><strong>Property:</strong> {propertyName}</p>
                  <p><strong>Amount Paid:</strong> KES {formatMoney(totalPaid)}</p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSendModalOpen(false)}
                    disabled={isSendingEmail}
                    className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sand-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-medium disabled:opacity-50 shadow-soft"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Receipt Email'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-600 mb-1">Recipient Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={sendModalPhone}
                    onChange={(e) => setSendModalPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full rounded-lg border border-ink-300 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg bg-ink-50 p-2.5 font-mono text-[10px] text-ink-700 whitespace-pre-wrap">
                  {formatWhatsAppReceiptMessage({
                    id: currentId,
                    receiptNumber,
                    receiptDate,
                    fullPaymentDate,
                    clientName,
                    clientContact,
                    accountNumber,
                    propertyName,
                    propertyLocation,
                    items,
                    discount,
                    tax,
                    subtotal,
                    totalPaid,
                    paymentMethod,
                    transactionRef,
                    thankYouMessage,
                    tagline,
                    invoiceNumber: linkedInvoiceNumber,
                    createdAt: '',
                    updatedAt: '',
                  })}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSendModalOpen(false)}
                    className="rounded-lg border border-ink-950/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sand-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-medium shadow-soft"
                  >
                    Open WhatsApp Handoff
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
