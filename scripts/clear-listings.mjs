// Deletes all documents in the `listings` collection via Firestore REST API
// Authenticates as admin to pass security rules
// Run with: node scripts/clear-listings.mjs [password]

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

if (!PROJECT_ID || !API_KEY) {
  console.error('❌ Missing Firebase configuration. Please set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in your environment or .env file.')
  process.exit(1)
}

if (!ADMIN_EMAIL) {
  console.error('❌ Missing Admin email. Please set ADMIN_EMAIL in your environment or .env file.')
  process.exit(1)
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const password = process.argv[2] || process.env.ADMIN_PASSWORD

let headers = {}

if (password) {
  console.log(`🔐 Authenticating as ${ADMIN_EMAIL}...`)
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password, returnSecureToken: true }),
    },
  )
  const authData = await authRes.json()
  if (!authRes.ok) {
    console.error('❌ Authentication failed:', authData.error?.message ?? authRes.status)
    process.exit(1)
  }
  headers = { Authorization: `Bearer ${authData.idToken}` }
  console.log('✅ Authenticated as admin.\n')
} else {
  console.log(`ℹ️  No password provided. Attempting request directly (or pass password as: node scripts/clear-listings.mjs <password>)...\n`)
}

// List documents in the listings collection
const listUrl = `${BASE_URL}/listings?key=${API_KEY}&pageSize=100`
const listRes = await fetch(listUrl, { headers })
const listData = await listRes.json()

if (!listRes.ok) {
  console.error('Failed to list listings:', listData.error?.message ?? listRes.status)
  if (listRes.status === 403) {
    console.log('\n🔒 Firestore rules require admin authentication.')
    console.log('👉 Run with: node scripts/clear-listings.mjs <your-password>')
  }
  process.exit(1)
}

const docs = listData.documents ?? []
if (docs.length === 0) {
  console.log('No listings found — nothing to delete.')
  process.exit(0)
}

console.log(`\n🗑️  Deleting ${docs.length} listing(s)...\n`)

let success = 0
for (const doc of docs) {
  const deleteUrl = `https://firestore.googleapis.com/v1/${doc.name}?key=${API_KEY}`
  const res = await fetch(deleteUrl, { method: 'DELETE', headers })
  const shortName = doc.name.split('/').pop()
  if (res.ok) {
    console.log(`  ✅ Deleted: ${shortName}`)
    success++
  } else {
    const err = await res.json().catch(() => ({}))
    console.error(`  ❌ Failed: ${shortName} — ${err.error?.message ?? res.status}`)
  }
}

console.log(`\n${success === docs.length ? '✨' : '⚠️'} ${success}/${docs.length} listings deleted.\n`)
process.exit(success === docs.length ? 0 : 1)
