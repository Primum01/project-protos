import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { AnalyticsPreview } from '@/components/marketing/AnalyticsPreview'
import { BenefitsGrid } from '@/components/marketing/BenefitsGrid'
import { FAQSection } from '@/components/marketing/FAQSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Hero } from '@/components/marketing/Hero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { TourCard } from '@/components/marketing/TourCard'
import { TourPreviewMockup } from '@/components/marketing/TourPreviewMockup'
import { Button, Section } from '@/components/ui'
import { exampleTours } from '@/data/exampleTours'
import { usePageMeta } from '@/hooks/usePageMeta'

export function Home() {
  usePageMeta({
    title: 'TwinSpace — Interactive 3D Property Tours for Hosts',
    description:
      'TwinSpace turns any property into an immersive 3D tour guests can explore before they arrive. Increase bookings, reduce questions, and wow your guests from the first click.',
    path: '/',
  })

  return (
    <MarketingLayout overlayNav>
      <Hero />
      <HowItWorks />
      <TourPreviewMockup />
      <BenefitsGrid />
      <Section
        eyebrow="Example tours"
        title="See it in action"
        description="A few example properties showcasing what a published TwinSpace tour looks like."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {exampleTours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/tours" variant="secondary">
            View all example tours
          </Button>
        </div>
      </Section>
      <AnalyticsPreview />
      <FAQSection />
      <FinalCTA />
    </MarketingLayout>
  )
}
