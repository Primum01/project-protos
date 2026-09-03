// One-shot script to end all active admin sessions in Firestore
// Run with: node scripts/clear-sessions.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
const envPath = resolve(__dirname, '../.env')
const env = {}
try {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && k.startsWith('VITE_')) env[k.trim()] = v.join('=').trim()
  })
} catch {
  console.error('Could not read .env file')
  process.exit(1)
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const snap = await getDocs(query(collection(db, 'admin_sessions'), where('active', '==', true)))

if (snap.empty) {
  console.log('✅ No active sessions found — Firestore is clean.')
} else {
  const now = new Date().toISOString()
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'admin_sessions', d.id), { active: false, endedAt: now })
    console.log(`🔴 Ended session for: ${d.data().user} (${d.id})`)
  }
  console.log(`\n✅ Cleared ${snap.docs.length} active session(s).`)
}

process.exit(0)
