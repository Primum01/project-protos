import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { BenefitsGrid } from '@/components/marketing/BenefitsGrid'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Hero } from '@/components/marketing/Hero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { TourPreviewMockup } from '@/components/marketing/TourPreviewMockup'
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
      <TourPreviewMockup />
      <HowItWorks />
      <BenefitsGrid />
      <FinalCTA />
    </MarketingLayout>
  )
}
