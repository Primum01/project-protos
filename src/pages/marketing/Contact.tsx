import { type FormEvent, useState } from "react"
import { MarketingLayout } from "@/components/layout/MarketingLayout"
import { Button, Input, Section, Textarea } from "@/components/ui"
import { createMessage } from "@/lib/firebase/messages"
import { isFirebaseConfigured } from "@/lib/firebase/config"
import { usePageMeta } from "@/hooks/usePageMeta"

const CONTACT_EMAIL = 'info@twinspace360.com'

export function Contact() {
  usePageMeta({
    title: 'Contact TwinSpace — Get in Touch',
    description:
      'Have a question or ready to get started? Reach out to the TwinSpace team — we\'d love to help you create an unforgettable property tour.',
    path: '/contact',
  })

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    if (isFirebaseConfigured) {
      try {
        await createMessage({ name, phone, email, message })
        setSent(true)
        setName("")
        setPhone("")
        setEmail("")
        setMessage("")
      } catch {
        setSubmitError("Something went wrong. Please try again or email us directly.")
      } finally {
        setSubmitting(false)
      }
    } else {
      // Fallback when Firebase isn't configured
      const subject = encodeURIComponent(`New enquiry from ${name || "the TwinSpace site"}`)
      const body = encodeURIComponent(`${message}\n\nFrom ${name}\nPhone: ${phone}\nEmail: ${email}`)
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
      setSubmitting(false)
    }
  }

  return (
    <MarketingLayout>
      <div className="h-20" />
      <Section
        eyebrow="Contact"
        title="Let's talk about your property"
        description="Tell us a bit about what you're looking for and we'll get back to you shortly."
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:col-span-2">
            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-3 font-semibold text-emerald-800">Message sent!</p>
                <p className="mt-1 text-sm text-emerald-600">We received your message and will be in touch shortly.</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-5 text-sm text-emerald-700 underline hover:text-emerald-900"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <Input
                  id="name"
                  label="Name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input
                  id="phone"
                  type="tel"
                  label="Phone Number"
                  required
                  placeholder="e.g. +254 700 000 000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Textarea
                  id="message"
                  label="Message"
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us about your property and what you're hoping to do."
                />
                {submitError && (
                  <p className="text-sm text-red-600">{submitError}</p>
                )}
                <Button type="submit" className="self-start" disabled={submitting}>
                  {submitting ? "Sending…" : "Send message"}
                </Button>
              </>
            )}
          </form>

          <div className="flex flex-col gap-4">
            {/* Prefer email */}
            <div className="rounded-lg border border-ink-950/10 p-6">
              <h2 className="text-base font-semibold text-ink-950">Prefer email?</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 block text-sm text-brand-600 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-6 text-sm text-ink-500">
                We typically respond within one business day.
              </p>
            </div>

            {/* Prefer WhatsApp */}
            <div className="rounded-lg border border-ink-950/10 p-6">
              <div className="flex items-center gap-2">
                {/* WhatsApp logo */}
                <img
                  src="/whatsapp-icon.png"
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <h2 className="text-base font-semibold text-ink-950">Prefer WhatsApp?</h2>
              </div>
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-[#25D366] hover:underline font-medium"
              >
                +254 700 000 000
              </a>
              <p className="mt-6 text-sm text-ink-500">
                Message us on WhatsApp for a quicker response.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  )
}
