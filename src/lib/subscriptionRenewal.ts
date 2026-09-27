import type { BillingFrequency, SavedInvoice, SavedReceipt } from '../types/finance'
import type { Listing, SubscriptionPackage } from '../types/listing'
import type { PricingDiscounts, ShootPricingPlan } from './pricingConstants.ts'
import { DEFAULT_PRICING_DISCOUNTS, DEFAULT_SHOOT_PRICING } from './pricingConstants.ts'

/**
 * Safely parse a date string (YYYY-MM-DD or full date string) into a Date object at local midnight.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const trimmed = dateStr.trim()
  if (!trimmed) return null

  // Check YYYY-MM-DD format
  const ymdParts = trimmed.split('-').map(Number)
  if (ymdParts.length === 3 && !ymdParts.some(isNaN)) {
    return new Date(ymdParts[0], ymdParts[1] - 1, ymdParts[2])
  }

  // Fallback to standard Date parse
  const parsed = new Date(trimmed)
  if (isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD).
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format a Date to standard UK display date (e.g., "30 Sep 2026").
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a Date to standard full UK display date (e.g., "30 September 2026").
 */
export function formatFullDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Normalize subscription package or string to canonical BillingFrequency.
 */
export function normalizeBillingFrequency(pkg?: SubscriptionPackage | string | null): BillingFrequency {
  if (!pkg) return 'Monthly'
  const lower = pkg.toLowerCase()
  if (lower.includes('quarter')) return 'Quarterly'
  if (lower.includes('biannual') || lower.includes('semi')) return 'Biannual'
  if (lower.includes('annual') || lower.includes('year')) return 'Annual'
  return 'Monthly'
}

/**
 * Number of months for each billing frequency.
 */
export function getFrequencyMonths(freq: BillingFrequency | SubscriptionPackage | string): number {
  const normalized = normalizeBillingFrequency(freq)
  switch (normalized) {
    case 'Quarterly':
      return 3
    case 'Biannual':
      return 6
    case 'Annual':
      return 12
    case 'Monthly':
    default:
      return 1
  }
}

/**
 * Add N months to a date, correctly preserving day-of-month or clamping to end of month.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const targetDay = result.getDate()
  result.setMonth(result.getMonth() + months)

  // If month overflowed (e.g. Jan 31 + 1 month became March 2/3), clamp to last day of previous month
  if (result.getDate() !== targetDay) {
    result.setDate(0)
  }
  return result
}

/**
 * Calculate the next renewal date based on the client's payment start date and billing frequency.
 */
export function calculateRenewalDate(
  datePaid: string | null | undefined,
  pkg?: SubscriptionPackage | string | null,
): Date | null {
  const paid = parseLocalDate(datePaid)
  if (!paid) return null

  const months = getFrequencyMonths(pkg || 'monthly')
  return addMonths(paid, months)
}

/**
 * Calculate days remaining until target date from today (local start-of-day).
 */
export function daysUntil(targetDate: Date, fromDate: Date = new Date()): number {
  const today = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const diffMs = target.getTime() - today.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determine if a subscription is eligible for "Generate Invoice".
 * Trigger condition: 3 days before renewal date or overdue (days <= 3).
 * Must not trigger prematurely (e.g., > 3 days).
 */
export function isEligibleForRenewalInvoice(
  renewalDate: Date | null,
  fromDate: Date = new Date(),
): { eligible: boolean; days: number | null; isOverdue: boolean } {
  if (!renewalDate) {
    return { eligible: false, days: null, isOverdue: false }
  }

  const days = daysUntil(renewalDate, fromDate)
  const isOverdue = days < 0
  const eligible = days <= 3

  return { eligible, days, isOverdue }
}

/**
 * Check if an invoice has already been generated for this renewal period to prevent duplicates.
 */
export function findExistingRenewalInvoice(
  listingId: string,
  renewalDate: Date,
  invoices: SavedInvoice[],
): SavedInvoice | null {
  if (!listingId || !renewalDate || !invoices.length) return null

  const targetIso = formatISODate(renewalDate)
  const targetDisplay = formatDisplayDate(renewalDate).toLowerCase()
  const targetFullDisplay = formatFullDisplayDate(renewalDate).toLowerCase()

  for (const inv of invoices) {
    if (inv.listingId !== listingId) continue

    // Direct match on stored renewalDate or periodEnd
    if (inv.renewalDate) {
      const invIso = parseLocalDate(inv.renewalDate)
      if (invIso && formatISODate(invIso) === targetIso) return inv
      const invLower = inv.renewalDate.trim().toLowerCase()
      if (invLower === targetDisplay || invLower === targetFullDisplay) return inv
    }

    if (inv.periodEnd) {
      const invIso = parseLocalDate(inv.periodEnd)
      if (invIso && formatISODate(invIso) === targetIso) return inv
      const invLower = inv.periodEnd.trim().toLowerCase()
      if (invLower === targetDisplay || invLower === targetFullDisplay) return inv
    }
  }

  return null
}

/**
 * Calculate the correct price for a subscription based on billing frequency and discounts.
 * Stops and flags an error if subscription price is missing or ambiguous.
 */
export function calculateSubscriptionPrice(
  listing: Listing,
  discounts: PricingDiscounts = DEFAULT_PRICING_DISCOUNTS,
  shootPlans: ShootPricingPlan[] = DEFAULT_SHOOT_PRICING,
): {
  success: boolean
  price?: number
  rawMonthly?: number
  billingFrequency: BillingFrequency
  months: number
  discountPct: number
  discountAmount: number
  error?: string
} {
  const billingFrequency = normalizeBillingFrequency(listing.package)
  const months = getFrequencyMonths(billingFrequency)

  // 1. Try resolving monthly price from listing.price
  let monthlyPrice: number | null = null
  if (listing.price) {
    const digits = String(listing.price).replace(/[^\d]/g, '')
    if (digits) {
      const val = parseInt(digits, 10)
      if (!isNaN(val) && val > 0) {
        monthlyPrice = val
      }
    }
  }

  // 2. If listing.price is empty, fallback to shoot plan tier by bedroom count if unambiguous
  if (!monthlyPrice && typeof listing.bedrooms === 'number') {
    const planId: ShootPricingPlan['id'] =
      listing.bedrooms <= 0 ? 'studio' : listing.bedrooms === 1 ? '1-bedroom' : '2-bedroom'
    const plan = shootPlans.find((p) => p.id === planId)
    if (plan && plan.price) {
      const digits = plan.price.replace(/[^\d]/g, '')
      if (digits) {
        const val = parseInt(digits, 10)
        if (!isNaN(val) && val > 0) {
          monthlyPrice = val
        }
      }
    }
  }

  // 3. If price is missing or ambiguous, do NOT proceed with invalid price
  if (!monthlyPrice || monthlyPrice <= 0) {
    return {
      success: false,
      billingFrequency,
      months,
      discountPct: 0,
      discountAmount: 0,
      error: `Subscription price is missing or ambiguous for "${listing.name}". Please configure a valid price for the property before generating an invoice.`,
    }
  }

  // 4. Calculate discount based on frequency
  let discountPct = 0
  if (billingFrequency === 'Quarterly') {
    discountPct = discounts.quarterly ?? 10
  } else if (billingFrequency === 'Biannual') {
    discountPct = discounts.semiAnnually ?? 15
  } else if (billingFrequency === 'Annual') {
    discountPct = discounts.annually ?? 20
  }

  const rawTotal = monthlyPrice * months
  const discountAmount = Math.round(rawTotal * (discountPct / 100))
  const finalPrice = Math.max(0, rawTotal - discountAmount)

  return {
    success: true,
    price: finalPrice,
    rawMonthly: monthlyPrice,
    billingFrequency,
    months,
    discountPct,
    discountAmount,
  }
}

/**
 * Advance a renewal date by its billing frequency upon confirmed payment.
 * E.g., Monthly: 30 Sep -> 30 Oct; Quarterly: 30 Sep -> 30 Dec; Annual: 30 Sep 2026 -> 30 Sep 2027.
 */
export function advanceRenewalDate(
  currentRenewalDate: Date,
  frequency: BillingFrequency | SubscriptionPackage | string,
): Date {
  const months = getFrequencyMonths(frequency)
  return addMonths(currentRenewalDate, months)
}

/**
 * Format a professional, ready-to-send WhatsApp message for an invoice.
 */
export function formatWhatsAppInvoiceMessage(invoice: SavedInvoice): string {
  const num = invoice.invoiceNumber || 'INV-0001'
  const itemsText = (invoice.items || [])
    .map((item) => `• ${item.description} (x${item.qty}) — KES ${(item.qty * item.rate).toLocaleString('en-KE')}`)
    .join('\n')

  return `*TWINSPACE VIRTUAL TOURS — INVOICE*
━━━━━━━━━━━━━━━━━━━━━
*Invoice Number:* ${num}
*Invoice Date:* ${invoice.invoiceDate || formatDisplayDate(new Date())}
*Due Date:* ${invoice.renewalDate || 'Upon Receipt'}

*Client:* ${invoice.clientName || 'Valued Client'}
*Property:* ${invoice.propertyName || 'Virtual Tour Property'}
${invoice.propertyLocation ? `*Location:* ${invoice.propertyLocation}\n` : ''}*Account ID:* ${invoice.accountNumber || num}
${invoice.billingFrequency ? `*Billing Period:* ${invoice.billingFrequency}\n` : ''}
*Services / Charges:*
${itemsText}

*Subtotal:* KES ${(invoice.subtotal || 0).toLocaleString('en-KE')}
${invoice.discount ? `*Discount:* -KES ${(invoice.discount || 0).toLocaleString('en-KE')}\n` : ''}${invoice.tax ? `*VAT (16%):* KES ${(invoice.tax || 0).toLocaleString('en-KE')}\n` : ''}*TOTAL AMOUNT DUE:* KES ${(invoice.totalDue || 0).toLocaleString('en-KE')}

*Payment Details:*
${invoice.paymentDetails || 'Paybill: 247247  |  Account: ' + (invoice.accountNumber || num)}

━━━━━━━━━━━━━━━━━━━━━
${invoice.thankYouMessage || 'Thank you for choosing TwinSpace.'}
${invoice.tagline || 'Immersive spaces. Extraordinary experiences.'}`
}

/**
 * Format a professional, ready-to-send WhatsApp message for a payment receipt.
 */
export function formatWhatsAppReceiptMessage(receipt: SavedReceipt): string {
  const num = receipt.receiptNumber || 'REC-0001'
  const itemsText = (receipt.items || [])
    .map((item) => `• ${item.description} (x${item.qty}) — KES ${(item.qty * item.rate).toLocaleString('en-KE')}`)
    .join('\n')

  return `*TWINSPACE VIRTUAL TOURS — PAYMENT RECEIPT*
━━━━━━━━━━━━━━━━━━━━━
*Receipt Number:* ${num}
${receipt.invoiceNumber ? `*Invoice Ref:* ${receipt.invoiceNumber}\n` : ''}*Payment Date:* ${receipt.receiptDate || formatDisplayDate(new Date())}

*Client:* ${receipt.clientName || 'Valued Client'}
*Property:* ${receipt.propertyName || 'Virtual Tour Property'}
${receipt.propertyLocation ? `*Location:* ${receipt.propertyLocation}\n` : ''}*Account ID:* ${receipt.accountNumber || num}
*Payment Method:* ${receipt.paymentMethod || 'M-Pesa'}
${receipt.transactionRef ? `*Transaction Ref:* ${receipt.transactionRef}\n` : ''}
*Items Paid:*
${itemsText}

*TOTAL AMOUNT PAID:* KES ${(receipt.totalPaid || 0).toLocaleString('en-KE')}
*Payment Status:* CONFIRMED / PAID

━━━━━━━━━━━━━━━━━━━━━
${receipt.thankYouMessage || 'Thank you for choosing TwinSpace.'}
${receipt.tagline || 'Immersive spaces. Extraordinary experiences.'}`
}
