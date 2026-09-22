// Seed script using Firestore REST API (bypasses gRPC / SDK rule-propagation delays)
// Run with: node scripts/seed-listings.mjs

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')

const env = {}
if (existsSync(envPath)) {
  try {
    readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const [k, ...v] = trimmed.split('=')
      if (k) env[k.trim()] = v.join('=').trim()
    })
  } catch {}
}

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID
const API_KEY = process.env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL
const password = process.argv[2] || process.env.ADMIN_PASSWORD

if (!PROJECT_ID || !API_KEY) {
  console.error('❌ Missing Firebase configuration. Please set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in your environment or .env file.')
  process.exit(1)
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

let authHeaders = {}
if (password && ADMIN_EMAIL) {
  console.log(`🔐 Authenticating as ${ADMIN_EMAIL}...`)
  try {
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password, returnSecureToken: true }),
      },
    )
    const authData = await authRes.json()
    if (authRes.ok) {
      authHeaders = { Authorization: `Bearer ${authData.idToken}` }
      console.log('✅ Authenticated as admin.\n')
    } else {
      console.warn('⚠️ Authentication failed:', authData.error?.message ?? authRes.status)
    }
  } catch (err) {
    console.warn('⚠️ Auth request error:', err.message)
  }
}

const now = new Date().toISOString()

// Convert a plain JS value into a Firestore REST API field value
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number') return { integerValue: String(val) }
  if (typeof val === 'string') return { stringValue: val }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } }
  if (typeof val === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k, v]) => [k, toFirestoreValue(v)])) } }
  return { stringValue: String(val) }
}

function toFirestoreDoc(obj) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFirestoreValue(v)])) }
}

const listings = [
  {
    id: 'westlands-skyline-loft',
    name: 'Westlands Skyline Loft',
    location: 'Westlands', city: 'Nairobi', country: 'Kenya',
    price: 'KES 85,000/mo', propertyType: 'Apartment', bedrooms: 2, bathrooms: 2, size: '95 sqm',
    description: 'A light-filled loft on the 14th floor with panoramic city views, walking distance to the business district.',
    amenities: ['Fast Wi-Fi', 'Smart TV', 'Rooftop access', 'Workspace'],
    contactName: 'TwinSpace Team', contactEmail: 'info@twinspace360.com', contactPhone: '',
    datePaid: '', paymentMethod: '', tourUrl: '', photoUrl: '',
    status: 'available', published: false, deactivated: false, deactivationReason: '',
    accent: 'clay', createdAt: now, updatedAt: now,
  },
  {
    id: 'diani-beach-villa',
    name: 'Diani Beach Villa',
    location: 'Diani', city: 'Diani', country: 'Kenya',
    price: 'KES 250,000/mo', propertyType: 'Villa', bedrooms: 4, bathrooms: 3, size: '320 sqm',
    description: 'A private beachfront villa with an infinity pool, open-air living areas, and direct ocean access.',
    amenities: ['Private pool', 'Ocean view', 'Chef kitchen', 'Garden'],
    contactName: 'TwinSpace Team', contactEmail: 'info@twinspace360.com', contactPhone: '',
    datePaid: '', paymentMethod: '', tourUrl: '', photoUrl: '',
    status: 'available', published: false, deactivated: false, deactivationReason: '',
    accent: 'olive', createdAt: now, updatedAt: now,
  },
  {
    id: 'karen-garden-cottage',
    name: 'Karen Garden Cottage',
    location: 'Karen', city: 'Nairobi', country: 'Kenya',
    price: 'KES 55,000/mo', propertyType: 'Cottage', bedrooms: 1, bathrooms: 1, size: '60 sqm',
    description: 'A quiet cottage tucked into a forested garden, ideal for remote work or a weekend escape.',
    amenities: ['Fireplace', 'Garden', 'Fast Wi-Fi', 'Parking'],
    contactName: 'TwinSpace Team', contactEmail: 'info@twinspace360.com', contactPhone: '',
    datePaid: '', paymentMethod: '', tourUrl: '', photoUrl: '',
    status: 'available', published: false, deactivated: false, deactivationReason: '',
    accent: 'sand', createdAt: now, updatedAt: now,
  },
  {
    id: 'lamu-rooftop-house',
    name: 'Lamu Rooftop House',
    location: 'Lamu', city: 'Lamu', country: 'Kenya',
    price: 'KES 120,000/mo', propertyType: 'House', bedrooms: 3, bathrooms: 2, size: '180 sqm',
    description: 'A traditional Swahili house with a rooftop terrace overlooking the old town and harbour.',
    amenities: ['Rooftop terrace', 'Sea view', 'Courtyard', 'Air conditioning'],
    contactName: 'TwinSpace Team', contactEmail: 'info@twinspace360.com', contactPhone: '',
    datePaid: '', paymentMethod: '', tourUrl: '', photoUrl: '',
    status: 'available', published: false, deactivated: false, deactivationReason: '',
    accent: 'ink', createdAt: now, updatedAt: now,
  },
  {
    id: 'winchester-gardens',
    name: 'Winchester Gardens',
    location: 'Parklands', city: 'Nairobi', country: 'Kenya',
    price: 'KES 110,000/mo', propertyType: 'Apartment', bedrooms: 3, bathrooms: 2, size: '145 sqm',
    description: 'A beautifully presented apartment set within the popular Winchester Gardens development, featuring spacious open-plan living and a private balcony.',
    amenities: ['Private balcony', 'Secure parking', 'Swimming pool', 'Gym', 'Fast Wi-Fi', '24hr security'],
    contactName: 'TwinSpace Team', contactEmail: 'info@twinspace360.com', contactPhone: '',
    datePaid: '', paymentMethod: '', tourUrl: 'https://my.matterport.com/show/?m=f7gfWaWAkop', photoUrl: '',
    status: 'available', published: false, deactivated: false, deactivationReason: '',
    accent: 'olive', createdAt: now, updatedAt: now,
  },
]

console.log(`\n🌱 Seeding ${listings.length} listings via Firestore REST API...\n`)

let success = 0
for (const listing of listings) {
  const { id, ...data } = listing
  const url = `${BASE_URL}/listings/${id}?key=${API_KEY}`

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(toFirestoreDoc(data)),
  })

  if (res.ok) {
    console.log(`  ✅ ${listing.name}`)
    success++
  } else {
    const err = await res.json()
    console.error(`  ❌ ${listing.name}: ${err.error?.message ?? res.status}`)
  }
}

console.log(`\n${success === listings.length ? '✨' : '⚠️'} ${success}/${listings.length} listings seeded.`)
if (success > 0) {
  console.log('   They appear in the admin console as unpublished drafts.')
  console.log('   Use the admin to edit, publish, or update prices.\n')
}
process.exit(success === listings.length ? 0 : 1)
