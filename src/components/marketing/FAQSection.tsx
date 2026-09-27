import { Section } from '@/components/ui'

const faqs = [
  {
    question: 'Can guests book directly through TwinSpace?',
    answer: 'Yes.',
  },
  {
    question: 'How do I navigate the tour?',
    answer:
      'Click or tap on the navigation points within the tour to move from one area to another. You can also drag to look around and explore the property from different angles.',
  },
  {
    question: 'What are Dollhouse, Floor Plan and Inside views?',
    answer:
      "Dollhouse View gives you a 3D overview of the entire property.\n\nFloor Plan View shows the property's layout from above, making it easier to understand how the rooms connect.\n\nInside View lets you explore the property from within, room by room.",
  },
  {
    question: 'Can I view different floors?',
    answer:
      'Yes. If the property has multiple floors included in the scan, you can switch between the available levels and explore each floor.',
  },
  {
    question: 'Can I measure rooms and spaces?',
    answer:
      'Yes, when the measurement feature is available in the tour. You can use it to get approximate measurements of rooms, walls and other spaces. For exact dimensions, professional measurements are recommended.',
  },
  {
    question: 'What are the tags inside the tour?',
    answer:
      'Tags, also known as Mattertags, provide additional information about specific areas or features of the property. Click on a tag to see the information attached to it.',
  },
  {
    question: 'Can I use the tour on my phone?',
    answer:
      'Yes. You can open and explore the tour directly from your phone or tablet using a compatible web browser. No special app is required.',
  },
  {
    question: 'Can I share the tour with someone?',
    answer:
      'Yes. You can share the tour using its link. Simply copy the tour URL and send it to someone through WhatsApp, email, social media or another platform.',
  },
  {
    question: "Why can't I see a particular room or area?",
    answer:
      "The tour only includes areas that were captured when the property was scanned. If a room or area wasn't captured or wasn't included in the published tour, it won't be available to explore.",
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
            <p className="mt-3 text-sm leading-relaxed text-ink-500 whitespace-pre-line">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
