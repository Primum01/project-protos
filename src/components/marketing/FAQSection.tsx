import { Section } from '@/components/ui'

const faqs = [
  {
    question: 'Can guests book directly through TwinSpace?',
    answer:
      'Not yet. The tour links straight through to your existing Airbnb, Booking.com, or website checkout. Direct booking is on our roadmap.',
  },
  {
    question: 'What happens while a new version of my tour is processing?',
    answer:
      'Your currently published tour stays live and visible to guests until the new version finishes processing and passes review.',
  },
  {
    question: 'Who can see my tour?',
    answer:
      'You choose: public (anyone with the link, indexable by search), unlisted (anyone with the link), or private (host only).',
  },
  {
    question: 'Does the viewer work well on phones?',
    answer:
      'Yes, most guests open tour links from their phones, so the viewer is built mobile-first with touch controls.',
  },
]

export function FAQSection() {
  return (
    <Section eyebrow="FAQ" title="Common questions" align="center">
      <div className="mx-auto max-w-2xl divide-y divide-ink-950/10">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-left text-sm font-medium text-ink-950">
              {faq.question}
              <span className="ml-4 shrink-0 text-ink-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
