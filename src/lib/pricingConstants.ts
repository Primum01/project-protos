export interface ShootPricingPlan {
  id: 'studio' | '1-bedroom' | '2-bedroom'
  name: string
  price: string
  cadence: string
  description: string
  features: string[]
  highlighted?: boolean
  ctaLabel: string
}

export const DEFAULT_SHOOT_PRICING: ShootPricingPlan[] = [
  {
    id: 'studio',
    name: 'Studio Apartment',
    price: 'Ksh 1,200',
    cadence: '',
    description: 'Perfect for compact units and studios.',
    features: [
      'Matterport hosting',
      'Tour maintenance',
      'Link management',
      'Embedding support',
      'Minor updates',
      'Analytics/reporting',
      'Customer support',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: '1-bedroom',
    name: '1 Bedroom Apartment',
    price: 'Ksh 1,500',
    cadence: '',
    description: 'For single-bedroom property listings.',
    features: [
      'Matterport hosting',
      'Tour maintenance',
      'Link management',
      'Embedding support',
      'Minor updates',
      'Analytics/reporting',
      'Customer support',
    ],
    highlighted: true,
    ctaLabel: 'Get started',
  },
  {
    id: '2-bedroom',
    name: '2 Bedroom Apartment',
    price: 'Ksh 1,800',
    cadence: '',
    description: 'For larger multi-bedroom properties.',
    features: [
      'Matterport hosting',
      'Tour maintenance',
      'Link management',
      'Embedding support',
      'Minor updates',
      'Analytics/reporting',
      'Customer support',
    ],
    ctaLabel: 'Get started',
  },
]

export interface PricingDiscounts {
  quarterly: number
  semiAnnually: number
  annually: number
}

export const DEFAULT_PRICING_DISCOUNTS: PricingDiscounts = {
  quarterly: 10,
  semiAnnually: 15,
  annually: 20,
}
