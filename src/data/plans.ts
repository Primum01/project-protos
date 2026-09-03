/**
 * Placeholder pricing config for the marketing site. This is a stand-in for a
 * future Firestore-backed `plans` collection (see spec section 25: pricing
 * must be configurable, not hardcoded across the app). Until that exists,
 * every price on the site reads from here, not from inline JSX.
 */
export interface PricingPlan {
  id: string
  name: string
  price: string
  cadence: string
  description: string
  features: string[]
  highlighted?: boolean
  ctaLabel: string
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'studio',
    name: 'Studio Apartment',
    price: 'Ksh 1,200',
    cadence: '/month',
    description: 'For hosts trying 3D tours on a single property.',
    features: [
      '1 published tour',
      'Standard 3D viewer',
      'Photo gallery',
      'Booking & contact CTA',
      'Basic tour analytics',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: '1-bedroom',
    name: '1 Bedroom Apartment',
    price: 'Ksh 1,500',
    cadence: '/month',
    description: 'For hosts managing a single-bedroom property listing.',
    features: [
      'Up to 3 published tours',
      'Priority capture scheduling',
      'Hotspots & room navigation',
      'Full analytics dashboard',
      'Embeddable tours',
    ],
    highlighted: true,
    ctaLabel: 'Get started',
  },
  {
    id: '2-bedroom',
    name: '2 Bedroom Apartment',
    price: 'Ksh 1,800',
    cadence: '/month',
    description: 'For property managers scaling across multi-bedroom listings.',
    features: [
      'Unlimited published tours',
      'Priority capture scheduling',
      'Hotspots & room navigation',
      'Full analytics dashboard',
      'Embeddable tours',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For hotel groups and portfolios that need custom branding.',
    features: [
      'Everything in Growth',
      'Custom branding & domain',
      'Dedicated account manager',
      'API access',
      'SLA-backed support',
    ],
    ctaLabel: 'Talk to sales',
  },
]
