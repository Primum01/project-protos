import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Import functions to test (transpiled / equivalent or pure JS helper tests)
import {
  parseLocalDate,
  formatISODate,
  formatDisplayDate,
  formatFullDisplayDate,
  normalizeBillingFrequency,
  getFrequencyMonths,
  addMonths,
  calculateRenewalDate,
  calculateDueDateFromPayment,
  calculateRenewalDateFromPayment,
  getFrequencyDays,
  addDays,
  daysUntil,
  isEligibleForRenewalInvoice,
  findExistingRenewalInvoice,
  calculateSubscriptionPrice,
  advanceRenewalDate,
  formatWhatsAppInvoiceMessage,
  formatWhatsAppReceiptMessage,
} from '../src/lib/subscriptionRenewal.ts'

describe('Subscription Renewal System Tests', () => {
  describe('Date Parsing & Formatting', () => {
    it('correctly parses YYYY-MM-DD string without timezone drift', () => {
      const d = parseLocalDate('2026-09-30')
      assert.ok(d)
      assert.equal(d.getFullYear(), 2026)
      assert.equal(d.getMonth(), 8) // 0-indexed September
      assert.equal(d.getDate(), 30)
    })

    it('formats date to ISO string', () => {
      const d = new Date(2026, 8, 30)
      assert.equal(formatISODate(d), '2026-09-30')
    })

    it('formats date to standard UK display format', () => {
      const d = new Date(2026, 8, 30)
      assert.equal(formatDisplayDate(d), '30 Sept 2026')
    })
  })

  describe('Billing Frequency & Month Calculation', () => {
    it('normalizes various casing and synonyms', () => {
      assert.equal(normalizeBillingFrequency('monthly'), 'Monthly')
      assert.equal(normalizeBillingFrequency('Quarterly'), 'Quarterly')
      assert.equal(normalizeBillingFrequency('biannual'), 'Biannual')
      assert.equal(normalizeBillingFrequency('semi-annually'), 'Biannual')
      assert.equal(normalizeBillingFrequency('annually'), 'Annual')
      assert.equal(normalizeBillingFrequency(undefined), 'Monthly')
    })

    it('returns correct month intervals', () => {
      assert.equal(getFrequencyMonths('Monthly'), 1)
      assert.equal(getFrequencyMonths('Quarterly'), 3)
      assert.equal(getFrequencyMonths('Biannual'), 6)
      assert.equal(getFrequencyMonths('Annual'), 12)
    })

    it('adds months preserving day of month and handles month end capping', () => {
      const start = new Date(2026, 0, 31) // Jan 31
      const plus1 = addMonths(start, 1) // Feb has 28 days in 2026
      assert.equal(plus1.getMonth(), 1) // Feb
      assert.equal(plus1.getDate(), 28) // Clamped to Feb 28

      const normal = new Date(2026, 8, 30) // Sep 30
      const plusQuarter = addMonths(normal, 3) // Dec 30
      assert.equal(plusQuarter.getMonth(), 11) // Dec
      assert.equal(plusQuarter.getDate(), 30)
    })
  })

  describe('Automatic Renewal Detection & 3-Day Window', () => {
    it('does not trigger prematurely when renewal is > 3 days away', () => {
      const today = new Date(2026, 8, 25) // 25 Sep 2026
      const renewal = new Date(2026, 8, 30) // 30 Sep 2026 (5 days away)
      const res = isEligibleForRenewalInvoice(renewal, today)

      assert.equal(res.eligible, false)
      assert.equal(res.days, 5)
      assert.equal(res.isOverdue, false)
    })

    it('triggers exactly at 3 days before renewal (Prompt example: 27 Sep for 30 Sep)', () => {
      const today = new Date(2026, 8, 27) // 27 Sep 2026
      const renewal = new Date(2026, 8, 30) // 30 Sep 2026
      const res = isEligibleForRenewalInvoice(renewal, today)

      assert.equal(res.eligible, true)
      assert.equal(res.days, 3)
      assert.equal(res.isOverdue, false)
    })

    it('triggers for due today (0 days) and overdue (< 0 days)', () => {
      const today = new Date(2026, 9, 1) // 1 Oct 2026
      const renewal = new Date(2026, 8, 30) // 30 Sep 2026 (-1 day overdue)
      const res = isEligibleForRenewalInvoice(renewal, today)

      assert.equal(res.eligible, true)
      assert.equal(res.days, -1)
      assert.equal(res.isOverdue, true)
    })
  })

  describe('Duplicate Invoice Prevention', () => {
    it('detects existing invoice for the renewal period and prevents duplication', () => {
      const listingId = 'prop-123'
      const renewalDate = new Date(2026, 8, 30)
      const existingInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-0004',
          listingId: 'prop-123',
          renewalDate: '2026-09-30',
        },
      ]

      const duplicate = findExistingRenewalInvoice(listingId, renewalDate, existingInvoices)
      assert.ok(duplicate)
      assert.equal(duplicate.invoiceNumber, 'INV-0004')
    })

    it('returns null if no invoice exists for that renewal date', () => {
      const listingId = 'prop-123'
      const renewalDate = new Date(2026, 9, 30) // Next month
      const existingInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-0004',
          listingId: 'prop-123',
          renewalDate: '2026-09-30',
        },
      ]

      const duplicate = findExistingRenewalInvoice(listingId, renewalDate, existingInvoices)
      assert.equal(duplicate, null)
    })
  })

  describe('Subscription Pricing & Frequency Resolution', () => {
    const discounts = {
      quarterly: 10,
      semiAnnually: 15,
      annually: 20,
    }

    it('correctly calculates monthly subscription price without discounts', () => {
      const listing = {
        id: 'l1',
        name: 'Apartment 4B',
        price: '1,500',
        package: 'monthly',
      }
      const res = calculateSubscriptionPrice(listing, discounts)
      assert.equal(res.success, true)
      assert.equal(res.price, 1500)
      assert.equal(res.rawMonthly, 1500)
      assert.equal(res.billingFrequency, 'Monthly')
      assert.equal(res.discountAmount, 0)
    })

    it('correctly calculates quarterly price with 10% discount', () => {
      const listing = {
        id: 'l2',
        name: 'Apartment 4B',
        price: '1500',
        package: 'quarterly',
      }
      // Raw: 1500 * 3 = 4500. Discount 10% = 450. Total = 4050.
      const res = calculateSubscriptionPrice(listing, discounts)
      assert.equal(res.success, true)
      assert.equal(res.price, 4050)
      assert.equal(res.discountAmount, 450)
      assert.equal(res.billingFrequency, 'Quarterly')
    })

    it('correctly calculates biannual price with 15% discount', () => {
      const listing = {
        id: 'l3',
        name: 'Apartment 4B',
        price: '1500',
        package: 'biannual',
      }
      // Raw: 1500 * 6 = 9000. Discount 15% = 1350. Total = 7650.
      const res = calculateSubscriptionPrice(listing, discounts)
      assert.equal(res.success, true)
      assert.equal(res.price, 7650)
      assert.equal(res.discountAmount, 1350)
      assert.equal(res.billingFrequency, 'Biannual')
    })

    it('correctly calculates annual price with 20% discount', () => {
      const listing = {
        id: 'l4',
        name: 'Apartment 4B',
        price: '1500',
        package: 'annually',
      }
      // Raw: 1500 * 12 = 18000. Discount 20% = 3600. Total = 14400.
      const res = calculateSubscriptionPrice(listing, discounts)
      assert.equal(res.success, true)
      assert.equal(res.price, 14400)
      assert.equal(res.discountAmount, 3600)
      assert.equal(res.billingFrequency, 'Annual')
    })

    it('stops and returns an error if subscription price is missing or ambiguous', () => {
      const listing = {
        id: 'l5',
        name: 'Unpriced Villa',
        price: '',
        package: 'monthly',
      }
      const res = calculateSubscriptionPrice(listing, discounts, [])
      assert.equal(res.success, false)
      assert.ok(res.error.includes('Subscription price is missing or ambiguous'))
    })
  })

  describe('Renewal Advance after Payment', () => {
    it('advances monthly renewal by 1 month', () => {
      const current = new Date(2026, 8, 30) // 30 Sep 2026
      const next = advanceRenewalDate(current, 'Monthly')
      assert.equal(next.getFullYear(), 2026)
      assert.equal(next.getMonth(), 9) // October
      assert.equal(next.getDate(), 30)
    })

    it('advances quarterly renewal by 3 months', () => {
      const current = new Date(2026, 8, 30) // 30 Sep 2026
      const next = advanceRenewalDate(current, 'Quarterly')
      assert.equal(next.getFullYear(), 2026)
      assert.equal(next.getMonth(), 11) // December
      assert.equal(next.getDate(), 30)
    })

    it('advances annual renewal by 1 full year', () => {
      const current = new Date(2026, 8, 30) // 30 Sep 2026
      const next = advanceRenewalDate(current, 'Annual')
      assert.equal(next.getFullYear(), 2027)
      assert.equal(next.getMonth(), 8) // September
      assert.equal(next.getDate(), 30)
    })
  })

  describe('WhatsApp Dispatch Formatting', () => {
    it('formats professional WhatsApp invoice text without undefined or broken tags', () => {
      const invoice = {
        invoiceNumber: 'INV-0005',
        invoiceDate: '27 Sep 2026',
        renewalDate: '30 Sep 2026',
        clientName: 'Jane Doe',
        propertyName: 'Kilimani Heights',
        accountNumber: 'NBI-KIL-0001',
        billingFrequency: 'Monthly',
        items: [{ id: '1', description: 'Hosting & Tour Management', qty: 1, rate: 1500 }],
        subtotal: 1500,
        tax: 240,
        totalDue: 1740,
        paymentDetails: 'Paybill: 247247  |  Account: NBI-KIL-0001',
      }
      const text = formatWhatsAppInvoiceMessage(invoice)
      assert.ok(text.includes('INV-0005'))
      assert.ok(text.includes('Jane Doe'))
      assert.ok(text.includes('Kilimani Heights'))
      assert.ok(text.includes('NBI-KIL-0001'))
      assert.ok(text.includes('KES 1,740'))
    })
  })

  describe('Client Billing Frequency & Due Date / Renewal Calculation', () => {
    it('correctly maps frequency days (Monthly=30, Quarterly=90, Biannual=180, Annual=365)', () => {
      assert.equal(getFrequencyDays('Monthly'), 30)
      assert.equal(getFrequencyDays('Quarterly'), 90)
      assert.equal(getFrequencyDays('Biannual'), 180)
      assert.equal(getFrequencyDays('Annual'), 365)
    })

    it('sets the due date to be exactly 90 days from the date the tour was paid for quarterly package', () => {
      const datePaid = '2026-06-01'
      const dueDate = calculateDueDateFromPayment(datePaid, 'Quarterly')
      // 90 days after 2026-06-01: June has 30 days (29 left), July has 31 (60 passed), August has 30 -> 2026-08-30
      assert.equal(formatISODate(dueDate), '2026-08-30')
    })

    it('sets the due date to be 30 days from the date the tour was paid for monthly package', () => {
      const datePaid = '2026-06-01'
      const dueDate = calculateDueDateFromPayment(datePaid, 'Monthly')
      assert.equal(formatISODate(dueDate), '2026-07-01')
    })

    it('switches to renewal when generating receipt which is another 90 days from the day payment was made', () => {
      const paymentDate = '2026-08-30'
      const nextRenewal = calculateRenewalDateFromPayment(paymentDate, 'Quarterly')
      // 90 days after 2026-08-30: Aug has 1 day left, Sept has 30 (31), Oct has 31 (62), Nov has 28 -> 2026-11-28
      assert.equal(formatISODate(nextRenewal), '2026-11-28')
    })
  })
})

