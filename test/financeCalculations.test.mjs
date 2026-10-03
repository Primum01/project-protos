import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateFinanceOverview,
  formatMoney,
  getDerivedTransactions,
  getClientFinancialSummaries,
  getInvoicePaidAmount,
  getMoneyToWatch,
  getPropertyFinancialSummaries,
  isHostingDescription,
  isScanDescription,
} from '../src/lib/financeCalculations.ts'
import {
  calculateRenewalDate,
  isEligibleForRenewalInvoice,
  normalizeBillingFrequency,
} from '../src/lib/subscriptionRenewal.ts'

describe('Finance System & Calculation Tests', () => {
  describe('Money Formatting & Description Categorization', () => {
    it('formats monetary figures with commas without crashing on null/undefined', () => {
      assert.equal(formatMoney(150000), '150,000')
      assert.equal(formatMoney(0), '0')
      assert.equal(formatMoney(undefined), '0')
    })

    it('identifies scan and hosting descriptions accurately', () => {
      assert.equal(isScanDescription('3D Virtual Tour Shoot & Scanning'), true)
      assert.equal(isScanDescription('Matterport Capture Session'), true)
      assert.equal(isScanDescription('Quarterly Hosting Fee'), false)

      assert.equal(isHostingDescription('Hosting & Tour Management (Quarterly)'), true)
      assert.equal(isHostingDescription('Annual 3D Tour Subscription'), true)
      assert.equal(isHostingDescription('Onsite Photography'), false)
    })
  })

  describe('Invoice Settlement & Balance Calculations (Scenarios 1, 2, 3)', () => {
    it('Scenario 1: Invoice KSh 30,000, Payment KSh 30,000 -> Balance KSh 0 (Paid)', () => {
      const invoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-0001',
        clientName: 'Alpha Corp',
        propertyName: 'Greenview Unit 1',
        totalDue: 30000,
        status: 'paid',
        items: [{ id: '1', description: '3D Scan Shoot', qty: 1, rate: 30000 }],
      }
      const receipts = [
        {
          id: 'rec-1',
          receiptNumber: 'REC-0001',
          invoiceId: 'inv-1',
          invoiceNumber: 'INV-0001',
          clientName: 'Alpha Corp',
          propertyName: 'Greenview Unit 1',
          totalPaid: 30000,
          date: '2026-10-01',
        },
      ]
      const payments = []

      const paid = getInvoicePaidAmount(invoice, receipts, payments)
      const balance = invoice.totalDue - paid
      assert.equal(paid, 30000)
      assert.equal(balance, 0)
    })

    it('Scenario 2: Invoice KSh 50,000, Payment KSh 20,000 -> Balance KSh 30,000 (Partial)', () => {
      const invoice = {
        id: 'inv-2',
        invoiceNumber: 'INV-0002',
        clientName: 'Beta Developers',
        propertyName: 'Riverside Block B',
        totalDue: 50000,
        status: 'partial',
        items: [{ id: '1', description: 'Matterport Scan', qty: 1, rate: 50000 }],
      }
      const receipts = []
      const payments = [
        {
          id: 'pay-1',
          invoiceId: 'inv-2',
          invoiceNumber: 'INV-0002',
          amount: 20000,
          method: 'M-Pesa',
          category: 'scan',
          date: '2026-10-02',
        },
      ]

      const paid = getInvoicePaidAmount(invoice, receipts, payments)
      const balance = invoice.totalDue - paid
      assert.equal(paid, 20000)
      assert.equal(balance, 30000)
    })

    it('Scenario 3: Invoice KSh 50,000, No payment -> Balance KSh 50,000 (Pending/Unpaid)', () => {
      const invoice = {
        id: 'inv-3',
        invoiceNumber: 'INV-0003',
        clientName: 'Gamma Suites',
        propertyName: 'Westlands Tower',
        totalDue: 50000,
        status: 'sent',
        items: [{ id: '1', description: 'Tour Creation', qty: 1, rate: 50000 }],
      }
      const receipts = []
      const payments = []

      const paid = getInvoicePaidAmount(invoice, receipts, payments)
      const balance = invoice.totalDue - paid
      assert.equal(paid, 0)
      assert.equal(balance, 50000)
    })
  })

  describe('Hosting Subscription Structures (Scenarios 4, 5, 6, 7)', () => {
    it('Scenario 4: Quarterly hosting advances next payment by 3 months', () => {
      const renewal = calculateRenewalDate('2026-01-15', 'Quarterly')
      assert.ok(renewal)
      assert.equal(renewal.getFullYear(), 2026)
      assert.equal(renewal.getMonth(), 3) // April
      assert.equal(renewal.getDate(), 15)
    })

    it('Scenario 5: Semi-annually / Biannual hosting advances next payment by 6 months', () => {
      const renewal = calculateRenewalDate('2026-01-15', 'Biannual')
      assert.ok(renewal)
      assert.equal(renewal.getFullYear(), 2026)
      assert.equal(renewal.getMonth(), 6) // July (180 days)
      assert.equal(renewal.getDate(), 14)
    })

    it('Scenario 6: Annually hosting advances next payment by 12 months', () => {
      const renewal = calculateRenewalDate('2026-01-15', 'Annual')
      assert.ok(renewal)
      assert.equal(renewal.getFullYear(), 2027)
      assert.equal(renewal.getMonth(), 0) // January next year
      assert.equal(renewal.getDate(), 15)
    })

    it('Enforces strictly 3 payment structures (Quarterly, Biannual, Annual)', () => {
      assert.equal(normalizeBillingFrequency('Quarterly'), 'Quarterly')
      assert.equal(normalizeBillingFrequency('Biannual'), 'Biannual')
      assert.equal(normalizeBillingFrequency('Semi-annual'), 'Biannual')
      assert.equal(normalizeBillingFrequency('Annual'), 'Annual')
    })

    it('Scenario 7: Hosting payment passes due date -> identified as Overdue', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const { isOverdue, days } = isEligibleForRenewalInvoice(pastDate)
      assert.equal(isOverdue, true)
      assert.ok(days < 0)
    })
  })

  describe('Net Position & Cash Flow Calculations (Scenario 10)', () => {
    it('Scenario 10: Correctly calculates Total Income, Expenses, and Net without double counting or counting unpaid balances as cash', () => {
      const invoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-0001',
          clientName: 'Client A',
          propertyName: 'Prop A',
          totalDue: 500000,
          status: 'partial',
          items: [{ id: '1', description: '3D Scan Shoot', qty: 1, rate: 500000 }],
        },
      ]
      const receipts = [
        {
          id: 'rec-1',
          receiptNumber: 'REC-0001',
          invoiceId: 'inv-1',
          invoiceNumber: 'INV-0001',
          clientName: 'Client A',
          propertyName: 'Prop A',
          totalPaid: 485000,
          date: '2026-10-01',
        },
      ]
      const expenses = [
        {
          id: 'exp-1',
          description: 'Matterport hosting & transport',
          category: 'Transport',
          amount: 96000,
          date: '2026-10-02',
        },
      ]
      const payments = []
      const listings = []

      const overview = calculateFinanceOverview(
        invoices,
        receipts,
        expenses,
        payments,
        listings,
        'all',
      )

      assert.equal(overview.totalIncome, 485000, 'Income should be actual cash received')
      assert.equal(overview.totalExpenses, 96000, 'Expenses should match recorded spending')
      assert.equal(overview.netIncome, 389000, 'Net should be 485,000 - 96,000 = 389,000')
      assert.equal(overview.totalOutstanding, 15000, 'Outstanding should be 500,000 - 485,000 = 15,000')
    })
  })

  describe('Client & Property Financial Summaries (Scenarios 8 & 9)', () => {
    it('Scenario 8: Client with multiple properties aggregates financial totals across all projects', () => {
      const listings = [
        { id: 'p1', name: 'Greenview Apartments', contactName: 'ABC Properties' },
        { id: 'p2', name: 'Riverside Villas', contactName: 'ABC Properties' },
        { id: 'p3', name: 'Westlands Offices', contactName: 'ABC Properties' },
      ]
      const invoices = [
        {
          id: 'i1',
          invoiceNumber: 'INV-1',
          listingId: 'p1',
          clientName: 'ABC Properties',
          propertyName: 'Greenview Apartments',
          totalDue: 30000,
          status: 'paid',
        },
        {
          id: 'i2',
          invoiceNumber: 'INV-2',
          listingId: 'p2',
          clientName: 'ABC Properties',
          propertyName: 'Riverside Villas',
          totalDue: 45000,
          status: 'paid',
        },
      ]
      const receipts = [
        {
          id: 'r1',
          receiptNumber: 'REC-1',
          invoiceId: 'i1',
          clientName: 'ABC Properties',
          totalPaid: 30000,
        },
        {
          id: 'r2',
          receiptNumber: 'REC-2',
          invoiceId: 'i2',
          clientName: 'ABC Properties',
          totalPaid: 45000,
        },
      ]
      const payments = []

      const clientSummaries = getClientFinancialSummaries(
        invoices,
        receipts,
        payments,
        listings,
      )

      const abcClient = clientSummaries.find((c) => c.clientName === 'ABC Properties')
      assert.ok(abcClient)
      assert.equal(abcClient.propertyCount, 3)
      assert.equal(abcClient.totalBilled, 75000)
      assert.equal(abcClient.totalPaid, 75000)
      assert.equal(abcClient.totalOutstanding, 0)
    })

    it('Scenario 9: Property with both Scan and Hosting reflects both in history', () => {
      const listings = [
        {
          id: 'prop-xyz',
          name: 'Greenview Apartments',
          contactName: 'Landlord X',
          package: 'Quarterly',
        },
      ]
      const invoices = [
        {
          id: 'inv-scan',
          invoiceNumber: 'INV-SCAN',
          listingId: 'prop-xyz',
          propertyName: 'Greenview Apartments',
          clientName: 'Landlord X',
          totalDue: 30000,
          items: [{ id: '1', description: '3D Scan Shoot', qty: 1, rate: 30000 }],
        },
        {
          id: 'inv-host',
          invoiceNumber: 'INV-HOST',
          listingId: 'prop-xyz',
          propertyName: 'Greenview Apartments',
          clientName: 'Landlord X',
          totalDue: 15000,
          items: [{ id: '2', description: 'Hosting (Quarterly)', qty: 1, rate: 15000 }],
        },
      ]
      const receipts = [
        {
          id: 'rec-scan',
          invoiceId: 'inv-scan',
          propertyName: 'Greenview Apartments',
          clientName: 'Landlord X',
          totalPaid: 30000,
        },
        {
          id: 'rec-host',
          invoiceId: 'inv-host',
          propertyName: 'Greenview Apartments',
          clientName: 'Landlord X',
          totalPaid: 15000,
        },
      ]
      const payments = []

      const propSummaries = getPropertyFinancialSummaries(
        listings,
        invoices,
        receipts,
        payments,
      )

      const prop = propSummaries.find((p) => p.propertyId === 'prop-xyz')
      assert.ok(prop)
      assert.equal(prop.scanRevenue, 30000)
      assert.equal(prop.hostingRevenue, 15000)
      assert.equal(prop.totalCollected, 45000)
      assert.equal(prop.totalOutstanding, 0)
    })
  })

  describe('Resilience & Graceful Error Handling (Scenario 11)', () => {
    it('Scenario 11: Missing or deleted listing reference does not crash finance calculations', () => {
      const orphanedInvoices = [
        {
          id: 'orphaned-1',
          invoiceNumber: 'INV-ORPHAN',
          listingId: 'deleted-listing-999',
          clientName: 'Mystery Client',
          propertyName: 'Old Deleted Building',
          totalDue: 10000,
          items: [],
        },
      ]
      const emptyListings = []

      assert.doesNotThrow(() => {
        const overview = calculateFinanceOverview(
          orphanedInvoices,
          [],
          [],
          [],
          emptyListings,
          'all',
        )
        assert.equal(overview.totalInvoiced, 10000)

        const transactions = getDerivedTransactions(
          orphanedInvoices,
          [],
          [],
          [],
          emptyListings,
        )
        assert.equal(transactions.length, 1)

        const watch = getMoneyToWatch(emptyListings, orphanedInvoices, [], [])
        assert.ok(watch)
      })
    })
  })
})
