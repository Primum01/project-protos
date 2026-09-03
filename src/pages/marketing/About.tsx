import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Section } from '@/components/ui'

export function About() {
  return (
    <MarketingLayout>
      <div className="h-20" />
      <Section
        eyebrow="About"
        title="Built for hosts who want their listing to speak for itself"
        description="TwinSpace turns any property into an interactive 3D tour, so guests know exactly what they're booking before they arrive."
      >
        <div className="max-w-2xl space-y-6 text-base leading-relaxed text-ink-700">
          <p>
            Photos only tell part of the story. A 3D tour lets a guest walk through the
            living room, check the kitchen layout, and see the view from the balcony,
            all before they ever message the host.
          </p>
          <p>
            We started TwinSpace to give independent hosts and small property managers
            access to the same walkthrough quality larger platforms use, without needing
            an in-house production team.
          </p>
          <p>
            The platform is built to grow with you: from a single capture on one
            apartment to a full portfolio across a hotel group, with the underlying 3D
            technology able to evolve without disrupting your published tours.
          </p>
        </div>
      </Section>
    </MarketingLayout>
  )
}
