export type ListingStatus = 'available' | 'sold' | 'rented' | 'off_market'
export type ListingAccent = 'clay' | 'olive' | 'ink' | 'sand'

export const LISTING_STATUSES: { value: ListingStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Available', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'sold', label: 'Sold', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'rented', label: 'Rented', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'off_market', label: 'Off Market', color: 'text-ink-500 bg-ink-50 border-ink-200' },
]

export const PROPERTY_TYPES = [
  'Apartment',
  'Studio',
  'Penthouse',
  'Villa',
  'House',
  'Cottage',
  'Townhouse',
  'Office',
  'Commercial',
]

export const ACCENT_OPTIONS: { value: ListingAccent; label: string; from: string; to: string }[] = [
  { value: 'clay', label: 'Clay', from: '#d9a373', to: '#8c5a3c' },
  { value: 'olive', label: 'Olive', from: '#a9b48a', to: '#5f6b48' },
  { value: 'ink', label: 'Ink', from: '#4a4a55', to: '#1a1a22' },
  { value: 'sand', label: 'Sand', from: '#e3dcc9', to: '#b9a97e' },
]

/** Tailwind gradient class map — single source of truth used by form, card, and detail views. */
export const ACCENT_GRADIENTS: Record<ListingAccent, string> = {
  clay: 'from-[#d9a373] to-[#8c5a3c]',
  olive: 'from-[#a9b48a] to-[#5f6b48]',
  ink: 'from-[#4a4a55] to-[#1a1a22]',
  sand: 'from-[#e3dcc9] to-[#b9a97e]',
}


export type PaymentMethod = 'credit_card' | 'mpesa' | ''

export interface Listing {
  id: string
  name: string
  location: string
  city: string
  country: string
  price: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  size: string
  description: string
  amenities: string[]
  contactName: string
  contactEmail: string
  contactPhone: string
  datePaid: string
  paymentMethod: PaymentMethod
  tourUrl: string
  photoUrl: string
  status: ListingStatus
  published: boolean
  accent: ListingAccent
  createdAt: string
  updatedAt: string
}

export type ListingFormData = Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>

export const DEFAULT_LISTING_FORM: ListingFormData = {
  name: '',
  location: '',
  city: '',
  country: 'Kenya',
  price: '',
  propertyType: 'Apartment',
  bedrooms: 1,
  bathrooms: 1,
  size: '',
  description: '',
  amenities: [],
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  datePaid: '',
  paymentMethod: '',
  tourUrl: '',
  photoUrl: '',
  status: 'available',
  published: false,
  accent: 'clay',
}
