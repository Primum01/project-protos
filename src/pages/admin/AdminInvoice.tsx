import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAdminFinance, useAdminListings } from '@/contexts/AdminDataContext'
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
  calculateRenewalDate,
  calculateSubscriptionPrice,
  findExistingRenewalInvoice,
  formatDisplayDate,
  formatISODate,
  formatWhatsAppInvoiceMessage,
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
    description: 'Create, archive, and export professional client invoices with automated renewal detection.',
    path: '/admin/invoice',
    noIndex: true,
  })

  // Pricing plans and discounts for price calculations
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

  // Status & Semi-Automated Renewal Fields
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

  // Archive Search Filter
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
          message: `Invoice already generated for this renewal period (${existing.invoiceNumber}). Duplicate invoice generation prevented.`,
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

  // Filter saved archive invoices
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

      // Check if this property has a renewal date
      if (l.datePaid) {
        const ren = calculateRenewalDate(l.datePaid, l.package)
        if (ren) {
          setRenewalDate(formatDisplayDate(ren))
          setPeriodEnd(formatDisplayDate(ren))
          setPeriodStart(formatDisplayDate(parseLocalDate(l.datePaid) || new Date()))
        }
      }
      setBillingFrequency(normalizeBillingFrequency(l.package))
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

      // Uniqueness check for invoice number
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
    // Extract default email and phone if clientContact contains them
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

      // Record dispatch success in history
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
      // Record failure in history
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

    // Record preparation / handoff
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
      {/* ── Screen Action Header & Tabs ── */}
      <div className="no-print mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                Finance
              </span>
              <span className="text-xs text-ink-400">· Invoice & Subscription Renewal</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-ink-950">
              Invoice Management
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs text-ink-500 leading-relaxed">
              Create manual invoices, auto-generate renewal invoices, track payment status, and dispatch via Email &amp; WhatsApp.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-ink-950/5 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-ink-950 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-950'
              }`}
            >
              📄 Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
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

        {/* Status Notification Alerts */}
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

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: INVOICE EDITOR & PREVIEW                                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'editor' && (
        <>
          {/* Editor Action Bar */}
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-950/8 bg-white p-3 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-400 font-medium">Status:</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  invoiceStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : invoiceStatus === 'sent'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : invoiceStatus === 'overdue'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : invoiceStatus === 'generated'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-ink-100 text-ink-700 border border-ink-200'
                }`}
              >
                {invoiceStatus}
              </span>

              {renewalDate && (
                <span className="text-xs text-ink-500 ml-2">
                  Renewal Due: <strong className="text-ink-800">{renewalDate}</strong> ({billingFrequency})
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
                    ✏️ Edit Invoice
                  </button>

                  {/* Dispatch / Send Options */}
                  <button
                    type="button"
                    onClick={openSendModal}
                    className="rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 text-xs font-medium text-brand-800 shadow-soft"
                  >
                    📤 Send Invoice
                  </button>

                  {/* Mark as Paid */}
                  {invoiceStatus !== 'paid' ? (
                    <button
                      type="button"
                      onClick={handleMarkAsPaid}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-soft"
                    >
                      💰 Mark as Paid
                    </button>
                  ) : (
                    /* Generate Receipt from Paid Invoice */
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/receipt?invoiceId=${currentId}&action=generate_receipt`)}
                      className="rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-800 shadow-soft"
                    >
                      🧾 Generate Receipt
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    className="rounded-lg bg-ink-950 hover:bg-ink-900 text-white px-3.5 py-1.5 text-xs font-medium shadow-soft"
                  >
                    💾 Save Invoice
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
                onClick={startNewInvoice}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                + New Invoice
              </button>
            </div>
          </div>

          {/* Property Selection / Pre-fill Selector */}
          <div className="no-print mb-6 rounded-2xl border border-ink-950/8 bg-white p-4 shadow-soft">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              Auto-fill from Property / Client Subscription
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
                    ✏️ Manual / Custom Client (Enter details manually)
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
                        {l.package && <span className="uppercase text-[10px] bg-ink-100 px-1 rounded">{l.package}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── A4 Printable Document Layout ── */}
          <div className="relative overflow-hidden rounded-2xl border border-ink-950/8 bg-white p-6 sm:p-10 shadow-soft print:border-none print:shadow-none print:p-8">
            <SheetDiaspaceWatermark />

            {/* Document Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b border-ink-950/8 pb-6">
              <div>
                <span className="font-display text-2xl font-bold tracking-tight text-ink-950">TWINSPACE</span>
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                  Virtual Tours &amp; Digital Twins
                </span>
                <p className="mt-2 text-xs text-ink-500">
                  Nairobi, Kenya &bull; info@twinspace360.com &bull; +254 700 000 000
                </p>
              </div>

              <div className="sm:text-right">
                <span className="inline-block rounded-full bg-ink-950 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  INVOICE
                </span>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex sm:justify-end gap-2 text-ink-600">
                    <span className="text-ink-400">Invoice #:</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                      className="font-mono font-bold text-ink-950 disabled:bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none w-28 text-right"
                    />
                  </div>
                  <div className="flex sm:justify-end gap-2 text-ink-600">
                    <span className="text-ink-400">Date:</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="font-medium text-ink-900 disabled:bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none w-28 text-right"
                    />
                  </div>
                  {renewalDate && (
                    <div className="flex sm:justify-end gap-2 text-ink-600">
                      <span className="text-ink-400">Due Date:</span>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        className="font-semibold text-brand-700 disabled:bg-transparent border-b border-dashed border-ink-300 focus:border-brand-500 focus:outline-none w-28 text-right"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Billed To / Property Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold uppercase tracking-wider text-ink-400 text-[10px]">Billed To</p>
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
                <p className="font-semibold uppercase tracking-wider text-ink-400 text-[10px]">Payment Instructions</p>
                <div className="rounded-xl border border-ink-950/8 bg-ink-50/50 p-3 text-xs">
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    className="w-full font-semibold text-ink-900 disabled:bg-transparent focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-ink-500">
                    Use M-Pesa Paybill with your unique property Account ID for instant receipt reconciliation.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-ink-900">KES {formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-ink-600">
                  <span className="flex items-center gap-1">
                    VAT (16%):
                    {isEditing && (
                      <span className="text-[10px] text-ink-400 no-print">(auto-computed)</span>
                    )}
                  </span>
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
                  <span>Total Amount Due:</span>
                  <span className="text-brand-600 text-base">KES {formatMoney(totalDue)}</span>
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

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CLIENT & SUBSCRIPTION HISTORY                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="no-print space-y-6">
          {/* Client / Property Selector */}
          <div className="rounded-2xl border border-ink-950/8 bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-ink-950">Client Invoice &amp; Subscription History</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Select a property or client to view their complete financial lifecycle, invoice history, payment receipts, and dispatch logs.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <select
                value={historySelectedListingId}
                onChange={(e) => setHistorySelectedListingId(e.target.value)}
                className="rounded-xl border border-ink-950/12 bg-white px-3.5 py-2 text-xs font-medium text-ink-900 shadow-soft focus:border-brand-500 focus:outline-none"
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

          {/* Client Details Card */}
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
                    <div className="rounded-xl border border-ink-950/8 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Client Profile</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">{currentListing.contactName || 'Valued Client'}</p>
                      <p className="text-xs text-ink-600">{currentListing.contactEmail || 'No email'}</p>
                      <p className="text-xs text-ink-500">{currentListing.contactPhone || 'No phone'}</p>
                    </div>

                    <div className="rounded-xl border border-ink-950/8 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Property &amp; Account</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">{currentListing.name}</p>
                      <p className="text-xs text-ink-500">{currentListing.location || currentListing.city}</p>
                      <p className="text-xs font-mono font-bold text-brand-600 mt-1">
                        Account: {currentListing.accountNumber || 'Unassigned'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-950/8 bg-white p-4 shadow-soft">
                      <span className="text-[10px] font-semibold uppercase text-ink-400">Subscription Status</span>
                      <p className="mt-1 font-semibold text-sm text-ink-950">
                        {normalizeBillingFrequency(currentListing.package)} Package
                      </p>
                      <p className="text-xs text-ink-600">
                        Next Renewal: <strong className="text-brand-700">{renDate ? formatDisplayDate(renDate) : 'Not recorded'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Invoices History Table */}
                  <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-white shadow-soft">
                    <div className="border-b border-ink-950/8 bg-ink-50/50 px-5 py-3 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                        Invoices for this Subscription ({clientInvoices.length})
                      </h3>
                    </div>
                    {clientInvoices.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-ink-950/8 bg-ink-50/30 text-left text-ink-400">
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
                                <tr key={inv.id} className="hover:bg-ink-50/50">
                                  <td className="py-3 px-4 font-mono font-bold text-ink-950">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-3 px-4 text-ink-600">{inv.invoiceDate}</td>
                                  <td className="py-3 px-4 text-ink-700">
                                    {inv.renewalDate || inv.billingFrequency || 'Standard'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold text-ink-950">
                                    KES {formatMoney(inv.totalDue)}
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
                  <div className="overflow-hidden rounded-xl border border-ink-950/8 bg-white shadow-soft">
                    <div className="border-b border-ink-950/8 bg-ink-50/50 px-5 py-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                        Payment Receipts ({clientReceipts.length})
                      </h3>
                    </div>
                    {clientReceipts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-ink-950/8 bg-ink-50/30 text-left text-ink-400">
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
                              <tr key={rec.id} className="hover:bg-ink-50/50">
                                <td className="py-3 px-4 font-mono font-bold text-ink-950">{rec.receiptNumber}</td>
                                <td className="py-3 px-4 text-ink-600">{rec.receiptDate}</td>
                                <td className="py-3 px-4 text-ink-700">{rec.invoiceNumber || '—'}</td>
                                <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                                  KES {formatMoney(rec.totalPaid)}
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

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: ARCHIVE LIST                                                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'archive' && (
        <div className="no-print space-y-4">
          <div className="rounded-2xl border border-ink-950/8 bg-white p-4 shadow-soft flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search archive by client, property, invoice number, or status..."
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
                    <th className="py-3 px-4 font-semibold uppercase">Invoice #</th>
                    <th className="py-3 px-4 font-semibold uppercase">Date</th>
                    <th className="py-3 px-4 font-semibold uppercase">Client</th>
                    <th className="py-3 px-4 font-semibold uppercase">Property</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/6">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-ink-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-ink-950">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-ink-600">{inv.invoiceDate}</td>
                      <td className="py-3 px-4 font-medium text-ink-900">{inv.clientName || '—'}</td>
                      <td className="py-3 px-4 text-ink-700">{inv.propertyName || '—'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-ink-950">KES {formatMoney(inv.totalDue)}</td>
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
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => loadArchivedInvoice(inv, true)}
                          className="text-ink-600 hover:text-ink-950 font-semibold"
                        >
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArchived(inv.id, inv.invoiceNumber)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-ink-400">
                        No invoices found in archive.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: SEND INVOICE VIA EMAIL / WHATSAPP                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
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
                  <p><strong>Amount:</strong> KES {formatMoney(totalDue)}</p>
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
                    className="rounded-lg bg-ink-950 hover:bg-ink-900 text-white px-3.5 py-1.5 text-xs font-medium disabled:opacity-50 shadow-soft"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send via Email'}
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
