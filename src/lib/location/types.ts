/**
 * Centralized Location Autocomplete Types & Provider Interfaces
 */

export type LocationType = 'city' | 'county' | 'area' | 'country' | 'property' | 'all' | 'address'

export interface StructuredLocation {
  displayName?: string
  location?: string
  city?: string
  county?: string
  region?: string
  country?: string
  countryCode?: string
  latitude?: number
  longitude?: number
  placeId?: string
}

export interface LocationSuggestion {
  id: string
  name: string
  displayName: string
  type: LocationType
  city?: string
  county?: string
  region?: string
  country: string
  countryCode: string
  latitude?: number
  longitude?: number
  aliases?: string[]
  source?: 'standard' | 'external'
}

export interface LocationSearchOptions {
  query: string
  type?: LocationType
  country?: string
  limit?: number
}

export interface LocationProvider {
  name: string
  search(options: LocationSearchOptions): Promise<LocationSuggestion[]>
}
