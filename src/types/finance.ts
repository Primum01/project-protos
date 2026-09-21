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
}

export interface SavedReceipt {
  id: string
  receiptNumber: string
  receiptDate: string
  fullPaymentDate: string
  clientName: string
  clientContact: string
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
}
