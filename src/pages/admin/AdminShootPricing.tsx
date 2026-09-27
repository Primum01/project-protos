import { useEffect, useState } from 'react'
import {
  DEFAULT_SHOOT_PRICING,
  DEFAULT_PRICING_DISCOUNTS,
  subscribePricing,
  subscribeDiscounts,
  updateShootPrice,
  updateTimeframeDiscount,
  type ShootPricingPlan,
  type PricingDiscounts,
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

/* ── Single editable price row ───────────────────────────────────────────── */
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
            className="w-40 rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2 text-sm font-medium text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
            placeholder="e.g. Ksh 1,200"
          />
        </div>
        <span className="text-xs text-ink-500 font-medium whitespace-nowrap">/ mo baseline</span>
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

/* ── Timeframe discount config ───────────────────────────────────────────── */
interface TimeframeConfig {
  key: keyof PricingDiscounts
  label: string
  period: string
  description: string
}

const TIMEFRAMES: TimeframeConfig[] = [
  {
    key: 'quarterly',
    label: 'Quarterly',
    period: '3 Months',
    description: 'Percentage discount applied to the 3-month upfront billing package.',
  },
  {
    key: 'semiAnnually',
    label: 'Semi-annually',
    period: '6 Months',
    description: 'Percentage discount applied to the 6-month upfront billing package.',
  },
  {
    key: 'annually',
    label: 'Annually',
    period: '12 Months',
    description: 'Percentage discount applied to the 12-month annual billing package.',
  },
]

function TimeframeDiscountRow({
  timeframe,
  value,
}: {
  timeframe: TimeframeConfig
  value: number
}) {
  const [draft, setDraft] = useState(String(value))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const parsed = parseInt(draft, 10)
  const isDirty = !isNaN(parsed) && parsed !== value

  async function handleSave() {
    if (isNaN(parsed)) return
    if (parsed < 0 || parsed > 100) {
      setError('Percentage must be between 0% and 100%')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateTimeframeDiscount(timeframe.key, parsed)
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
      {/* Timeframe info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink-950">{timeframe.label}</p>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
            {timeframe.period}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-400">{timeframe.description}</p>
      </div>

      {/* Discount input */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <input
            id={`discount-${timeframe.key}`}
            type="number"
            min={0}
            max={100}
            step={1}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setSaved(false)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            className="w-24 rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2 text-sm font-semibold text-ink-950 transition-colors focus:border-brand-500 focus:outline-none"
          />
          <span className="ml-2 text-sm font-semibold text-ink-500">% off</span>
        </div>
      </div>

      {/* Save button / status */}
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

/* ── Live Preview ────────────────────────────────────────────────────────── */
function DiscountLivePreview({
  sampleMonthlyPrice,
  discounts,
}: {
  sampleMonthlyPrice: number
  discounts: PricingDiscounts
}) {
  const calculateTier = (months: number, pct: number) => {
    const raw = sampleMonthlyPrice * months
    const discount = Math.round(raw * (pct / 100))
    const finalPrice = Math.max(0, raw - discount)
    return { raw, discount, finalPrice }
  }

  const q = calculateTier(3, discounts.quarterly)
  const s = calculateTier(6, discounts.semiAnnually)
  const a = calculateTier(12, discounts.annually)

  return (
    <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          Live Calculation Preview (Sample: Ksh {sampleMonthlyPrice.toLocaleString()}/mo baseline)
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-paper p-3 border border-ink-950/8 shadow-2xs">
          <p className="text-[11px] font-medium text-ink-500">Quarterly (3 mo)</p>
          <p className="font-display text-base font-bold text-ink-950 mt-1">
            Ksh {q.finalPrice.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Saves {discounts.quarterly}% (Ksh {q.discount.toLocaleString()})
          </p>
        </div>
        <div className="rounded-lg bg-paper p-3 border border-ink-950/8 shadow-2xs">
          <p className="text-[11px] font-medium text-ink-500">Semi-annually (6 mo)</p>
          <p className="font-display text-base font-bold text-ink-950 mt-1">
            Ksh {s.finalPrice.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Saves {discounts.semiAnnually}% (Ksh {s.discount.toLocaleString()})
          </p>
        </div>
        <div className="rounded-lg bg-paper p-3 border border-ink-950/8 shadow-2xs">
          <p className="text-[11px] font-medium text-ink-500">Annually (12 mo)</p>
          <p className="font-display text-base font-bold text-ink-950 mt-1">
            Ksh {a.finalPrice.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Saves {discounts.annually}% (Ksh {a.discount.toLocaleString()})
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export function AdminShootPricing() {
  const [plans, setPlans] = useState<ShootPricingPlan[]>(DEFAULT_SHOOT_PRICING)
  const [discounts, setDiscounts] = useState<PricingDiscounts>(DEFAULT_PRICING_DISCOUNTS)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsubPlans = subscribePricing((data) => {
      setPlans(data)
      setLoading(false)
    })
    const unsubDiscounts = subscribeDiscounts((data) => {
      setDiscounts(data)
    })
    return () => {
      unsubPlans()
      unsubDiscounts()
    }
  }, [])

  // Find baseline price for preview (e.g. 1 Bedroom plan or first valid plan)
  const baselineDigits = plans.find((p) => p.id === '1-bedroom')?.price.replace(/[^\d]/g, '') || '1500'
  const sampleMonthlyVal = parseInt(baselineDigits, 10) || 1500

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink-950">Shoot Pricing & Discounts</h1>
        <p className="mt-1 text-sm text-ink-500">
          Configure baseline monthly prices for each plan tier and set percentage discounts for multi-month packages. The public{' '}
          <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
            /pricing
          </a>{' '}
          page uses these to calculate Quarterly, Semi-annually, and Annually packages automatically.
        </p>
      </div>

      {!isFirebaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Firebase not configured.</strong> Prices and discounts shown are defaults and cannot be saved.
        </div>
      )}

      {/* ── Section 1: Monthly Baseline Prices ─────────────────────────── */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-950">Baseline Monthly Prices</h2>
          <p className="text-xs text-ink-400">
            Set the base monthly rate for each tier. These baseline values determine package rates across all timeframes.
          </p>
        </div>

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
      </div>

      {/* ── Section 2: Timeframe Percentage Discounts ──────────────────── */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-950">Timeframe Percentage Discounts</h2>
          <p className="text-xs text-ink-400">
            Decide the exact percentage discount applied to each multi-month package. Each timeframe has its own field and updates live.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {TIMEFRAMES.map((tf) => (
            <TimeframeDiscountRow
              key={tf.key}
              timeframe={tf}
              value={discounts[tf.key]}
            />
          ))}
        </div>

        {/* Live Calculation Preview */}
        <DiscountLivePreview
          sampleMonthlyPrice={sampleMonthlyVal}
          discounts={discounts}
        />
      </div>

      {/* Enterprise note */}
      <div className="mt-8 rounded-xl border border-ink-950/8 bg-ink-50 px-5 py-4">
        <p className="text-sm font-medium text-ink-700">Enterprise / Custom</p>
        <p className="mt-1 text-xs text-ink-400">
          The Enterprise plan shows &quot;Custom&quot; pricing and links to your sales contact — no price to configure here.
        </p>
      </div>
    </div>
  )
}

