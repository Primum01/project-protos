import { type FormEvent, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MarketingLayout } from "@/components/layout/MarketingLayout"
import { Button, Input, Section, Textarea } from "@/components/ui"
import { createMessage } from "@/lib/firebase/messages"
import { isFirebaseConfigured } from "@/lib/firebase/config"
import { usePageMeta } from "@/hooks/usePageMeta"
import { fetchWithIdempotency, generateIdempotencyKey } from "@/lib/idempotency"

const CONTACT_EMAIL = 'info@twinspace360.com'

export function Contact() {
  const [searchParams] = useSearchParams()
  const initialMessage = searchParams.get('message') || ''

  usePageMeta({
    title: 'Contact TwinSpace — Get in Touch',
    description:
      'Have a question or ready to get started? Reach out to the TwinSpace team — we\'d love to help you create an unforgettable property tour.',
    path: '/contact',
  })

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState(initialMessage)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Track active idempotency key for this submission attempt; preserves key across retries
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey())

  useEffect(() => {
    const msgFromUrl = searchParams.get('message')
    if (msgFromUrl) {
      setMessage(msgFromUrl)
    }
  }, [searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Submit through secure server-side endpoint with automatic idempotency
      const { response: res, data } = await fetchWithIdempotency('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message }),
        idempotencyKey: idempotencyKeyRef.current,
        maxRetries: 2,
      })

      if (res.ok) {
        setSent(true)
        setName("")
        setPhone("")
        setEmail("")
        setMessage("")
        idempotencyKeyRef.current = generateIdempotencyKey() // Refresh key for any new future submission
        return
      }

      if (res.status === 429) {
        setSubmitError(data?.error || 'Too many submissions. Please wait a few moments before trying again.')
        return
      }

      if (res.status === 400 || res.status === 409) {
        setSubmitError(data?.error || 'Please check your inputs and try again.')
        return
      }

      // If server returned non-200 and not handled (e.g. 404 in standalone local vite dev), fall back
      throw new Error(`Server endpoint returned ${res.status}`)
    } catch {
      // 2. Fallback to client SDK if configured (e.g. during standalone local development)
      if (isFirebaseConfigured) {
        try {
          await createMessage({ name, phone, email, message })
          setSent(true)
          setName("")
          setPhone("")
          setEmail("")
          setMessage("")
          return
        } catch {
          setSubmitError("Something went wrong. Please try again or email us directly.")
          return
        }
      }

      // 3. Offline / Unconfigured fallback
      const subject = encodeURIComponent(`New enquiry from ${name || "the TwinSpace site"}`)
      const body = encodeURIComponent(`${message}\n\nFrom ${name}\nPhone: ${phone}\nEmail: ${email}`)
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    } finally {
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
                <Button type="submit" className="w-full sm:w-auto self-stretch sm:self-start" disabled={submitting}>
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
                href="https://wa.me/254729138397"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-[#25D366] hover:underline font-medium"
              >
                +254 729 138 397
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
