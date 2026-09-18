import { useEffect, useState } from 'react'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Button, Card, Section } from '@/components/ui'
import { cn } from '@/lib/cn'
import { usePageMeta } from '@/hooks/usePageMeta'
import { subscribePricing, DEFAULT_SHOOT_PRICING, type ShootPricingPlan } from '@/lib/firebase/pricing'
import { isFirebaseConfigured } from '@/lib/firebase/config'

/* ── Credit-card number formatter ─────────────────────────────── */
function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

/* ── Payment option card ───────────────────────────────────────── */
type Method = 'mpesa' | 'card' | null

function MpesaDetail() {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#4caf50]/30 bg-[#f0fdf0] p-6 shadow-inner">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-[#2e7d32]">
        M-Pesa Paybill Instructions
      </p>
      <ol className="mb-5 space-y-2 text-sm text-[#1b5e20]">
        <li className="flex gap-2"><span className="font-bold">1.</span> Go to <strong>M-Pesa</strong> → <strong>Lipa na M-Pesa</strong> → <strong>Paybill</strong></li>
        <li className="flex gap-2"><span className="font-bold">2.</span> Enter Business Number below</li>
        <li className="flex gap-2"><span className="font-bold">3.</span> Enter Account Number below</li>
        <li className="flex gap-2"><span className="font-bold">4.</span> Enter the amount and your M-Pesa PIN</li>
      </ol>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#4caf50]/40 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#4caf50] font-medium">Paybill Number</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-widest text-[#1b5e20]">
            123456
          </p>
        </div>
        <div className="rounded-xl border border-[#4caf50]/40 bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#4caf50] font-medium">Account Number</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-widest text-[#1b5e20]">
            TS-0001
          </p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-[#4caf50]/70">
        You will receive a confirmation SMS from M-Pesa once payment is complete.
      </p>
    </div>
  )
}

function CardDetail() {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [submitted, setSubmitted] = useState(false)

  /* Detect card type for logo */
  const isVisa = number.replace(/\s/g, '').startsWith('4')
  const isMaster = /^5[1-5]/.test(number.replace(/\s/g, ''))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mt-5 rounded-2xl border border-ink-950/8 bg-paper p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-semibold text-ink-950">Payment details received!</p>
        <p className="mt-1 text-sm text-ink-500">Our team will process your payment and get in touch shortly.</p>
        <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-brand-600 hover:underline">
          ← Start over
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-ink-950/8 bg-paper shadow-soft">
      {/* Decorative card preview */}
      <div className="relative flex h-40 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-800 to-ink-950 p-6">
        {/* Circles decoration */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-10 h-48 w-48 rounded-full bg-white/5" />
        {/* Card logo */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded-full bg-red-500/80" />
            <div className="-ml-3 h-6 w-6 rounded-full bg-amber-400/80" />
          </div>
          {isVisa && <span className="font-display text-xl font-bold italic text-white tracking-widest">VISA</span>}
          {isMaster && <span className="text-xs font-bold text-white/80">MasterCard</span>}
        </div>
        {/* Chip + number */}
        <div>
          <div className="mb-2 h-5 w-7 rounded-sm bg-amber-300/70" />
          <p className="font-mono text-sm tracking-[0.2em] text-white/90">
            {number || '•••• •••• •••• ••••'}
          </p>
          <div className="mt-1 flex justify-between text-xs text-white/50">
            <span>{name || 'CARDHOLDER NAME'}</span>
            <span>{expiry || 'MM/YY'}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div>
          <label htmlFor="cc-number" className="mb-1.5 block text-xs font-medium text-ink-600">Card number</label>
          <input
            id="cc-number"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            required
            className="w-full rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2.5 font-mono text-sm tracking-widest text-ink-950 placeholder:tracking-normal placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="cc-name" className="mb-1.5 block text-xs font-medium text-ink-600">Cardholder name</label>
          <input
            id="cc-name"
            placeholder="Jane Mwangi"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            required
            className="w-full rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2.5 text-sm uppercase tracking-wider text-ink-950 placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cc-expiry" className="mb-1.5 block text-xs font-medium text-ink-600">Expiry</label>
            <input
              id="cc-expiry"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              required
              className="w-full rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2.5 font-mono text-sm text-ink-950 placeholder:font-sans placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cc-cvv" className="mb-1.5 block text-xs font-medium text-ink-600">CVV</label>
            <input
              id="cc-cvv"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              className="w-full rounded-lg border border-ink-950/15 bg-ink-50 px-3.5 py-2.5 font-mono text-sm text-ink-950 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <Button type="submit" className="mt-1 w-full">
          Submit payment details
        </Button>
        <p className="text-center text-xs text-ink-400">
          🔒 Your details are encrypted and secure
        </p>
      </form>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────── */
export function Pricing() {
  const [activeMethod, setActiveMethod] = useState<Method>(null)
  const [plans, setPlans] = useState<ShootPricingPlan[]>(DEFAULT_SHOOT_PRICING)
  const [plansLoading, setPlansLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = subscribePricing((data) => {
      setPlans(data)
      setPlansLoading(false)
    })
    return unsub
  }, [])

  usePageMeta({
    title: 'Pricing — Simple Plans for Every Host',
    description:
      'Start free with one property tour, then scale as your portfolio grows. No long-term contracts. Pay via M-Pesa or card.',
    path: '/pricing',
  })

  function toggle(method: Method) {
    setActiveMethod((prev) => (prev === method ? null : method))
  }

  // Enterprise plan is static — no price to configure
  const enterprisePlan = {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For hotel groups and portfolios that need custom branding.',
    features: [
      'Everything in 2 Bedroom',
      'Custom branding & domain',
      'Dedicated account manager',
      'API access',
      'SLA-backed support',
    ],
    ctaLabel: 'Talk to sales',
  }

  const allPlans = [...plans, enterprisePlan]

  return (
    <MarketingLayout>
      <div className="h-20" />

      {/* Pricing plans */}
      <Section
        eyebrow="Pricing"
        title="Simple pricing that scales with your portfolio"
        description="Start free with one property, then add tours as you grow. No long-term contracts."
        align="center"
      >
        {plansLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-ink-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {allPlans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col gap-6 p-8',
                  'highlighted' in plan && (plan as { highlighted?: boolean }).highlighted && 'border-brand-500 ring-1 ring-brand-500',
                )}
              >
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                    {plan.name}
                  </h3>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl text-ink-950">{plan.price}</span>
                    {plan.cadence && (
                      <span className="text-sm text-ink-500">{plan.cadence}</span>
                    )}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{plan.description}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button href="/contact" variant="secondary" className="w-full">
                  {plan.ctaLabel}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* ── Payment options ───────────────────────────────────────── */}
      <Section
        eyebrow="Payment"
        title="How would you like to pay?"
        description="Choose a payment method below to get started."
        align="center"
      >
        <div className="mx-auto max-w-2xl">
          {/* Method selector cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* M-Pesa */}
            <button
              id="mpesa-option-btn"
              type="button"
              onClick={() => toggle('mpesa')}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200',
                activeMethod === 'mpesa'
                  ? 'border-[#4caf50] bg-[#f0fdf0] shadow-lg'
                  : 'border-ink-950/10 bg-paper hover:border-[#4caf50]/50 hover:bg-[#f0fdf0]/60 hover:shadow-md',
              )}
            >
              <div className={cn(
                'flex h-16 w-full max-w-[8rem] items-center justify-center overflow-hidden rounded-xl transition-all',
                activeMethod === 'mpesa' ? 'ring-2 ring-[#4caf50]/40' : 'group-hover:ring-2 group-hover:ring-[#4caf50]/20',
              )}>
                <img
                  src="/mpesa-logo.png"
                  alt="M-Pesa"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className={cn(
                'text-sm font-semibold transition-colors',
                activeMethod === 'mpesa' ? 'text-[#2e7d32]' : 'text-ink-700',
              )}>
                Pay via M-Pesa
              </span>
              <span className={cn(
                'text-xs transition-colors',
                activeMethod === 'mpesa' ? 'text-[#4caf50]' : 'text-ink-400',
              )}>
                {activeMethod === 'mpesa' ? 'See details below ↓' : 'Tap to view Paybill details'}
              </span>
            </button>

            {/* Credit card */}
            <button
              id="card-option-btn"
              type="button"
              onClick={() => toggle('card')}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200',
                activeMethod === 'card'
                  ? 'border-brand-500 bg-ink-950 shadow-lg'
                  : 'border-ink-950/10 bg-paper hover:border-brand-500/50 hover:bg-ink-50 hover:shadow-md',
              )}
            >
              {/* Decorative card icon */}
              <div className={cn(
                'flex h-16 w-full max-w-[8rem] items-center justify-center rounded-xl transition-all',
                activeMethod === 'card'
                  ? 'bg-gradient-to-br from-ink-700 to-ink-900 ring-2 ring-brand-500/40'
                  : 'bg-gradient-to-br from-ink-100 to-ink-200 group-hover:from-ink-200 group-hover:to-ink-300',
              )}>
                <div className="space-y-1.5 px-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      <div className={cn('h-4 w-4 rounded-full', activeMethod === 'card' ? 'bg-red-400/80' : 'bg-red-300')} />
                      <div className={cn('-ml-2 h-4 w-4 rounded-full', activeMethod === 'card' ? 'bg-amber-300/80' : 'bg-amber-200')} />
                    </div>
                    <div className={cn('h-3 w-5 rounded-sm', activeMethod === 'card' ? 'bg-amber-300/70' : 'bg-amber-200/70')} />
                  </div>
                  <div className={cn('h-1.5 w-full rounded-full', activeMethod === 'card' ? 'bg-white/20' : 'bg-ink-300/40')} />
                  <div className={cn('h-1.5 w-3/4 rounded-full', activeMethod === 'card' ? 'bg-white/10' : 'bg-ink-300/30')} />
                </div>
              </div>
              <span className={cn(
                'text-sm font-semibold transition-colors',
                activeMethod === 'card' ? 'text-white' : 'text-ink-700',
              )}>
                Credit / Debit Card
              </span>
              <span className={cn(
                'text-xs transition-colors',
                activeMethod === 'card' ? 'text-brand-300' : 'text-ink-400',
              )}>
                {activeMethod === 'card' ? 'Enter details below ↓' : 'Visa, Mastercard & more'}
              </span>
            </button>
          </div>

          {/* Expanded content */}
          {activeMethod === 'mpesa' && <MpesaDetail />}
          {activeMethod === 'card' && <CardDetail />}
        </div>
      </Section>
    </MarketingLayout>
  )
}

