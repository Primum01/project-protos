import type {
  ExpenseRecord,
  FinanceClientSummary,
  FinancePropertySummary,
  PaymentRecord,
  SavedInvoice,
  SavedReceipt,
  UnifiedTransaction,
} from '@/types/finance'
import type { Listing } from '@/types/listing'
import {
  calculateRenewalDate,
  isEligibleForRenewalInvoice,
  parseLocalDate,
} from './subscriptionRenewal.ts'

export function formatMoney(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0'
  return amount.toLocaleString('en-KE')
}

export function isHostingDescription(description?: string | null): boolean {
  const d = (description || '').toLowerCase()
  return (
    d.includes('hosting') ||
    d.includes('management') ||
    d.includes('maintenance') ||
    d.includes('subscription') ||
    d.includes('annual') ||
    d.includes('quarterly') ||
    d.includes('biannual')
  )
}

export function isScanDescription(description?: string | null): boolean {
  const d = (description || '').toLowerCase()
  return (
    d.includes('scan') ||
    d.includes('shoot') ||
    d.includes('capture') ||
    d.includes('virtual tour') ||
    d.includes('3d') ||
    d.includes('floor plan') ||
    d.includes('tag') ||
    d.includes('creation')
  )
}

/**
 * Filter items by date range in days or 'all'.
 */
export function filterByDateRange<
  T extends { date?: string; invoiceDate?: string; receiptDate?: string; createdAt?: string }
>(
  items: T[] = [],
  range: '7d' | '30d' | '3m' | '6m' | '12m' | 'all' | string = 'all',
): T[] {
  if (!Array.isArray(items)) return []
  if (range === 'all') return items

  const now = new Date()
  let days = 30
  if (range === '7d') days = 7
  else if (range === '30d') days = 30
  else if (range === '3m') days = 90
  else if (range === '6m') days = 180
  else if (range === '12m') days = 365

  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return items.filter((item) => {
    const rawDate = item.date || item.invoiceDate || item.receiptDate || item.createdAt
    if (!rawDate) return false
    const parsed = parseLocalDate(rawDate) || new Date(rawDate)
    if (isNaN(parsed.getTime())) return false
    return parsed >= cutoff
  })
}

/**
 * Calculate the amount paid on an invoice from receipts and payment records.
 */
export function getInvoicePaidAmount(
  invoice: SavedInvoice,
  receipts: SavedReceipt[] = [],
  payments: PaymentRecord[] = [],
): number {
  if (!invoice) return 0
  let paid = 0

  const safeReceipts = Array.isArray(receipts) ? receipts : []
  const safePayments = Array.isArray(payments) ? payments : []

  // 1. Check linked receipts
  const matchedReceipts = safeReceipts.filter(
    (r) =>
      (r.invoiceId && r.invoiceId === invoice.id) ||
      (r.invoiceNumber &&
        r.invoiceNumber.trim().toUpperCase() === invoice.invoiceNumber?.trim().toUpperCase()),
  )
  for (const r of matchedReceipts) {
    paid += Number(r.totalPaid) || 0
  }

  // 2. Check linked payments (avoid double counting if payment has receiptId that was already matched)
  const matchedReceiptIds = new Set(matchedReceipts.map((r) => r.id))
  const matchedPayments = safePayments.filter(
    (p) =>
      (!p.receiptId || !matchedReceiptIds.has(p.receiptId)) &&
      ((p.invoiceId && p.invoiceId === invoice.id) ||
        (p.invoiceNumber &&
          p.invoiceNumber.trim().toUpperCase() === invoice.invoiceNumber?.trim().toUpperCase())),
  )
  for (const p of matchedPayments) {
    paid += Number(p.amount) || 0
  }

  return paid
}

/**
 * Core Finance Overview Metrics:
 * Supports both positional parameters and object options.
 */
export function calculateFinanceOverview(
  invoicesOrParams:
    | SavedInvoice[]
    | {
        invoices: SavedInvoice[]
        receipts: SavedReceipt[]
        expenses: ExpenseRecord[]
        payments: PaymentRecord[]
        listings: Listing[]
        range?: '7d' | '30d' | '3m' | '6m' | '12m' | 'all'
      },
  receiptsArg?: SavedReceipt[],
  expensesArg?: ExpenseRecord[],
  paymentsArg?: PaymentRecord[],
  listingsArg?: Listing[],
  rangeArg: '7d' | '30d' | '3m' | '6m' | '12m' | 'all' = 'all',
) {
  let allInvoices: SavedInvoice[] = []
  let allReceipts: SavedReceipt[] = []
  let allExpenses: ExpenseRecord[] = []
  let allPayments: PaymentRecord[] = []
  let listings: Listing[] = []
  let range: '7d' | '30d' | '3m' | '6m' | '12m' | 'all' = 'all'

  if (Array.isArray(invoicesOrParams)) {
    allInvoices = invoicesOrParams || []
    allReceipts = receiptsArg || []
    allExpenses = expensesArg || []
    allPayments = paymentsArg || []
    listings = listingsArg || []
    range = rangeArg || 'all'
  } else if (invoicesOrParams && typeof invoicesOrParams === 'object') {
    allInvoices = invoicesOrParams.invoices || []
    allReceipts = invoicesOrParams.receipts || []
    allExpenses = invoicesOrParams.expenses || []
    allPayments = invoicesOrParams.payments || []
    listings = invoicesOrParams.listings || []
    range = invoicesOrParams.range || 'all'
  }

  const invoices = filterByDateRange(allInvoices, range)
  const receipts = filterByDateRange(allReceipts, range)
  const expenses = filterByDateRange(allExpenses, range)
  const payments = filterByDateRange(allPayments, range)

  // Deduplicate receipts vs payments
  const recordedReceiptIds = new Set(
    payments.map((p) => p.receiptId).filter((id): id is string => Boolean(id)),
  )

  let totalIncome = 0
  let hostingRevenue = 0
  let scanRevenue = 0
  let otherRevenue = 0

  // Accumulate from receipts
  for (const r of receipts) {
    const amount = Number(r.totalPaid) || 0
    totalIncome += amount

    let hasHosting = false
    let hasScan = false
    for (const item of r.items || []) {
      if (isHostingDescription(item.description)) hasHosting = true
      if (isScanDescription(item.description)) hasScan = true
    }

    if (hasHosting && !hasScan) {
      hostingRevenue += amount
    } else if (hasScan && !hasHosting) {
      scanRevenue += amount
    } else if (hasHosting && hasScan) {
      const totalItemRate = (r.items || []).reduce((s, it) => s + it.rate * it.qty, 0) || amount
      for (const item of r.items || []) {
        const itemVal = ((item.rate * item.qty) / totalItemRate) * amount
        if (isHostingDescription(item.description)) hostingRevenue += itemVal
        else if (isScanDescription(item.description)) scanRevenue += itemVal
        else otherRevenue += itemVal
      }
    } else {
      otherRevenue += amount
    }
  }

  // Accumulate standalone payments (not already in receipts)
  for (const p of payments) {
    if (p.receiptId && recordedReceiptIds.has(p.receiptId)) continue
    const amount = Number(p.amount) || 0
    totalIncome += amount

    if (p.category === 'hosting') hostingRevenue += amount
    else if (p.category === 'scan' || p.category === 'scan_shoot') scanRevenue += amount
    else otherRevenue += amount
  }

  // Expenses
  let totalExpenses = 0
  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses) {
    const amount = Number(e.amount) || 0
    totalExpenses += amount
    const cat = e.category || 'Miscellaneous'
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amount
  }

  // Outstanding receivables
  let totalInvoiced = 0
  let totalOutstanding = 0
  for (const inv of invoices) {
    if (inv.status === 'draft') continue
    const totalDue = Number(inv.totalDue) || 0
    totalInvoiced += totalDue

    const paid = getInvoicePaidAmount(inv, allReceipts, allPayments)
    const balance = Math.max(0, totalDue - paid)
    totalOutstanding += balance
  }

  const netIncome = totalIncome - totalExpenses

  // Count active hosting subscriptions from listings
  const activeHostingCount = (listings || []).filter((l) => {
    return l.package && !l.deactivated && l.status !== 'sold' && l.status !== 'off_market'
  }).length

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    totalOutstanding,
    totalInvoiced,
    hostingRevenue,
    scanRevenue,
    otherRevenue,
    activeHostingCount,
    expensesByCategory,
    invoicesCount: invoices.length,
    receiptsCount: receipts.length,
    expensesCount: expenses.length,
    paymentsCount: payments.length,
  }
}

/**
 * Derives a unified chronologically sorted financial ledger.
 */
export function getDerivedTransactions(
  invoicesOrParams:
    | SavedInvoice[]
    | {
        invoices: SavedInvoice[]
        receipts: SavedReceipt[]
        expenses: ExpenseRecord[]
        payments: PaymentRecord[]
        listings?: Listing[]
      },
  receiptsArg?: SavedReceipt[],
  expensesArg?: ExpenseRecord[],
  paymentsArg?: PaymentRecord[],
  _listingsArg?: Listing[],
): UnifiedTransaction[] {
  let invoices: SavedInvoice[] = []
  let receipts: SavedReceipt[] = []
  let expenses: ExpenseRecord[] = []
  let payments: PaymentRecord[] = []

  if (Array.isArray(invoicesOrParams)) {
    invoices = invoicesOrParams || []
    receipts = receiptsArg || []
    expenses = expensesArg || []
    payments = paymentsArg || []
  } else if (invoicesOrParams && typeof invoicesOrParams === 'object') {
    invoices = invoicesOrParams.invoices || []
    receipts = invoicesOrParams.receipts || []
    expenses = invoicesOrParams.expenses || []
    payments = invoicesOrParams.payments || []
  }

  const transactions: UnifiedTransaction[] = []

  // Receipts (Income)
  for (const r of receipts) {
    let category: 'scan' | 'hosting' | 'other' = 'scan'
    if (r.items?.some((i) => isHostingDescription(i.description))) {
      category = 'hosting'
    } else if (r.items?.some((i) => isScanDescription(i.description))) {
      category = 'scan'
    } else {
      category = 'other'
    }

    const desc = r.items?.map((i) => i.description).join(', ') || 'Payment Receipt'
    transactions.push({
      id: `rec_${r.id}`,
      kind: 'income',
      type: 'Income',
      category,
      date: r.date || r.receiptDate || r.createdAt || new Date().toISOString().slice(0, 10),
      clientName: r.clientName || 'General Client',
      propertyName: r.propertyName || 'Property Project',
      description: `Receipt ${r.receiptNumber} — ${desc}`,
      amount: Number(r.totalPaid) || 0,
      status: 'paid',
      reference: r.receiptNumber,
      sourceDocType: 'receipt',
      sourceDocId: r.id,
      paymentMethod: r.paymentMethod,
    })
  }

  // Standalone Payments (Income)
  const linkedReceiptIds = new Set(
    receipts.map((r) => r.id).concat(
      receipts.map((r) => r.receiptNumber).filter(Boolean) as string[],
    ),
  )

  for (const p of payments) {
    if (p.receiptId && linkedReceiptIds.has(p.receiptId)) continue
    const cat: 'scan' | 'hosting' | 'other' =
      p.category === 'hosting' ? 'hosting' : p.category === 'other' ? 'other' : 'scan'

    transactions.push({
      id: `pay_${p.id}`,
      kind: 'income',
      type: 'Income',
      category: cat,
      date: p.date || p.createdAt || new Date().toISOString().slice(0, 10),
      clientName: p.clientName || 'General Client',
      propertyName: p.propertyName || 'Property Project',
      description: p.notes || `Payment: ${p.reference || p.paymentMethod || p.method}`,
      amount: Number(p.amount) || 0,
      status: 'paid',
      reference: p.reference,
      sourceDocType: 'payment',
      sourceDocId: p.id,
      paymentMethod: p.paymentMethod || p.method,
    })
  }

  // Invoices (Pending / Partial / Overdue Income receivables)
  const paidInvoiceIds = new Set(receipts.map((r) => r.invoiceId).filter(Boolean))
  for (const inv of invoices) {
    if (inv.status === 'draft') continue
    if (paidInvoiceIds.has(inv.id)) continue

    const paid = getInvoicePaidAmount(inv, receipts, payments)
    const totalDue = Number(inv.totalDue) || 0
    const balance = Math.max(0, totalDue - paid)
    if (balance <= 0) continue

    let category: 'scan' | 'hosting' | 'other' = 'scan'
    if (inv.items?.some((i) => isHostingDescription(i.description))) {
      category = 'hosting'
    }

    transactions.push({
      id: `inv_${inv.id}`,
      kind: 'invoice',
      type: 'Income',
      category,
      date: inv.date || inv.invoiceDate || inv.createdAt || new Date().toISOString().slice(0, 10),
      clientName: inv.clientName || 'General Client',
      propertyName: inv.propertyName || 'Property Project',
      description: `Invoice ${inv.invoiceNumber} (Balance due: KSh ${formatMoney(balance)})`,
      amount: balance,
      status: inv.status === 'overdue' ? 'overdue' : paid > 0 ? 'partial' : 'pending',
      reference: inv.invoiceNumber,
      sourceDocType: 'invoice',
      sourceDocId: inv.id,
    })
  }

  // Expenses (Money Out)
  for (const e of expenses) {
    transactions.push({
      id: `exp_${e.id}`,
      kind: 'expense',
      type: 'Expense',
      date: e.date || e.createdAt || new Date().toISOString().slice(0, 10),
      clientName: 'TwinSpace Operations',
      propertyName: e.category,
      description: `${e.category}: ${e.description}`,
      amount: Number(e.amount) || 0,
      status: 'paid',
      reference: e.reference,
      sourceDocType: 'expense',
      sourceDocId: e.id,
      paymentMethod: e.paymentMethod,
    })
  }

  // Sort chronologically descending
  return transactions.sort((a, b) => {
    const da = new Date(a.date).getTime() || 0
    const db = new Date(b.date).getTime() || 0
    return db - da
  })
}

/**
 * Aggregates client-level financial overview across all their properties.
 */
export function getClientFinancialSummaries(
  firstArg: any,
  receiptsArg?: SavedReceipt[],
  paymentsArg?: PaymentRecord[],
  listingsArg?: Listing[],
): FinanceClientSummary[] {
  let invoices: SavedInvoice[] = []
  let receipts: SavedReceipt[] = []
  let payments: PaymentRecord[] = []
  let listings: Listing[] = []

  if (Array.isArray(firstArg)) {
    if (firstArg.length > 0 && ('invoiceNumber' in firstArg[0] || 'totalDue' in firstArg[0])) {
      invoices = firstArg
      receipts = receiptsArg || []
      payments = paymentsArg || []
      listings = listingsArg || []
    } else {
      listings = firstArg
      invoices = (receiptsArg as any) || []
      receipts = (paymentsArg as any) || []
      payments = (listingsArg as any) || []
    }
  } else if (firstArg && typeof firstArg === 'object') {
    listings = firstArg.listings || []
    invoices = firstArg.invoices || []
    receipts = firstArg.receipts || []
    payments = firstArg.payments || []
  }

  const clientMap = new Map<string, FinanceClientSummary>()

  // 1. Populate from listings
  for (const l of listings || []) {
    const rawName = l.contactName?.trim()
    if (!rawName) continue
    const key = rawName.toLowerCase()

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientName: rawName,
        contactEmail: l.contactEmail,
        contactPhone: l.contactPhone,
        clientEmail: l.contactEmail,
        clientPhone: l.contactPhone,
        accountNumber: l.accountNumber,
        propertyCount: 0,
        activeHostingCount: 0,
        activeSubscriptionsCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        invoicesCount: 0,
        receiptsCount: 0,
        properties: [],
      })
    }

    const summary = clientMap.get(key)!
    summary.properties.push({
      id: l.id,
      name: l.name,
      location: l.location || '',
      package: l.package,
    })
    summary.propertyCount++

    if (l.package && !l.deactivated && l.status !== 'sold' && l.status !== 'off_market') {
      summary.activeHostingCount++
      summary.activeSubscriptionsCount++
    }
  }

  // 2. Aggregate Invoices for each client
  for (const inv of invoices || []) {
    const rawName = inv.clientName?.trim()
    if (!rawName) continue
    const key = rawName.toLowerCase()

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientName: rawName,
        contactEmail: inv.clientEmail,
        contactPhone: inv.clientPhone,
        clientEmail: inv.clientEmail,
        clientPhone: inv.clientPhone,
        accountNumber: inv.accountNumber,
        propertyCount: 0,
        activeHostingCount: 0,
        activeSubscriptionsCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        invoicesCount: 0,
        receiptsCount: 0,
        properties: inv.propertyName
          ? [{ id: inv.listingId || inv.id, name: inv.propertyName, location: inv.propertyLocation || '' }]
          : [],
      })
    }

    const summary = clientMap.get(key)!
    summary.invoicesCount++
    const due = Number(inv.totalDue) || 0
    summary.totalBilled += due

    const paid = getInvoicePaidAmount(inv, receipts, payments)
    summary.totalOutstanding += Math.max(0, due - paid)
  }

  // 3. Aggregate Receipts (Money actually paid)
  for (const rec of receipts || []) {
    const rawName = rec.clientName?.trim()
    if (!rawName) continue
    const key = rawName.toLowerCase()

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientName: rawName,
        contactEmail: rec.clientEmail,
        contactPhone: rec.clientPhone,
        clientEmail: rec.clientEmail,
        clientPhone: rec.clientPhone,
        accountNumber: rec.accountNumber,
        propertyCount: 0,
        activeHostingCount: 0,
        activeSubscriptionsCount: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        invoicesCount: 0,
        receiptsCount: 0,
        properties: rec.propertyName
          ? [{ id: rec.listingId || rec.id, name: rec.propertyName, location: rec.propertyLocation || '' }]
          : [],
      })
    }

    const summary = clientMap.get(key)!
    summary.receiptsCount++
    summary.totalPaid += Number(rec.totalPaid) || 0
  }

  // 4. Standalone Payments
  for (const p of payments || []) {
    const rawName = p.clientName?.trim()
    if (!rawName) continue
    const key = rawName.toLowerCase()
    if (clientMap.has(key)) {
      if (!p.receiptId) {
        clientMap.get(key)!.totalPaid += Number(p.amount) || 0
      }
    }
  }

  return Array.from(clientMap.values()).sort((a, b) => b.totalPaid - a.totalPaid)
}

/**
 * Aggregates property-level financial overview.
 */
export function getPropertyFinancialSummaries(
  firstArg: any,
  invoicesArg?: SavedInvoice[],
  receiptsArg?: SavedReceipt[],
  paymentsArg?: PaymentRecord[],
): FinancePropertySummary[] {
  let listings: Listing[] = []
  let invoices: SavedInvoice[] = []
  let receipts: SavedReceipt[] = []
  let payments: PaymentRecord[] = []

  if (Array.isArray(firstArg)) {
    listings = firstArg || []
    invoices = invoicesArg || []
    receipts = receiptsArg || []
    payments = paymentsArg || []
  } else if (firstArg && typeof firstArg === 'object') {
    listings = firstArg.listings || []
    invoices = firstArg.invoices || []
    receipts = firstArg.receipts || []
    payments = firstArg.payments || []
  }

  return (listings || []).map((l) => {
    const propName = (l.name || '').toLowerCase()
    const listingInvoices = (invoices || []).filter(
      (inv) => inv.listingId === l.id || (inv.propertyName && inv.propertyName.toLowerCase() === propName),
    )
    const listingReceipts = (receipts || []).filter(
      (rec) => rec.propertyName && rec.propertyName.toLowerCase() === propName,
    )
    const listingPayments = (payments || []).filter(
      (pay) => pay.listingId === l.id || (pay.propertyName && pay.propertyName.toLowerCase() === propName),
    )

    let totalBilled = 0
    let totalOutstanding = 0
    for (const inv of listingInvoices) {
      const due = Number(inv.totalDue) || 0
      totalBilled += due
      const paid = getInvoicePaidAmount(inv, receipts, payments)
      totalOutstanding += Math.max(0, due - paid)
    }

    let scanRevenue = 0
    let hostingRevenue = 0

    for (const r of listingReceipts) {
      const amount = Number(r.totalPaid) || 0
      const linkedInv = listingInvoices.find(
        (inv) => (r.invoiceId && inv.id === r.invoiceId) || (r.invoiceNumber && inv.invoiceNumber === r.invoiceNumber),
      )
      const allItems = r.items && r.items.length > 0 ? r.items : linkedInv?.items || []

      if (allItems.some((i) => isHostingDescription(i.description))) {
        hostingRevenue += amount
      } else {
        scanRevenue += amount
      }
    }

    for (const p of listingPayments) {
      if (p.receiptId && listingReceipts.some((r) => r.id === p.receiptId)) continue
      const amount = Number(p.amount) || 0
      if (p.category === 'hosting') hostingRevenue += amount
      else scanRevenue += amount
    }

    return {
      listingId: l.id,
      propertyId: l.id,
      propertyName: l.name,
      location: l.location || '',
      clientName: l.contactName || 'General Client',
      scanRevenue,
      hostingRevenue,
      totalRevenue: scanRevenue + hostingRevenue,
      totalCollected: scanRevenue + hostingRevenue,
      totalBilled,
      outstanding: totalOutstanding,
      totalOutstanding,
    }
  })
}

/**
 * Returns upcoming payments, overdue items, and recent payments.
 */
export function getMoneyToWatch(
  firstArg: any,
  invoicesArg?: SavedInvoice[],
  paymentsArg?: PaymentRecord[],
  receiptsArg?: SavedReceipt[],
) {
  let listings: Listing[] = []
  let invoices: SavedInvoice[] = []
  let payments: PaymentRecord[] = []
  let receipts: SavedReceipt[] = []

  if (Array.isArray(firstArg)) {
    listings = firstArg || []
    invoices = invoicesArg || []
    payments = paymentsArg || []
    receipts = receiptsArg || []
  } else if (firstArg && typeof firstArg === 'object') {
    listings = firstArg.listings || []
    invoices = firstArg.invoices || []
    payments = firstArg.payments || []
    receipts = firstArg.receipts || []
  }

  const overdue: Array<{
    id: string
    client: string
    property: string
    amount: number
    daysOverdue: number
    type: 'hosting' | 'invoice'
  }> = []

  const upcoming: Array<{
    id: string
    client: string
    property: string
    amount: number
    dueDate: Date
    daysRemaining: number
    type: 'hosting' | 'invoice'
  }> = []

  // 1. Check Listings for Hosting Renewals
  for (const l of listings || []) {
    if (!l.package || l.deactivated || l.status === 'sold' || l.status === 'off_market') continue
    const renewal = calculateRenewalDate(l.datePaid, l.package)
    if (!renewal) continue

    const { days, isOverdue } = isEligibleForRenewalInvoice(renewal)
    const amount =
      l.package.toLowerCase().includes('annual')
        ? 50000
        : l.package.toLowerCase().includes('biannual') || l.package.toLowerCase().includes('semi')
        ? 28000
        : 15000

    if (isOverdue) {
      overdue.push({
        id: l.id,
        client: l.contactName || 'General Client',
        property: l.name,
        amount,
        daysOverdue: Math.abs(days ?? 0),
        type: 'hosting',
      })
    } else if (days !== null && days <= 14) {
      upcoming.push({
        id: l.id,
        client: l.contactName || 'General Client',
        property: l.name,
        amount,
        dueDate: renewal,
        daysRemaining: days,
        type: 'hosting',
      })
    }
  }

  // 2. Check Invoices for Overdue balances
  for (const inv of invoices || []) {
    if (inv.status === 'draft') continue
    const paid = getInvoicePaidAmount(inv, receipts, payments)
    const totalDue = Number(inv.totalDue) || 0
    const balance = Math.max(0, totalDue - paid)

    if (balance > 0 && inv.status === 'overdue') {
      overdue.push({
        id: inv.id,
        client: inv.clientName || 'General Client',
        property: inv.propertyName || 'Property Project',
        amount: balance,
        daysOverdue: 7,
        type: 'invoice',
      })
    }
  }

  // 3. Recent Payments
  const recentPayments = [...(payments || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return {
    overdue: overdue.sort((a, b) => b.daysOverdue - a.daysOverdue),
    upcoming: upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining),
    recentPayments,
  }
}

/**
 * Export unified transactions to CSV.
 */
export function exportTransactionsToCSV(transactions: UnifiedTransaction[], filename: string) {
  const headers = ['Date', 'Type', 'Category', 'Client', 'Property', 'Description', 'Reference', 'Status', 'Amount']
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category || '',
    t.clientName,
    t.propertyName,
    t.description,
    t.reference || '',
    t.status,
    t.amount,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export general financial summary to CSV.
 */
export function exportFinancialSummaryToCSV(
  overview: ReturnType<typeof calculateFinanceOverview>,
  clients: FinanceClientSummary[],
  properties: FinancePropertySummary[],
) {
  const lines: string[] = []

  lines.push('=== TWINSPACE FINANCIAL OVERVIEW ===')
  lines.push(`Total Collected Income,KSh ${overview.totalIncome}`)
  lines.push(`Total Outstanding Receivables,KSh ${overview.totalOutstanding}`)
  lines.push(`Total Recorded Expenses,KSh ${overview.totalExpenses}`)
  lines.push(`Net Financial Position,KSh ${overview.netIncome}`)
  lines.push(`Scan Shoot Revenue,KSh ${overview.scanRevenue}`)
  lines.push(`Hosting Subscription Revenue,KSh ${overview.hostingRevenue}`)
  lines.push('')

  lines.push('=== CLIENT FINANCIAL SUMMARIES ===')
  lines.push('Client,Contact,Properties,Active Hosting,Total Billed,Total Paid,Outstanding')
  for (const c of clients) {
    const contact = c.contactPhone || c.clientPhone || c.contactEmail || c.clientEmail || ''
    const hostingCount = c.activeHostingCount ?? c.activeSubscriptionsCount ?? 0
    lines.push(
      `"${c.clientName}","${contact}",${c.propertyCount},${hostingCount},${c.totalBilled},${c.totalPaid},${c.totalOutstanding}`,
    )
  }
  lines.push('')

  lines.push('=== PROPERTY FINANCIAL SUMMARIES ===')
  lines.push('Property,Location,Client,Scan Revenue,Hosting Revenue,Total Collected,Total Billed,Outstanding')
  for (const p of properties) {
    lines.push(
      `"${p.propertyName}","${p.location || ''}","${p.clientName}",${p.scanRevenue},${p.hostingRevenue},${p.totalCollected},${p.totalBilled},${p.totalOutstanding}`,
    )
  }

  const csv = lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `twinspace-financial-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
