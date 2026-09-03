export type PropertyStatus = 'draft' | 'active' | 'archived' | 'suspended'

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'condo'
  | 'cabin'
  | 'hotel_room'
  | 'other'

export interface PropertyPhoto {
  id: string
  url: string
  alt: string
  order: number
}

export interface Property {
  propertyId: string
  ownerId: string
  name: string
  description: string
  address: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  propertyType: PropertyType
  bedrooms: number
  bathrooms: number
  amenities: string[]
  photos: PropertyPhoto[]
  bookingUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: PropertyStatus
  createdAt: string
  updatedAt: string
}
