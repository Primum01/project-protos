import { useLocation } from 'react-router-dom'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Container, Section } from '@/components/ui'
import { Skeleton } from './Skeleton'
import { SkeletonListingDetail } from './SkeletonListingDetail'
import { SkeletonTourCard } from './SkeletonTourCard'
import { SkeletonPricing } from './SkeletonPricing'
import { SkeletonAdminShell } from './SkeletonAdminShell'
import { SkeletonParagraph } from './SkeletonParagraph'

/**
 * Smart, route-aware Suspense fallback.
 * Automatically chooses the appropriate skeleton layout based on current route path,
 * eliminating generic blank screens and spinners during code-split chunk loading.
 */
export function RouteTransitionSkeleton() {
  const location = useLocation()
  const { pathname } = location

  // 1. Admin routes
  if (pathname.startsWith('/admin')) {
    return <SkeletonAdminShell />
  }

  // 2. Listing / Tour Detail routes
  if (pathname.startsWith('/listing/') || pathname.startsWith('/tour/')) {
    return (
      <MarketingLayout>
        <SkeletonListingDetail />
      </MarketingLayout>
    )
  }

  // 3. Tours browsing route
  if (pathname === '/tours') {
    return (
      <MarketingLayout>
        <div className="h-20" />
        <Section
          eyebrow="Available properties"
          title="Browse our listings"
          description="Properties currently available to view. Click any card to launch the 3D tour."
        >
          {/* Filter Bar placeholder */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2.5">
              <Skeleton rounded="full" className="h-10 w-32" />
              <Skeleton rounded="full" className="h-10 w-32" />
              <Skeleton rounded="full" className="h-10 w-44" />
            </div>
            <Skeleton rounded="sm" className="h-4 w-20" />
          </div>

          {/* Listing Cards Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTourCard key={i} />
            ))}
          </div>
        </Section>
      </MarketingLayout>
    )
  }

  // 4. Pricing route
  if (pathname === '/pricing') {
    return (
      <MarketingLayout>
        <div className="h-20" />
        <Section
          eyebrow="Simple pricing"
          title="Invest in unforgettable property tours"
          description="Straightforward packages for AirBnBs, holiday homes, and commercial spaces."
          align="center"
        >
          <div className="mx-auto mb-10 flex h-10 w-48 items-center justify-center rounded-full bg-ink-100 p-1">
            <Skeleton rounded="full" className="h-8 w-24" />
            <Skeleton rounded="full" className="h-8 w-20" />
          </div>
          <SkeletonPricing />
        </Section>
      </MarketingLayout>
    )
  }

  // 5. Default marketing page fallback (Home, About, Contact, Terms, etc.)
  return (
    <MarketingLayout>
      <div className="h-20" />
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="flex justify-center">
            <Skeleton rounded="full" className="h-6 w-32" />
          </div>
          <div className="flex justify-center">
            <Skeleton rounded="lg" className="h-10 w-3/4 max-w-md" />
          </div>
          <div className="flex justify-center">
            <SkeletonParagraph lines={2} className="w-full max-w-xl" />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-ink-950/8 bg-paper p-6 shadow-soft space-y-3"
            >
              <Skeleton rounded="md" className="h-10 w-10" />
              <Skeleton rounded="sm" className="h-5 w-40" />
              <SkeletonParagraph lines={3} />
            </div>
          ))}
        </div>
      </Container>
    </MarketingLayout>
  )
}
