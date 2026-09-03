import { Section } from '@/components/ui'

const sampleStats = [
  { label: 'Tour views', value: '2.4k' },
  { label: 'Avg. session', value: '3m 12s' },
  { label: 'Rooms explored / visit', value: '4.6' },
  { label: 'Booking clicks', value: '186' },
]

/** Illustrative sample dashboard, not live data. Real analytics ships with the host dashboard. */
export function AnalyticsPreview() {
  return (
    <Section
      eyebrow="Analytics"
      title="See how guests actually explore your space"
      description="Every tour comes with a dashboard showing views, room engagement, and booking clicks, so you know what's working."
      align="center"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-ink-950/10 bg-sand-100/60 p-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-wider text-ink-500">
          Sample dashboard
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {sampleStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl text-ink-950">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
