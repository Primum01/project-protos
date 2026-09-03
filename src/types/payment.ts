export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export interface Payment {
  paymentId: string
  userId: string
  propertyId: string | null
  packageId: string
  amount: number
  currency: string
  status: PaymentStatus
  provider: string
  transactionReference: string | null
  createdAt: string
}
