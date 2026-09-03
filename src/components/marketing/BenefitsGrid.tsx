import { Section } from '@/components/ui'

const benefits = [
  {
    title: 'Stand out in search',
    description: 'Listings with an interactive tour get more clicks and stay in view longer.',
  },
  {
    title: 'Fewer back-and-forth questions',
    description: 'Guests can answer their own layout and space questions before they message you.',
  },
  {
    title: 'Book with confidence',
    description: 'Seeing the real space in 3D reduces cancellations and post-arrival surprises.',
  },
  {
    title: 'One tour, every channel',
    description: 'Share the same tour link on Airbnb, Booking.com, your site, or social media.',
  },
  {
    title: 'Built for every device',
    description: 'The viewer runs smoothly in a browser on phones, tablets, and desktops.',
  },
  {
    title: 'You keep your booking flow',
    description: 'The tour links straight through to your existing Airbnb, Booking.com, or site checkout.',
  },
]

export function BenefitsGrid() {
  return (
    <Section
      eyebrow="For hosts &amp; property managers"
      title="Why properties with a 3D tour perform better"
      description="TwinSpace gives your listing the same walkthrough quality guests get in person, without you doing anything after the initial capture."
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title}>
            <h3 className="text-base font-semibold text-ink-950">{benefit.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{benefit.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
