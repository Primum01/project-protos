import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore'
import { getFirebaseApp } from './config'

function db() {
  return getFirestore(getFirebaseApp())
}

/* ── Types ─────────────────────────────────────────────────────────────── */
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

/* ── Hardcoded defaults (used until admin has saved a price) ─────────── */
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

const COLLECTION = 'pricing'

/**
 * Subscribe to live shoot pricing from Firestore.
 * Merges each document's `price` field over the defaults — so only the price
 * needs to be stored, not the full plan object.
 */
export function subscribePricing(
  callback: (plans: ShootPricingPlan[]) => void,
): () => void {
  const unsubs: (() => void)[] = []

  // We track how many docs have resolved so we can call callback once all 3 are ready
  const resolved: Record<string, string> = {}
  let fired = false

  for (const plan of DEFAULT_SHOOT_PRICING) {
    const ref = doc(db(), COLLECTION, plan.id)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { price?: string }
          if (data.price) resolved[plan.id] = data.price
        }
        fired = true
        // Merge resolved prices over defaults on every update
        const merged = DEFAULT_SHOOT_PRICING.map((p) => ({
          ...p,
          price: resolved[p.id] ?? p.price,
        }))
        callback(merged)
      },
      (err) => {
        console.error(`[Firestore] pricing/${plan.id} error:`, err.message)
        if (!fired) {
          fired = true
          callback(DEFAULT_SHOOT_PRICING)
        }
      },
    )
    unsubs.push(unsub)
  }

  return () => unsubs.forEach((u) => u())
}

/** Write only the price field for a single plan. */
export async function updateShootPrice(
  id: ShootPricingPlan['id'],
  price: string,
): Promise<void> {
  await setDoc(doc(db(), COLLECTION, id), { price }, { merge: true })
}
