export type InvoiceStatus =
  | 'draft'
  | 'generated'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'

export type BillingFrequency = 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual'

export interface SendingLog {
  id: string
  date: string
  method: 'email' | 'whatsapp'
  recipient: string
  status: 'sent' | 'prepared' | 'failed'
  error?: string
}

export interface FinanceItem {
  id: string
  description: string
  qty: number
  rate: number
}

export interface SavedInvoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  date?: string
  fullInvoiceDate: string
  clientName: string
  clientContact: string
  clientEmail?: string
  clientPhone?: string
  accountNumber?: string
  propertyName: string
  propertyLocation: string
  listingId?: string
  items: FinanceItem[]
  discount: number
  tax: number
  subtotal: number
  totalDue: number
  paymentMethod: string
  paymentDetails: string
  thankYouMessage: string
  tagline: string
  createdAt: string
  updatedAt: string

  // Semi-automated renewal extensions:
  status?: InvoiceStatus
  billingFrequency?: BillingFrequency
  periodStart?: string
  periodEnd?: string
  renewalDate?: string
  previousInvoiceId?: string
  receiptId?: string
  sendingHistory?: SendingLog[]
}

export interface SavedReceipt {
  id: string
  receiptNumber: string
  receiptDate: string
  date?: string
  fullPaymentDate: string
  clientName: string
  clientContact: string
  clientEmail?: string
  clientPhone?: string
  accountNumber?: string
  propertyName: string
  propertyLocation: string
  listingId?: string
  items: FinanceItem[]
  discount: number
  tax: number
  subtotal: number
  totalPaid: number
  paymentMethod: string
  transactionRef: string
  thankYouMessage: string
  tagline: string
  createdAt: string
  updatedAt: string

  // Linked invoice & renewal extensions:
  invoiceId?: string
  invoiceNumber?: string
  billingFrequency?: BillingFrequency
  renewalDate?: string
  sendingHistory?: SendingLog[]
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Transport',
  'Equipment',
  'Software',
  'Marketing',
  'Contractor',
  'Hosting/Infrastructure',
  'Office',
  'Communication',
  'Miscellaneous',
] as const

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number] | string

export interface ExpenseRecord {
  id: string
  date: string // YYYY-MM-DD
  category: ExpenseCategory
  description: string
  amount: number
  paymentMethod: string // 'M-Pesa' | 'Bank Transfer' | 'Cash' | 'Card' | 'Other'
  reference?: string
  notes?: string
  attachmentUrl?: string
  attachmentName?: string
  recordedBy?: string
  createdAt: string
  updatedAt: string
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
export type PaymentCategory = 'scan' | 'hosting' | 'other' | 'scan_shoot'
export type PaymentMethod = 'M-Pesa' | 'Bank Transfer' | 'Cash' | 'Card' | 'Other'

export interface PaymentRecord {
  id: string
  amount: number
  date: string // YYYY-MM-DD
  paymentMethod: string
  method: string // alias for paymentMethod
  reference?: string
  category: PaymentCategory
  clientName: string
  clientEmail?: string
  clientPhone?: string
  accountNumber?: string
  propertyName?: string
  listingId?: string
  invoiceId?: string
  invoiceNumber?: string
  receiptId?: string
  receiptNumber?: string
  notes?: string
  recordedBy?: string
  createdAt: string
  updatedAt: string
}

// ── UNIFIED FINANCIAL TRANSACTION (In-Memory Derived Ledger) ──────────────────
export type TransactionKind = 'income' | 'expense' | 'invoice'
export type TransactionStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'cancelled'

export interface UnifiedTransaction {
  id: string
  kind: TransactionKind
  type: string // e.g. 'Income', 'Expense'
  category?: 'scan' | 'hosting' | 'other'
  date: string
  clientName: string
  propertyName: string
  description: string
  amount: number
  status: TransactionStatus
  reference?: string
  sourceDocType: 'payment' | 'receipt' | 'invoice' | 'expense'
  sourceDocId: string
  paymentMethod?: string
}

// ── CLIENT & PROPERTY FINANCIAL SUMMARIES ─────────────────────────────────────
export interface FinanceClientSummary {
  clientName: string
  clientEmail?: string
  clientPhone?: string
  contactEmail?: string
  contactPhone?: string
  accountNumber?: string
  propertyCount: number
  properties: Array<{ id: string; name: string; location: string; package?: string }>
  totalBilled: number
  totalPaid: number
  totalOutstanding: number
  activeSubscriptionsCount: number
  activeHostingCount: number
  invoicesCount: number
  receiptsCount: number
}

export interface FinancePropertySummary {
  listingId: string
  propertyId: string
  propertyName: string
  location: string
  clientName: string
  accountNumber?: string
  hostingPackage?: string
  hostingStartDate?: string
  hostingRenewalDate?: string
  scanRevenue: number
  hostingRevenue: number
  totalRevenue: number
  totalCollected: number
  totalBilled: number
  outstanding: number
  totalOutstanding: number
}
