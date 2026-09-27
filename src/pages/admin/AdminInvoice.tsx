import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
import { Button } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'
import { generateNextInvoiceNumber } from '@/lib/firebase/finance'
import { formatExportFilename } from '@/lib/exportFilename'
import { SheetDiaspaceWatermark } from '@/components/common/SheetDiaspaceWatermark'
import { generateUUID } from '@/lib/uuid'
import { updateListing } from '@/lib/firebase/listings'
import {
  DEFAULT_PRICING_DISCOUNTS,
  DEFAULT_SHOOT_PRICING,
  subscribeDiscounts,
  subscribePricing,
  type PricingDiscounts,
  type ShootPricingPlan,
} from '@/lib/firebase/pricing'
import {
  advanceRenewalDate,
  calculateDueDateFromPayment,
  calculateRenewalDate,
  calculateSubscriptionPrice,
  findExistingRenewalInvoice,
  formatDisplayDate,
  formatISODate,
  formatWhatsAppInvoiceMessage,
  getFrequencyDays,
  normalizeBillingFrequency,
  parseLocalDate,
} from '@/lib/subscriptionRenewal'
import type { BillingFrequency, FinanceItem, InvoiceStatus, SavedInvoice, SendingLog } from '@/types/finance'

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-KE')
}

export function AdminInvoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { listings } = useAdminListings()
  const { invoices, receipts, saveInvoice, deleteInvoice } = useAdminFinance()

  usePageMeta({
    title: 'Generate Invoice — TwinSpace Admin',
    description: 'Create, archive, and export professional client invoices.',
    path: '/admin/invoice',
    noIndex: true,
  })

  // Pricing configuration
  const [pricingDiscounts, setPricingDiscounts] = useState<PricingDiscounts>(DEFAULT_PRICING_DISCOUNTS)
  const [shootPlans, setShootPlans] = useState<ShootPricingPlan[]>(DEFAULT_SHOOT_PRICING)

  useEffect(() => {
    const unsubDiscounts = subscribeDiscounts(setPricingDiscounts)
    const unsubPricing = subscribePricing(setShootPlans)
    return () => {
      unsubDiscounts()
      unsubPricing()
    }
  }, [])

  // Tab: 'editor' | 'history' | 'archive'
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'archive'>('editor')

  // Invoice ID & state
  const [currentId, setCurrentId] = useState<string>(() => generateUUID())
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(true)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // Status & Subscription Fields
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('draft')
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('Monthly')
  const [renewalDate, setRenewalDate] = useState<string>('')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [previousInvoiceId, setPreviousInvoiceId] = useState<string>('')
  const [receiptId, setReceiptId] = useState<string>('')
  const [clientEmail, setClientEmail] = useState<string>('')
  const [clientPhone, setClientPhone] = useState<string>('')
  const [sendingHistory, setSendingHistory] = useState<SendingLog[]>([])

  // Property Selection & Search Filter
  const [selectedListingId, setSelectedListingId] = useState<string>('custom')
  const [propertySearchQuery, setPropertySearchQuery] = useState('')
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false)
  const propertySearchRef = useRef<HTMLDivElement>(null)

  // Archive Search Filter (by contact name / contact number)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')

  // Client History Tab Selection
  const [historySelectedListingId, setHistorySelectedListingId] = useState<string>('')

  // Dispatch Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sendModalMethod, setSendModalMethod] = useState<'email' | 'whatsapp'>('email')
  const [sendModalEmail, setSendModalEmail] = useState('')
  const [sendModalPhone, setSendModalPhone] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

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
    { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 0 },
    { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 0 },
  ])

  // Adjustments
  const [discount, setDiscount] = useState<number>(0)
  const [isTaxCustom, setIsTaxCustom] = useState<boolean>(false)
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
      if (!accountNumber) {
        setPaymentDetails(`Paybill: 247247  |  Account: ${next}`)
      }
    }
  }, [invoices, invoiceNumber, accountNumber])

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

  // Automatically calculate 16% VAT when subtotal changes, unless manually customized or omitted by admin
  useEffect(() => {
    if (!isTaxCustom) {
      setTax(Math.round(subtotal * 0.16))
    }
  }, [subtotal, isTaxCustom])

  // Handle URL Search Params (e.g. from Subscription Sorting "Generate Invoice" or "History")
  const processedParamRef = useRef<string>('')
  useEffect(() => {
    const listingIdParam = searchParams.get('listingId')
    const actionParam = searchParams.get('action')
    const viewParam = searchParams.get('view')
    const searchParam = searchParams.get('search')

    const paramKey = `${listingIdParam}_${actionParam}_${viewParam}_${searchParam}`
    if (processedParamRef.current === paramKey) return
    processedParamRef.current = paramKey

    if (viewParam === 'history') {
      setActiveTab('history')
      if (listingIdParam) setHistorySelectedListingId(listingIdParam)
      return
    }

    if (searchParam) {
      const found = invoices.find(
        (inv) => inv.invoiceNumber.trim().toUpperCase() === searchParam.trim().toUpperCase(),
      )
      if (found) {
        loadArchivedInvoice(found)
        return
      }
    }

    // Semi-automated Renewal Invoice Generation
    if (actionParam === 'generate_renewal' && listingIdParam && listings.length > 0) {
      const targetListing = listings.find((l) => l.id === listingIdParam)
      if (!targetListing) return

      const renewal = calculateRenewalDate(targetListing.datePaid, targetListing.package)
      if (!renewal) {
        setSaveStatus({
          type: 'error',
          message: `Cannot generate renewal invoice: Property "${targetListing.name}" has no recorded payment date.`,
        })
        return
      }

      // Check duplicate invoice prevention
      const existing = findExistingRenewalInvoice(targetListing.id, renewal, invoices)
      if (existing) {
        loadArchivedInvoice(existing)
        setSaveStatus({
          type: 'warning',
          message: `Invoice already generated for this renewal period (${existing.invoiceNumber}). Showing existing invoice.`,
        })
        return
      }

      // Calculate subscription price based on stored billing frequency & discounts
      const priceResult = calculateSubscriptionPrice(targetListing, pricingDiscounts, shootPlans)
      if (!priceResult.success || !priceResult.price) {
        setSaveStatus({
          type: 'error',
          message: priceResult.error || 'Subscription price is missing or ambiguous. Invoice generation aborted.',
        })
        return
      }

      // Pre-populate fields automatically from stored subscription information
      const nextNum = generateNextInvoiceNumber(invoices)
      const newInvoiceId = generateUUID()
      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
      const todayFull = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      const renewalDateStr = formatDisplayDate(renewal)
      const startDateStr = targetListing.datePaid ? formatDisplayDate(parseLocalDate(targetListing.datePaid) || new Date()) : todayFormatted

      setCurrentId(newInvoiceId)
      setInvoiceNumber(nextNum)
      setInvoiceDate(todayFormatted)
      setFullInvoiceDate(todayFull)
      setClientName(targetListing.contactName || '')
      const contactCombined = [targetListing.contactPhone, targetListing.contactEmail].filter(Boolean).join(' · ')
      setClientContact(contactCombined)
      setClientEmail(targetListing.contactEmail || '')
      setClientPhone(targetListing.contactPhone || '')
      setAccountNumber(targetListing.accountNumber || '')
      setPropertyName(targetListing.name || '')
      setPropertyLocation([targetListing.location, targetListing.city, targetListing.country].filter(Boolean).join(', '))
      setSelectedListingId(targetListing.id)
      setPropertySearchQuery(targetListing.name || '')

      const accOrNum = targetListing.accountNumber || nextNum
      setPaymentDetails(`Paybill: 247247  |  Account: ${accOrNum}`)

      // Set renewal period line item
      const freq = priceResult.billingFrequency
      setBillingFrequency(freq)
      setRenewalDate(renewalDateStr)
      setPeriodStart(startDateStr)
      setPeriodEnd(renewalDateStr)
      setInvoiceStatus('generated')

      // Find previous invoice for linkage
      const prevInvoices = invoices.filter((i) => i.listingId === targetListing.id)
      if (prevInvoices.length > 0) {
        const sorted = [...prevInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPreviousInvoiceId(sorted[0].id)
      } else {
        setPreviousInvoiceId('')
      }

      const generatedItems: FinanceItem[] = [
        {
          id: generateUUID(),
          description: `Hosting & Tour Management (${freq}) — ${targetListing.name}`,
          qty: 1,
          rate: priceResult.price,
        },
      ]
      setItems(generatedItems)
      setDiscount(0)
      setIsTaxCustom(false)
      const autoVat = Math.round(priceResult.price * 0.16)
      setTax(autoVat)

      setIsSaved(false)
      setIsEditing(true)
      originalSnapshotRef.current = null
      setActiveTab('editor')

      setSaveStatus({
        type: 'success',
        message: `Renewal invoice pre-populated automatically for ${targetListing.name} (${freq} — KES ${priceResult.price.toLocaleString()} + 16% VAT). Review and save or dispatch.`,
      })
    }
  }, [searchParams, listings, invoices, pricingDiscounts, shootPlans])

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
      const stat = (inv.status || '').toLowerCase()
      return (
        name.includes(q) ||
        contact.includes(q) ||
        num.includes(q) ||
        prop.includes(q) ||
        acc.includes(q) ||
        stat.includes(q)
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
      if (l.contactEmail) setClientEmail(l.contactEmail)
      if (l.contactPhone) setClientPhone(l.contactPhone)
      const contactParts = [l.contactPhone, l.contactEmail].filter(Boolean)
      if (contactParts.length > 0) setClientContact(contactParts.join(' · '))
      if (l.accountNumber) {
        setAccountNumber(l.accountNumber)
        setPaymentDetails(`Paybill: 247247  |  Account: ${l.accountNumber}`)
      } else {
        setAccountNumber('')
        setPaymentDetails(`Paybill: 247247  |  Account: ${invoiceNumber || 'INV-0001'}`)
      }

      // Automatically pick billing frequency from client package
      const clientFreq = normalizeBillingFrequency(l.package)
      setBillingFrequency(clientFreq)

      // Automatically set due date to be 90 days from the date the tour was paid (or frequency days)
      const dueDate = calculateDueDateFromPayment(l.datePaid, clientFreq)
      setRenewalDate(formatDisplayDate(dueDate))
      setPeriodEnd(formatDisplayDate(dueDate))
      setPeriodStart(formatDisplayDate(l.datePaid ? parseLocalDate(l.datePaid) || new Date() : new Date()))
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
    setRenewalDate('')
    setPeriodStart('')
    setPeriodEnd('')
    setPaymentDetails(`Paybill: 247247  |  Account: ${invoiceNumber || 'INV-0001'}`)
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

  function startNewInvoice() {
    const nextNum = generateNextInvoiceNumber(invoices)
    setCurrentId(generateUUID())
    setInvoiceNumber(nextNum)
    setInvoiceDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase())
    setFullInvoiceDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    setClientName('')
    setClientContact('')
    setClientEmail('')
    setClientPhone('')
    setAccountNumber('')
    setPropertyName('')
    setPropertyLocation('')
    setSelectedListingId('custom')
    setPropertySearchQuery('')
    setPaymentDetails(`Paybill: 247247  |  Account: ${nextNum}`)
    setItems([
      { id: '1', description: '3D Virtual Tour Shoot & Scanning', qty: 1, rate: 0 },
      { id: '2', description: 'Hosting & Tour Management (Quarterly)', qty: 1, rate: 0 },
    ])
    setDiscount(0)
    setIsTaxCustom(false)
    setTax(0)
    setInvoiceStatus('draft')
    setRenewalDate('')
    setPeriodStart('')
    setPeriodEnd('')
    setBillingFrequency('Monthly')
    setPreviousInvoiceId('')
    setReceiptId('')
    setSendingHistory([])
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
    setClientEmail(inv.clientEmail || '')
    setClientPhone(inv.clientPhone || '')
    setAccountNumber(inv.accountNumber || '')
    setPropertyName(inv.propertyName)
    setPropertyLocation(inv.propertyLocation)
    setSelectedListingId(inv.listingId || 'custom')
    setPropertySearchQuery(inv.propertyName || '')
    setItems(inv.items)
    setDiscount(inv.discount)
    setTax(inv.tax)
    setIsTaxCustom(true)
    setPaymentMethod(inv.paymentMethod)
    setInvoiceStatus(inv.status || 'draft')
    setBillingFrequency(inv.billingFrequency || 'Monthly')
    setRenewalDate(inv.renewalDate || '')
    setPeriodStart(inv.periodStart || '')
    setPeriodEnd(inv.periodEnd || '')
    setPreviousInvoiceId(inv.previousInvoiceId || '')
    setReceiptId(inv.receiptId || '')
    setSendingHistory(inv.sendingHistory || [])

    if (inv.accountNumber && (!inv.paymentDetails || inv.paymentDetails.includes('Account: INV-') || inv.paymentDetails.includes(`Account: ${inv.invoiceNumber}`))) {
      setPaymentDetails(`Paybill: 247247  |  Account: ${inv.accountNumber}`)
    } else {
      setPaymentDetails(inv.paymentDetails || (inv.accountNumber ? `Paybill: 247247  |  Account: ${inv.accountNumber}` : `Paybill: 247247  |  Account: ${inv.invoiceNumber}`))
    }
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

  async function handleSave(statusOverride?: InvoiceStatus, additionalHistory?: SendingLog) {
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

      const effectiveStatus: InvoiceStatus = statusOverride || (invoiceStatus === 'draft' ? 'generated' : invoiceStatus)
      const updatedHistory = additionalHistory
        ? [additionalHistory, ...(sendingHistory || [])]
        : sendingHistory || []

      const invoiceToSave: SavedInvoice = {
        id: currentId,
        invoiceNumber: numTrimmed,
        invoiceDate,
        fullInvoiceDate,
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
        totalDue,
        paymentMethod,
        paymentDetails,
        thankYouMessage,
        tagline,
        status: effectiveStatus,
        billingFrequency,
        renewalDate,
        periodStart,
        periodEnd,
        previousInvoiceId,
        receiptId,
        sendingHistory: updatedHistory,
        createdAt: originalSnapshotRef.current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveInvoice(invoiceToSave)
      originalSnapshotRef.current = invoiceToSave
      setInvoiceStatus(effectiveStatus)
      setSendingHistory(updatedHistory)
      setIsSaved(true)
      setIsEditing(false)
      setSaveStatus({
        type: 'success',
        message: `Invoice ${numTrimmed} saved successfully (Status: ${effectiveStatus}).`,
      })
      setTimeout(() => setSaveStatus(null), 5000)
      return invoiceToSave
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

  // Confirm payment & advance renewal date on property
  async function handleMarkAsPaid() {
    if (!window.confirm(`Mark invoice ${invoiceNumber} as Paid and advance the subscription renewal date?`)) {
      return
    }

    try {
      const saved = await handleSave('paid')
      if (!saved) return

      // If linked to a listing, advance the renewal date by its billing frequency
      if (selectedListingId && selectedListingId !== 'custom') {
        const listing = listings.find((l) => l.id === selectedListingId)
        if (listing) {
          const currentBaseDate = parseLocalDate(renewalDate) || (listing.datePaid ? parseLocalDate(listing.datePaid) : new Date())
          if (currentBaseDate) {
            const nextRenewal = advanceRenewalDate(currentBaseDate, billingFrequency)
            const nextIso = formatISODate(nextRenewal)
            await updateListing(listing.id, { datePaid: nextIso })

            setSaveStatus({
              type: 'success',
              message: `Payment confirmed! Invoice ${invoiceNumber} marked as Paid. Subscription for "${listing.name}" advanced to ${formatDisplayDate(nextRenewal)}.`,
            })
          }
        }
      } else {
        setSaveStatus({
          type: 'success',
          message: `Invoice ${invoiceNumber} marked as Paid.`,
        })
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'Failed to update payment status.' })
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
        type: 'invoice',
        recipientEmail: sendModalEmail.trim(),
        clientName: clientName.trim() || 'Client',
        propertyName: propertyName.trim() || 'Virtual Tour Property',
        propertyLocation,
        accountNumber,
        documentNumber: invoiceNumber,
        documentDate: invoiceDate,
        dueDateOrPaymentDate: renewalDate || fullInvoiceDate,
        billingFrequency,
        items,
        subtotal,
        discount,
        tax,
        totalAmount: totalDue,
        paymentDetailsOrRef: paymentDetails,
      }

      const res = await fetch('/api/finance/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error sending email.')
      }

      const logEntry: SendingLog = {
        id: generateUUID(),
        date: new Date().toISOString(),
        method: 'email',
        recipient: sendModalEmail.trim(),
        status: 'sent',
      }

      await handleSave('sent', logEntry)
      setIsSendModalOpen(false)
      setSaveStatus({
        type: 'success',
        message: data.message || `Invoice ${invoiceNumber} sent via email to ${sendModalEmail} from no-reply@twinspace360.com.`,
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
        message: `Email dispatch failed: ${err.message}. Invoice status was NOT marked as sent.`,
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
    const currentInvoiceSnapshot: SavedInvoice = {
      id: currentId,
      invoiceNumber,
      invoiceDate,
      fullInvoiceDate,
      clientName,
      clientContact,
      clientEmail,
      clientPhone: rawPhone,
      accountNumber,
      propertyName,
      propertyLocation,
      listingId: selectedListingId,
      items,
      discount,
      tax,
      subtotal,
      totalDue,
      paymentMethod,
      paymentDetails,
      thankYouMessage,
      tagline,
      status: 'sent',
      billingFrequency,
      renewalDate,
      createdAt: originalSnapshotRef.current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const messageText = formatWhatsAppInvoiceMessage(currentInvoiceSnapshot)
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
    window.open(waUrl, '_blank')

    const logEntry: SendingLog = {
      id: generateUUID(),
      date: new Date().toISOString(),
      method: 'whatsapp',
      recipient: rawPhone,
      status: 'prepared',
    }

    handleSave('sent', logEntry)
    setIsSendModalOpen(false)
    setSaveStatus({
      type: 'success',
      message: `Invoice ${invoiceNumber} prepared and handed off to WhatsApp. Marked as Sent.`,
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

          {/* Tab buttons: Editor vs Client History vs Archive */}
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
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-white text-ink-950 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              📊 Client History
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

            {/* Action Buttons: Save / Edit / New / Send / Paid / Export */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border ${
                  invoiceStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : invoiceStatus === 'sent'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : invoiceStatus === 'overdue'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : invoiceStatus === 'generated'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-ink-50 text-ink-600 border-ink-200'
                }`}
              >
                {invoiceStatus}
              </span>

              {isSaved && !isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 shadow-sm"
                  >
                    ✏️ Edit
                  </Button>

                  {/* Send Invoice Modal Trigger */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openSendModal}
                    className="gap-1.5 shadow-sm bg-brand-50 text-brand-800 hover:bg-brand-100 border-brand-200"
                  >
                    📤 Send
                  </Button>

                  {/* Mark as Paid */}
                  {invoiceStatus !== 'paid' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMarkAsPaid}
                      className="gap-1.5 shadow-sm bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                    >
                      💰 Mark Paid
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/admin/receipt?invoiceId=${currentId}&action=generate_receipt`)}
                      className="gap-1.5 shadow-sm bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200"
                    >
                      🧾 Receipt
                    </Button>
                  )}

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
                    onClick={() => handleSave()}
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

      {/* ── CLIENT & SUBSCRIPTION HISTORY VIEW ── */}
      {activeTab === 'history' && (
        <div className="no-print space-y-6">
          <div className="rounded-2xl border border-ink-950/10 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink-950">Client Invoice &amp; Subscription History</h2>
            <p className="text-xs text-ink-500 mt-1">
              Select a property or client to view their financial lifecycle, invoices, receipts, and dispatch logs.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <select
                value={historySelectedListingId}
                onChange={(e) => setHistorySelectedListingId(e.target.value)}
                className="rounded-xl border border-ink-950/15 bg-paper px-3.5 py-2 text-xs font-medium text-ink-900 shadow-soft focus:border-brand-500 focus:outline-none"
              >
                <option value="">-- Choose a property/client --</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.contactName ? `(${l.contactName})` : ''} — {l.accountNumber || 'No Acc'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {historySelectedListingId ? (
            (() => {
              const currentListing = listings.find((l) => l.id === historySelectedListingId)
              if (!currentListing) return null

              const clientInvoices = invoices.filter((i) => i.listingId === currentListing.id)
              const clientReceipts = receipts.filter((r) => r.listingId === currentListing.id)
              const renDate = calculateRenewalDate(currentListing.datePaid, currentListing.package)

              return (
                <div className="space-y-6">
                  {/* Summary Profile */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-ink-950/10 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Client Profile</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">{currentListing.contactName || 'Valued Client'}</p>
                      <p className="text-xs text-ink-600">{currentListing.contactEmail || 'No email'}</p>
                      <p className="text-xs text-ink-500">{currentListing.contactPhone || 'No phone'}</p>
                    </div>

                    <div className="rounded-xl border border-ink-950/10 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Property &amp; Account</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">{currentListing.name}</p>
                      <p className="text-xs text-ink-500">{currentListing.location || currentListing.city}</p>
                      <p className="text-xs font-mono font-bold text-brand-600 mt-1">
                        Account: {currentListing.accountNumber || 'Unassigned'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-950/10 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Subscription Status</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">
                        {normalizeBillingFrequency(currentListing.package)} Package
                      </p>
                      <p className="text-xs text-ink-600">
                        Next Renewal: <strong className="text-brand-700">{renDate ? formatDisplayDate(renDate) : 'Not recorded'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Invoices Table */}
                  <div className="overflow-hidden rounded-xl border border-ink-950/10 bg-white shadow-soft">
                    <div className="border-b border-ink-950/10 bg-sand-100/40 px-5 py-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-800">
                        Invoices for this Subscription ({clientInvoices.length})
                      </h3>
                    </div>
                    {clientInvoices.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-ink-950/8 bg-ink-50/50 text-left text-ink-400">
                              <th className="py-2.5 px-4 font-semibold uppercase">Invoice #</th>
                              <th className="py-2.5 px-4 font-semibold uppercase">Date</th>
                              <th className="py-2.5 px-4 font-semibold uppercase">Period / Renewal</th>
                              <th className="py-2.5 px-4 font-semibold uppercase text-right">Amount</th>
                              <th className="py-2.5 px-4 font-semibold uppercase text-center">Status</th>
                              <th className="py-2.5 px-4 font-semibold uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-950/6">
                            {clientInvoices
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((inv) => (
                                <tr key={inv.id} className="hover:bg-sand-100/30">
                                  <td className="py-3 px-4 font-mono font-bold text-ink-950">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-3 px-4 text-ink-600">{inv.invoiceDate}</td>
                                  <td className="py-3 px-4 text-ink-700">
                                    {inv.renewalDate || inv.billingFrequency || 'Standard'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold text-ink-950">
                                    KSh {formatMoney(inv.totalDue)}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        inv.status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : inv.status === 'sent'
                                            ? 'bg-blue-100 text-blue-800'
                                            : inv.status === 'generated'
                                              ? 'bg-purple-100 text-purple-800'
                                              : 'bg-ink-100 text-ink-600'
                                      }`}
                                    >
                                      {inv.status || 'draft'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => loadArchivedInvoice(inv)}
                                      className="text-brand-600 hover:text-brand-800 font-semibold"
                                    >
                                      View
                                    </button>
                                    {inv.status === 'paid' && (
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/admin/receipt?invoiceId=${inv.id}&action=generate_receipt`)}
                                        className="text-purple-600 hover:text-purple-800 font-semibold"
                                      >
                                        Receipt
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="p-6 text-center text-xs text-ink-400">No invoices generated yet for this property.</p>
                    )}
                  </div>

                  {/* Linked Receipts Table */}
                  <div className="overflow-hidden rounded-xl border border-ink-950/10 bg-white shadow-soft">
                    <div className="border-b border-ink-950/10 bg-sand-100/40 px-5 py-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-800">
                        Payment Receipts ({clientReceipts.length})
                      </h3>
                    </div>
                    {clientReceipts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-ink-950/8 bg-ink-50/50 text-left text-ink-400">
                              <th className="py-2.5 px-4 font-semibold uppercase">Receipt #</th>
                              <th className="py-2.5 px-4 font-semibold uppercase">Date</th>
                              <th className="py-2.5 px-4 font-semibold uppercase">Invoice Ref</th>
                              <th className="py-2.5 px-4 font-semibold uppercase text-right">Amount Paid</th>
                              <th className="py-2.5 px-4 font-semibold uppercase">Method</th>
                              <th className="py-2.5 px-4 font-semibold uppercase text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-950/6">
                            {clientReceipts.map((rec) => (
                              <tr key={rec.id} className="hover:bg-sand-100/30">
                                <td className="py-3 px-4 font-mono font-bold text-ink-950">{rec.receiptNumber}</td>
                                <td className="py-3 px-4 text-ink-600">{rec.receiptDate}</td>
                                <td className="py-3 px-4 text-ink-700">{rec.invoiceNumber || '—'}</td>
                                <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                                  KSh {formatMoney(rec.totalPaid)}
                                </td>
                                <td className="py-3 px-4 text-ink-600">{rec.paymentMethod}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/receipt?search=${encodeURIComponent(rec.receiptNumber)}`)}
                                    className="text-brand-600 hover:text-brand-800 font-semibold"
                                  >
                                    View Receipt
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="p-6 text-center text-xs text-ink-400">No payment receipts recorded yet.</p>
                    )}
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="rounded-2xl border border-dashed border-ink-950/15 p-12 text-center text-xs text-ink-400">
              Please choose a property from the dropdown above to view its full subscription and invoice history.
            </div>
          )}
        </div>
      )}

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
                placeholder="Search archive by contact name, number, property, or invoice number..."
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
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'generated'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-ink-100 text-ink-600'
                        }`}
                      >
                        {inv.status || 'draft'}
                      </span>
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
                    const val = e.target.value
                    setInvoiceNumber(val)
                    if (!accountNumber) {
                      setPaymentDetails(`Paybill: 247247  |  Account: ${val}`)
                    }
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

          {/* ── MIDDLE SECTION: INVOICE DATE + RENEWAL + BILLED TO + PROPERTY ── */}
          <div className="py-5 sm:py-6 print:py-5 border-b border-ink-950/12 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 print:gap-6">
            {/* Left Column: Dates & Subscription Info */}
            <div className="space-y-4 print:space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
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

              {/* DUE DATE */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                  DUE DATE
                </p>
                <input
                  type="text"
                  placeholder="e.g. 30 September 2026"
                  value={renewalDate}
                  disabled={!isEditing}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full text-sm print:text-sm font-semibold text-brand-700 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90"
                />
                <p className="mt-0.5 text-[10px] text-ink-400 print:hidden">
                  {getFrequencyDays(billingFrequency)} days from tour payment date
                </p>
              </div>

              {/* BILLING FREQUENCY */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                  BILLING FREQUENCY
                </p>
                {isEditing ? (
                  <select
                    value={billingFrequency}
                    onChange={(e) => {
                      const newFreq = e.target.value as BillingFrequency
                      setBillingFrequency(newFreq)
                      const target = listings.find((l) => l.id === selectedListingId)
                      const dueDate = calculateDueDateFromPayment(target?.datePaid, newFreq)
                      setRenewalDate(formatDisplayDate(dueDate))
                      setPeriodEnd(formatDisplayDate(dueDate))
                    }}
                    className="w-full text-xs font-semibold text-ink-900 bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none pb-0.5"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Biannual">Biannual (6 Months)</option>
                    <option value="Annual">Annual (12 Months)</option>
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-ink-900">{billingFrequency}</p>
                )}
              </div>
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
                              placeholder="0"
                              value={item.rate === 0 ? '' : item.rate}
                              disabled={!isEditing}
                              onChange={(e) => updateItem(item.id, 'rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
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
                    placeholder="0"
                    value={discount === 0 ? '' : discount}
                    disabled={!isEditing}
                    onChange={(e) => setDiscount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    className="w-20 print:w-20 text-right text-xs sm:text-sm print:text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                  />
                </div>
              </div>

              {/* Tax / VAT */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs print:text-xs font-medium text-ink-500">
                    Tax / VAT {!isTaxCustom ? '(16%)' : ''}:
                  </span>
                  {isEditing && (
                    <div className="no-print flex items-center gap-1">
                      {!isTaxCustom ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTax(0)
                            setIsTaxCustom(true)
                          }}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-400 hover:text-amber-700 hover:bg-amber-50 border border-ink-950/10 transition-colors"
                          title="Omit VAT from this invoice"
                        >
                          Omit
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTaxCustom(false)
                            setTax(Math.round(subtotal * 0.16))
                          }}
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/60 transition-colors"
                          title="Recalculate automatic 16% VAT"
                        >
                          Auto 16%
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-[11px] print:text-xs text-ink-400">+ KSh</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={tax === 0 ? '' : tax}
                    disabled={!isEditing}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
                      setTax(isNaN(val) ? 0 : val)
                      setIsTaxCustom(true)
                    }}
                    className="w-20 print:w-20 text-right text-xs sm:text-sm print:text-sm text-ink-800 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none disabled:opacity-90"
                    title={isTaxCustom ? 'Custom VAT amount (editable)' : 'Automatic 16% VAT (editable)'}
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

      {/* ── MODAL: SEND INVOICE VIA EMAIL / WHATSAPP ── */}
      {isSendModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-ink-950/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-950/8 pb-3">
              <h3 className="text-base font-semibold text-ink-950">Send Invoice {invoiceNumber}</h3>
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
                  <p className="mt-1 text-[10px] text-ink-400">
                    Credentials remain securely server-side.
                  </p>
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
                  <p><strong>Subject:</strong> Twinspace Invoice – {invoiceNumber}</p>
                  <p><strong>Property:</strong> {propertyName}</p>
                  <p><strong>Amount:</strong> KSh {formatMoney(totalDue)}</p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSendModalOpen(false)}
                    disabled={isSendingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="bg-ink-950 text-white hover:bg-ink-900"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send via Email'}
                  </Button>
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
                  <p className="mt-1 text-[10px] text-ink-400">
                    Opens WhatsApp Web / App handoff with a formatted invoice breakdown.
                  </p>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg bg-ink-50 p-2.5 font-mono text-[10px] text-ink-700 whitespace-pre-wrap">
                  {formatWhatsAppInvoiceMessage({
                    id: currentId,
                    invoiceNumber,
                    invoiceDate,
                    fullInvoiceDate,
                    clientName,
                    clientContact,
                    accountNumber,
                    propertyName,
                    propertyLocation,
                    items,
                    discount,
                    tax,
                    subtotal,
                    totalDue,
                    paymentMethod,
                    paymentDetails,
                    thankYouMessage,
                    tagline,
                    renewalDate,
                    billingFrequency,
                    createdAt: '',
                    updatedAt: '',
                  })}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSendModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Open WhatsApp Handoff
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
