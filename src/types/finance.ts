export type InvoiceStatus = 'draft' | 'generated' | 'sent' | 'paid' | 'overdue'

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
