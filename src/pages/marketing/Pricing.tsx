import { useEffect, useRef, useState } from 'react'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Button, Card, Section } from '@/components/ui'
import { SkeletonPricing } from '@/components/skeleton'
import { cn } from '@/lib/cn'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  subscribePricing,
  subscribeDiscounts,
  DEFAULT_SHOOT_PRICING,
  DEFAULT_PRICING_DISCOUNTS,
  type ShootPricingPlan,
  type PricingDiscounts,
} from '@/lib/firebase/pricing'
import { isFirebaseConfigured } from '@/lib/firebase/config'



/* ── Billing cycle calculation helpers ─────────────────────────── */
type BillingCycle = 'quarterly' | 'semi-annually' | 'annually'

const BILLING_CYCLES: BillingCycle[] = ['quarterly', 'semi-annually', 'annually']

interface PlanPricingDisplay {
  displayPrice: string
  originalPrice: string | null
  savingsPct: number | null
  savingsKsh: number | null
}

function getPlanPricing(
  rawPrice: string,
  cycle: BillingCycle,
  discounts: PricingDiscounts = DEFAULT_PRICING_DISCOUNTS,
): PlanPricingDisplay {
  const digits = rawPrice.replace(/[^\d]/g, '')
  if (!digits) {
    return {
      displayPrice: rawPrice,
      originalPrice: null,
      savingsPct: null,
      savingsKsh: null,
    }
  }

  const monthlyVal = parseInt(digits, 10)
  if (isNaN(monthlyVal) || monthlyVal <= 0) {
    return {
      displayPrice: rawPrice,
      originalPrice: null,
      savingsPct: null,
      savingsKsh: null,
    }
  }

  const months = cycle === 'quarterly' ? 3 : cycle === 'semi-annually' ? 6 : 12
  const pct = cycle === 'quarterly'
    ? (discounts.quarterly ?? 10)
    : cycle === 'semi-annually'
    ? (discounts.semiAnnually ?? 15)
    : (discounts.annually ?? 20)

  const rawTotal = monthlyVal * months
  const discountKsh = Math.round(rawTotal * (pct / 100))
  const finalPrice = Math.max(0, rawTotal - discountKsh)

  return {
    displayPrice: `Ksh ${finalPrice.toLocaleString()}`,
    originalPrice: pct > 0 ? `Ksh ${rawTotal.toLocaleString()}` : null,
    savingsPct: pct > 0 ? pct : null,
    savingsKsh: pct > 0 ? discountKsh : null,
  }
}

/* ── Main page ─────────────────────────────────────────────────── */
export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('quarterly')
  const [plans, setPlans] = useState<ShootPricingPlan[]>(DEFAULT_SHOOT_PRICING)
  const [discounts, setDiscounts] = useState<PricingDiscounts>(DEFAULT_PRICING_DISCOUNTS)
  const [plansLoading, setPlansLoading] = useState(isFirebaseConfigured)


  // Per-billing-cycle active card indices for mobile carousel
  const [cycleIndices, setCycleIndices] = useState<Record<BillingCycle, number>>({
    quarterly: 0,
    'semi-annually': 0,
    annually: 0,
  })

  // Container refs per billing cycle to track scroll positions independently
  const containerRefs = useRef<Record<BillingCycle, HTMLDivElement | null>>({
    quarterly: null,
    'semi-annually': null,
    annually: null,
  })

  // Automatically detect which card is centered as the user swipes horizontally on mobile
  const handleScroll = (cycle: BillingCycle) => {
    const container = containerRefs.current[cycle]
    if (!container) return

    const scrollLeft = container.scrollLeft
    const containerWidth = container.clientWidth
    const containerCenter = scrollLeft + containerWidth / 2

    const children = Array.from(container.children) as HTMLElement[]
    if (!children.length) return

    let closestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const childCenter = child.offsetLeft + child.offsetWidth / 2
      const dist = Math.abs(containerCenter - childCenter)
      if (dist < minDistance) {
        minDistance = dist
        closestIndex = i
      }
    }

    setCycleIndices((prev) => {
      if (prev[cycle] === closestIndex) return prev
      return { ...prev, [cycle]: closestIndex }
    })
  }

  // Smooth scroll to card when user taps a pagination dot
  const scrollToCard = (cycle: BillingCycle, index: number) => {
    const container = containerRefs.current[cycle]
    if (!container) return
    const children = Array.from(container.children) as HTMLElement[]
    const targetChild = children[index]
    if (targetChild) {
      const targetCenter = targetChild.offsetLeft + targetChild.offsetWidth / 2
      const targetScrollLeft = targetCenter - container.clientWidth / 2
      container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' })
      setCycleIndices((prev) => ({ ...prev, [cycle]: index }))
    }
  }

  // When switching billing cycle, align scroll position to that cycle's active card
  useEffect(() => {
    const targetIndex = cycleIndices[billingCycle] ?? 0
    const container = containerRefs.current[billingCycle]
    if (container) {
      const children = Array.from(container.children) as HTMLElement[]
      const targetChild = children[targetIndex]
      if (targetChild) {
        const targetCenter = targetChild.offsetLeft + targetChild.offsetWidth / 2
        const targetScrollLeft = targetCenter - container.clientWidth / 2
        container.scrollTo({ left: targetScrollLeft, behavior: 'instant' as ScrollBehavior })
      }
    }
  }, [billingCycle])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsubPricing = subscribePricing((data) => {
      setPlans(data)
      setPlansLoading(false)
    })
    const unsubDiscounts = subscribeDiscounts((data) => {
      setDiscounts(data)
    })
    return () => {
      unsubPricing()
      unsubDiscounts()
    }
  }, [])

  usePageMeta({
    title: 'Pricing — Simple Plans for Every Host',
    description:
      'Flexible virtual tour packages designed to fit your property and business needs. Pay via M-Pesa or card.',
    path: '/pricing',
  })



  // Enterprise / Custom plan is static — no price to configure
  const enterprisePlan = {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For hotel groups and portfolios that need custom branding.',
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
  }

  const allPlans = [...plans, enterprisePlan]

  return (
    <MarketingLayout>
      <div className="h-20" />

      {/* Pricing plans */}
      <Section
        id="pricing-plans"
        eyebrow="Pricing"
        title="Simple pricing that scales with your portfolio"
        description="Flexible virtual tour packages designed to fit your property and business needs."
        align="center"
      >
        {/* Billing cycle toggle */}
        <div className="mb-10 flex justify-center px-2 sm:px-4">
          <div className="inline-flex w-full max-w-sm sm:max-w-md sm:w-auto items-center justify-center rounded-full border border-ink-950/10 bg-ink-100/70 p-1 sm:p-1.5 shadow-sm">
            <button
              type="button"
              id="billing-cycle-quarterly-btn"
              onClick={() => setBillingCycle('quarterly')}
              className={cn(
                'flex-1 sm:flex-initial rounded-full px-2.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 text-center whitespace-nowrap',
                billingCycle === 'quarterly'
                  ? 'bg-paper text-ink-950 shadow-sm'
                  : 'text-ink-600 hover:text-ink-950',
              )}
            >
              Quarterly
            </button>
            <button
              type="button"
              id="billing-cycle-semi-annually-btn"
              onClick={() => setBillingCycle('semi-annually')}
              className={cn(
                'flex-1 sm:flex-initial rounded-full px-2.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 text-center whitespace-nowrap',
                billingCycle === 'semi-annually'
                  ? 'bg-paper text-ink-950 shadow-sm'
                  : 'text-ink-600 hover:text-ink-950',
              )}
            >
              Semi-annually
            </button>
            <button
              type="button"
              id="billing-cycle-annually-btn"
              onClick={() => setBillingCycle('annually')}
              className={cn(
                'flex-1 sm:flex-initial rounded-full px-2.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 text-center whitespace-nowrap',
                billingCycle === 'annually'
                  ? 'bg-paper text-ink-950 shadow-sm'
                  : 'text-ink-600 hover:text-ink-950',
              )}
            >
              Annually
            </button>
          </div>
        </div>


        {plansLoading ? (
          <SkeletonPricing />
        ) : (
          <div>
            {/* Render a carousel per toggle so each billing cycle retains its own independent swipe state */}
            {BILLING_CYCLES.map((cycle) => (
              <div
                key={cycle}
                ref={(el) => {
                  containerRefs.current[cycle] = el
                }}
                onScroll={() => handleScroll(cycle)}
                className={cn(
                  // Mobile view: horizontal swipe carousel with snap points and hidden scrollbar
                  'no-scrollbar flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pb-4 pt-1 px-[7vw] -mx-4 sm:px-6 sm:-mx-6 sm:gap-6 items-stretch',
                  // Desktop view: original 4-column grid layout with no horizontal scroll
                  'lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:p-0 lg:m-0 lg:snap-none',
                  billingCycle === cycle ? 'flex' : 'hidden lg:hidden',
                )}
              >
                {allPlans.map((plan) => {
                  const pricing = getPlanPricing(plan.price, cycle, discounts)
                  const propertyType = plan.id === 'enterprise' ? 'Custom Space' : plan.name
                  const prefilledMessage = `I am interested in this 3D tour package for my ${propertyType}. I’d like to get started and would love to learn more about the package, pricing, and next steps.`
                  const contactUrl = `/contact?message=${encodeURIComponent(prefilledMessage)}`

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        'flex flex-col justify-between gap-6 p-5 sm:p-8 transition-all duration-200',
                        // Mobile carousel card sizing & snap
                        'w-[86vw] max-w-[340px] shrink-0 snap-center sm:w-[360px] lg:w-auto lg:max-w-none lg:shrink lg:snap-align-none',
                        'highlighted' in plan && (plan as { highlighted?: boolean }).highlighted && 'border-brand-500 ring-1 ring-brand-500',
                      )}
                    >
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                          {plan.name}
                        </h3>
                        <div className="mt-3 min-h-[4rem] flex flex-col justify-end">
                          {pricing.originalPrice && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-ink-400 line-through">
                                {pricing.originalPrice}
                              </span>
                              {pricing.savingsPct !== null && (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/25">
                                  Save {pricing.savingsPct}%
                                </span>
                              )}
                            </div>
                          )}
                          <p className="flex items-baseline gap-1">
                            <span className="font-display text-4xl text-ink-950">
                              {pricing.displayPrice}
                            </span>
                            {plan.cadence && (
                              <span className="text-sm text-ink-500">{plan.cadence}</span>
                            )}
                          </p>
                        </div>
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
                      <Button href={contactUrl} variant="secondary" className="w-full">
                        {plan.ctaLabel}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            ))}

            {/* Instagram-style carousel pagination dots (Mobile only) */}
            <div
              className="mt-6 flex items-center justify-center gap-1.5 lg:hidden"
              aria-label="Pricing plans carousel pagination"
              role="tablist"
            >
              {allPlans.map((plan, idx) => {
                const isActive = (cycleIndices[billingCycle] ?? 0) === idx
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="tab"
                    id={`pricing-carousel-dot-${idx}`}
                    aria-selected={isActive}
                    aria-label={`Go to ${plan.name} plan (${idx + 1} of ${allPlans.length})`}
                    onClick={() => scrollToCard(billingCycle, idx)}
                    className="group relative flex h-6 w-6 items-center justify-center focus:outline-none"
                  >
                    <span
                      className={cn(
                        'rounded-full transition-all duration-300 ease-out',
                        isActive
                          ? 'h-2 w-2 bg-ink-950 scale-110 shadow-xs'
                          : 'h-1.5 w-1.5 bg-ink-950/25 group-hover:bg-ink-950/40 group-hover:scale-110',
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Section>


      {/* ── Ready to get started ───────────────────────────────────── */}
      <Section
        title="Ready to get started?"
        description="Select the package that best suits your needs. Once selected, you’ll be taken to our contact page with your chosen package automatically included in your enquiry, making it easy for us to assist you."
        align="center"
      >
        <div className="mx-auto flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={() => {
              const el = document.getElementById('pricing-plans')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="rounded-full shadow-xs"
          >
            Select a package
          </Button>
          <Button
            href="/contact"
            variant="secondary"
            className="rounded-full shadow-xs"
          >
            Contact us directly
          </Button>
        </div>
      </Section>
    </MarketingLayout>
  )
}

