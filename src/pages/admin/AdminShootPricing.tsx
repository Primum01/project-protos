import { useEffect, useState } from 'react'
import {
  DEFAULT_SHOOT_PRICING,
  subscribePricing,
  updateShootPrice,
  type ShootPricingPlan,
} from '@/lib/firebase/pricing'
import { isFirebaseConfigured } from '@/lib/firebase/config'

/* ── Tick icon ───────────────────────────────────────────────────────────── */
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ── Single editable row ─────────────────────────────────────────────────── */
function PricingRow({ plan }: { plan: ShootPricingPlan }) {
  const [draft, setDraft] = useState(plan.price)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Sync if parent updates (e.g. Firestore push)
  useEffect(() => { setDraft(plan.price) }, [plan.price])

  const isDirty = draft.trim() !== plan.price.trim()

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateShootPrice(plan.id, draft.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-950/8 bg-paper p-5 shadow-soft sm:flex-row sm:items-center sm:gap-6">
      {/* Plan info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink-950">{plan.name}</p>
          {plan.highlighted && (
            <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600">
              Popular
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-400">{plan.description}</p>
      </div>

      {/* Price input */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            id={`price-${plan.id}`}
            type="text"
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSaved(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            className="w-44 rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2 text-sm font-medium text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
            placeholder="e.g. Ksh 1,200"
          />
        </div>
        <span className="shrink-0 text-sm text-ink-400">{plan.cadence}</span>
      </div>

      {/* Save / status */}
      <div className="flex shrink-0 items-center gap-2">
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <IconCheck /> Saved
          </span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600 sm:col-span-full">{error}</p>
      )}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export function AdminShootPricing() {
  const [plans, setPlans] = useState<ShootPricingPlan[]>(DEFAULT_SHOOT_PRICING)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = subscribePricing((data) => {
      setPlans(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink-950">Shoot Pricing</h1>
        <p className="mt-1 text-sm text-ink-500">
          Edit the prices that appear on the public{' '}
          <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            /pricing
          </a>{' '}
          page. Changes go live instantly.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Firebase not configured.</strong> Prices shown are defaults and cannot be saved.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
            <PricingRow key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* Enterprise note */}
      <div className="mt-8 rounded-xl border border-ink-950/8 bg-ink-50 px-5 py-4">
        <p className="text-sm font-medium text-ink-700">Enterprise / Custom</p>
        <p className="mt-1 text-xs text-ink-400">
          The Enterprise plan shows "Custom" pricing and links to your sales contact — no price to configure here.
        </p>
      </div>
    </div>
  )
}
