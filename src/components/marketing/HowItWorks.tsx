import { Section } from '@/components/ui'

const steps = [
  {
    number: '01',
    title: 'Request a capture',
    description: 'Tell us about the property. We schedule a technician or send you a capture guide.',
  },
  {
    number: '02',
    title: 'We scan the space',
    description: 'Every room is captured and processed into an interactive 3D tour.',
  },
  {
    number: '03',
    title: 'Review & publish',
    description: 'Preview the tour, add hotspots and photos, then publish to a shareable link.',
  },
  {
    number: '04',
    title: 'Guests explore & book',
    description: 'Visitors walk through the space online, then click straight through to booking.',
  },
]

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From empty listing to interactive tour"
      description="A simple pipeline that takes a property from capture request to a published 3D experience guests can explore on any device."
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="border-t border-ink-950/10 pt-5">
            <span className="font-display text-2xl text-brand-600">{step.number}</span>
            <h3 className="mt-3 text-base font-semibold text-ink-950">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
