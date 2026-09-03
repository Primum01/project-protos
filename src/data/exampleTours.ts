/**
 * Placeholder example-tour data for the marketing site (homepage grid, /tours,
 * /tour/:slug). Stands in for real published Tour + Property documents until
 * hosts publish real listings. No photography is faked; cards use design-
 * system gradients instead of stock imagery.
 */
export interface ExampleTour {
  slug: string
  title: string
  location?: string
  city: string
  country: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  accent: 'clay' | 'olive' | 'ink' | 'sand'
  description: string
  amenities: string[]
  /** When set, clicking the card / tour detail opens this URL instead of the placeholder viewer. */
  externalUrl?: string
}

export const exampleTours: ExampleTour[] = [
  {
    slug: 'westlands-skyline-loft',
    title: 'Westlands Skyline Loft',
    location: 'Westlands',
    city: 'Nairobi',
    country: 'Kenya',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    accent: 'clay',
    description:
      'A light-filled loft on the 14th floor with panoramic city views, walking distance to the business district.',
    amenities: ['Fast Wi-Fi', 'Smart TV', 'Rooftop access', 'Workspace'],
  },
  {
    slug: 'diani-beach-villa',
    title: 'Diani Beach Villa',
    location: 'Diani',
    city: 'Diani',
    country: 'Kenya',
    propertyType: 'Villa',
    bedrooms: 4,
    bathrooms: 3,
    accent: 'olive',
    description:
      'A private beachfront villa with an infinity pool, open-air living areas, and direct ocean access.',
    amenities: ['Private pool', 'Ocean view', 'Chef kitchen', 'Garden'],
  },
  {
    slug: 'karen-garden-cottage',
    title: 'Karen Garden Cottage',
    location: 'Karen',
    city: 'Nairobi',
    country: 'Kenya',
    propertyType: 'Cottage',
    bedrooms: 1,
    bathrooms: 1,
    accent: 'sand',
    description:
      'A quiet cottage tucked into a forested garden, ideal for remote work or a weekend escape.',
    amenities: ['Fireplace', 'Garden', 'Fast Wi-Fi', 'Parking'],
  },
  {
    slug: 'lamu-rooftop-house',
    title: 'Lamu Rooftop House',
    location: 'Lamu',
    city: 'Lamu',
    country: 'Kenya',
    propertyType: 'House',
    bedrooms: 3,
    bathrooms: 2,
    accent: 'ink',
    description:
      'A traditional Swahili house with a rooftop terrace overlooking the old town and harbour.',
    amenities: ['Rooftop terrace', 'Sea view', 'Courtyard', 'Air conditioning'],
  },
  {
    slug: 'winchester-gardens',
    title: 'Winchester Gardens',
    location: 'Parklands',
    city: 'Nairobi',
    country: 'Kenya',
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 2,
    accent: 'olive',
    description:
      'A beautifully presented apartment set within the popular Winchester Gardens development, featuring spacious open-plan living and a private balcony.',
    amenities: ['Private balcony', 'Secure parking', 'Swimming pool', 'Gym', 'Fast Wi-Fi', '24hr security'],
    externalUrl: 'https://my.matterport.com/show/?m=f7gfWaWAkop',
  },
]
