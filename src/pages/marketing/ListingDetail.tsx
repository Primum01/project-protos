import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getCachedListing, getListingById } from '@/lib/firebase/listings'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { extractEmbedSrc, getMatterportThumbnail } from '@/lib/embed'
import { recordLinkShared, recordSessionDuration, recordTourView } from '@/lib/firebase/analytics'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Badge, Button, Container } from '@/components/ui'
import { SkeletonImage, SkeletonListingDetail, TourViewerWithSkeleton } from '@/components/skeleton'
import { cn } from '@/lib/cn'
import { ACCENT_GRADIENTS, LISTING_STATUSES } from '@/types/listing'
import type { Listing } from '@/types/listing'


function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1)
  }
  return cleaned
}

function normalizeWebsiteUrl(url?: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

function formatDisplayUrl(url?: string): string {
  if (!url) return ''
  return url.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}

function ContactPromptModal({
  listing,
  onClose,
}: {
  listing: Listing
  onClose: () => void
}) {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | 'website' | null>(null)

  const hasPhone = Boolean(listing.contactPhone?.trim())
  const hasEmail = Boolean(listing.contactEmail?.trim())
  const hasWebsite = Boolean(listing.website?.trim())
  const hasContact = hasPhone || hasEmail || hasWebsite
  const websiteUrl = normalizeWebsiteUrl(listing.website)

  const whatsAppNum = listing.contactPhone ? formatWhatsAppNumber(listing.contactPhone) : ''
  const whatsAppMsg = encodeURIComponent(
    `Hi, I am viewing ${listing.name} on TwinSpace and would like to arrange a viewing or ask a few questions.`
  )
  const emailSubject = encodeURIComponent(`Inquiry regarding ${listing.name}`)
  const emailBody = encodeURIComponent(
    `Hello,\n\nI am interested in ${listing.name} (${listing.location ? listing.location + ', ' : ''}${listing.city}) listed on TwinSpace.\n\nPlease share more details or availability for a viewing.\n\nThank you.`
  )

  function copyToClipboard(text: string, field: 'phone' | 'email' | 'website') {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-ink-950/10 bg-paper p-6 sm:p-7 shadow-lifted z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 font-semibold text-lg">
            🏠
          </div>
          <div>
            <h3 id="contact-modal-title" className="text-lg font-semibold text-ink-950">
              Contact Property Host
            </h3>
            <p className="mt-0.5 text-xs text-ink-500">
              Direct inquiry for <span className="font-medium text-ink-800">{listing.name}</span>
            </p>
          </div>
        </div>

        {/* Contact Options Container */}
        <div className="mt-6 space-y-3">
          {hasPhone && (
            <div className="rounded-xl border border-ink-950/8 bg-ink-50/50 p-4 transition-colors hover:border-ink-950/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs text-brand-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-semibold text-ink-950">{listing.contactPhone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(listing.contactPhone, 'phone')}
                  className="rounded-md border border-ink-950/10 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-white transition-colors"
                >
                  {copiedField === 'phone' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Call & WhatsApp Action Buttons */}
              <div className="mt-3.5 flex gap-2 pt-2 border-t border-ink-950/6">
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-800 transition-colors shadow-xs"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call Now
                </a>
                {whatsAppNum && (
                  <a
                    href={`https://wa.me/${whatsAppNum}?text=${whatsAppMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#20bd5a] transition-colors shadow-xs"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {hasEmail && (
            <div className="rounded-xl border border-ink-950/8 bg-ink-50/50 p-4 transition-colors hover:border-ink-950/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs text-brand-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wider">Email</p>
                    <p className="text-sm font-semibold text-ink-950 truncate">{listing.contactEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(listing.contactEmail, 'email')}
                  className="rounded-md border border-ink-950/10 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-white transition-colors shrink-0"
                >
                  {copiedField === 'email' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mt-3.5 pt-2 border-t border-ink-950/6">
                <a
                  href={`mailto:${listing.contactEmail}?subject=${emailSubject}&body=${emailBody}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-800 transition-colors shadow-xs"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Compose Email
                </a>
              </div>
            </div>
          )}

          {hasWebsite && (
            <div className="rounded-xl border border-ink-950/8 bg-ink-50/50 p-4 transition-colors hover:border-ink-950/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs text-brand-600">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wider">Website</p>
                    <p className="text-sm font-semibold text-ink-950 truncate">{formatDisplayUrl(listing.website)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(websiteUrl, 'website')}
                  className="rounded-md border border-ink-950/10 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-white transition-colors shrink-0"
                >
                  {copiedField === 'website' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="mt-3.5 pt-2 border-t border-ink-950/6">
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink-800 transition-colors shadow-xs"
                >
                  <span>Visit Host Website</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {!hasContact && (
            <div className="rounded-xl border border-dashed border-ink-950/15 p-5 text-center">
              <p className="text-sm font-medium text-ink-800">No direct contact details specified</p>
              <p className="mt-1 text-xs text-ink-500">
                You can reach out to TwinSpace support to be connected with this property host.
              </p>
              <Button href="/contact" size="sm" className="mt-4">
                Contact TwinSpace Support
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-ink-950/8 pt-4">
          <p className="text-[11px] text-ink-400">
            Mention you found this tour on <span className="font-semibold text-ink-700">TwinSpace</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const routeListing = (location.state as { listing?: Listing } | undefined)?.listing

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/tours')
    }
  }

  const [listing, setListing] = useState<Listing | null>(() => {
    if (routeListing && routeListing.id === id) return routeListing
    if (id) {
      const cached = getCachedListing(id)
      if (cached) return cached
    }
    return null
  })
  const [loading, setLoading] = useState(() => !listing)
  const [isTourActive, setIsTourActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!id || !isFirebaseConfigured) {
      setLoading(false)
      return
    }
    getListingById(id)
      .then((data) => {
        if (data) setListing(data)
      })
      .catch(() => {
        setListing((prev) => prev)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Track real tour view and session duration
  useEffect(() => {
    if (!listing) return
    void recordTourView(listing.id, listing.name)
    const startTime = Date.now()
    return () => {
      const duration = (Date.now() - startTime) / 1000
      void recordSessionDuration(listing.id, duration, listing.name)
    }
  }, [listing?.id])

  async function handleShare() {
    if (listing) void recordLinkShared(listing.id, listing.name)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const statusMeta = LISTING_STATUSES.find((s) => s.value === listing?.status)

  if (loading) {
    return (
      <MarketingLayout>
        <SkeletonListingDetail />
      </MarketingLayout>
    )
  }

  if (!listing) {
    return (
      <MarketingLayout>
        <div className="h-20" />
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-medium">Listing not found</h1>
          <p className="mt-3 text-ink-500">
            This property may have been unpublished or the link is incorrect.
          </p>
          <Button href="/tours" className="mt-8">
            Browse all properties
          </Button>
        </Container>
      </MarketingLayout>
    )
  }

  const embedSrc = extractEmbedSrc(listing.embedCode || listing.tourUrl, { isMobile })

  return (
    <MarketingLayout>
      <div className="h-20" />

      {/* Title bar */}
      <Container className="pb-6 pt-8 sm:pt-10">
        {/* Back navigation text link */}
        <div className="mb-3 sm:mb-4">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-ink-500 hover:text-brand-600 transition-colors focus:outline-none"
            aria-label="Back to listings"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand-600"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to listings</span>
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-500">
              {listing.city}, {listing.country}
            </p>
            <h1 className="mt-1 text-3xl font-medium text-ink-950">{listing.name}</h1>
            <p className="mt-1.5 font-medium text-brand-600">{listing.price}</p>
          </div>
          <div className="flex items-center gap-3">
            {statusMeta && (
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={handleShare}>
              {copied ? 'Link copied!' : 'Share'}
            </Button>
          </div>
        </div>
      </Container>

      {/* Tour viewer / hero */}
      <Container>
        <div
          className={cn(
            'relative flex h-[65vh] min-h-[420px] sm:h-auto sm:aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white',
            ACCENT_GRADIENTS[listing.accent] ?? ACCENT_GRADIENTS.clay,
          )}
        >
          {(() => {
            if (embedSrc) {
              if (isTourActive) {
                return (
                  <div className="relative h-full w-full">
                    <TourViewerWithSkeleton
                      src={embedSrc}
                      title={`${listing.name} 3D Tour`}
                      containerClassName="h-full w-full rounded-xl"
                      aspectRatio="custom"
                      loadingMessage={`Initializing ${listing.name} 3D Tour…`}
                      loading="eager"
                    />

                    {/* Pause/Exit button to return to stagnant mode and unlock smooth scrolling */}
                    <button
                      type="button"
                      onClick={() => setIsTourActive(false)}
                      className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-black/95 transition-colors shadow-lifted border border-white/10"
                      aria-label="Pause 3D tour"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                      <span>Pause 3D Tour</span>
                    </button>

                    {listing.tourUrl && (
                      <a
                        href={listing.tourUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex absolute bottom-4 right-4 items-center gap-1.5 rounded-lg bg-ink-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950 transition-colors shadow-lifted"
                      >
                        <span>Open tour in new tab</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                )
              }

              // Stagnant preview poster state (zero GPU/network load until clicked)
              const previewImage = listing.photoUrl || getMatterportThumbnail(listing.embedCode || listing.tourUrl)

              return (
                <div className="group relative h-full w-full overflow-hidden">
                  {previewImage ? (
                    <SkeletonImage
                      src={previewImage}
                      alt={listing.name}
                      aspectRatio="auto"
                      containerClassName="absolute inset-0 h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      fallbackText="Tour Preview"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br text-white/70">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium tracking-wide text-white/70">Interactive 3D Virtual Tour</span>
                    </div>
                  )}

                  {/* Dark gradient overlay for text and button readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />

                  {/* Centered Activation CTA */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                    <button
                      type="button"
                      onClick={() => setIsTourActive(true)}
                      className="group/cta flex flex-col items-center gap-4 cursor-pointer focus:outline-none"
                      aria-label={`Enter interactive 3D tour for ${listing.name}`}
                    >
                      <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-2xl backdrop-blur-md transition-all duration-300 group-hover/cta:scale-110 group-hover/cta:bg-brand-500">
                        <span className="absolute -inset-2 rounded-full bg-brand-400/40 animate-ping opacity-60 pointer-events-none" />
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1 sm:h-8 sm:w-8">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-md shadow-lg border border-white/15 transition-all group-hover/cta:bg-black/80 group-hover/cta:border-brand-400/50">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-brand-400">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                          <span>Tap to Explore 3D Walkthrough</span>
                        </span>
                        <span className="text-[11px] sm:text-xs text-white/75 font-medium tracking-wide">
                          Interactive 360&deg; spatial tour &middot; Walk room-to-room
                        </span>
                      </div>
                    </button>
                  </div>

                  {listing.tourUrl && (
                    <a
                      href={listing.tourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex absolute bottom-4 right-4 z-20 items-center gap-1.5 rounded-lg bg-ink-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950 transition-colors shadow-lifted"
                    >
                      <span>Open tour in new tab</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              )
            }
            if (listing.tourUrl) {
              return (
                <a
                  href={listing.tourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  <span className="rounded-full bg-white/20 px-6 py-2.5 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors">
                    Launch 3D Tour
                  </span>
                </a>
              )
            }
            return (
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">3D tour coming soon</p>
                <p className="mt-1 text-sm text-white/55">Contact us to arrange a viewing.</p>
              </div>
            )
          })()}
        </div>

        {/* Mobile: Open tour in new tab placed just below the tour card */}
        {listing.tourUrl && embedSrc && (
          <div className="mt-3 sm:hidden">
            <a
              href={listing.tourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-950/10 bg-paper px-4 py-2.5 text-xs font-medium text-ink-800 shadow-xs active:bg-ink-100 hover:border-ink-950/20 hover:text-ink-950 transition-colors"
            >
              <span>Open tour in new tab</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}
      </Container>

      {/* Body */}
      <Container className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Badge>{listing.propertyType}</Badge>
            {listing.size && <Badge>{listing.size}</Badge>}
          </div>
          <p className="mt-4 text-sm text-ink-500">
            {listing.bedrooms} bedrooms · {listing.bathrooms} bathrooms
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            {listing.description}
          </p>

          {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-semibold text-ink-950">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenities.map((a) => (
                  <li
                    key={a}
                    className="rounded-md border border-ink-950/10 px-3 py-2 text-sm text-ink-700"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="h-fit rounded-xl border border-ink-950/10 p-6 bg-paper shadow-soft">
          <h2 className="text-base font-semibold text-ink-950">Interested in this property?</h2>
          <p className="mt-2 text-sm text-ink-500">
            Get in touch directly with the property host to arrange a viewing or ask any questions.
          </p>

          {(listing.contactPhone || listing.contactEmail || listing.website) && (
            <div className="mt-5 space-y-2 border-t border-ink-950/8 pt-5 text-sm">
              {listing.contactPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone:</span>
                  <a href={`tel:${listing.contactPhone}`} className="font-medium text-brand-600 hover:underline">
                    {listing.contactPhone}
                  </a>
                </div>
              )}
              {listing.contactEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email:</span>
                  <a href={`mailto:${listing.contactEmail}`} className="font-medium text-brand-600 hover:underline break-all">
                    {listing.contactEmail}
                  </a>
                </div>
              )}
              {listing.website && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Website:</span>
                  <a
                    href={normalizeWebsiteUrl(listing.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-600 hover:underline break-all inline-flex items-center gap-1"
                  >
                    <span>{formatDisplayUrl(listing.website)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="mt-5 w-full flex items-center justify-center gap-2 shadow-xs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            <span>Contact Host</span>
          </Button>

          {listing.website && (
            <a
              href={normalizeWebsiteUrl(listing.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-ink-950/12 bg-white px-4 py-2.5 text-xs font-semibold text-ink-800 shadow-xs hover:border-ink-950/25 hover:bg-ink-50/70 hover:text-ink-950 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Visit Host Website</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <Link
            to="/tours"
            className="mt-4 block text-center text-sm text-ink-500 hover:text-ink-950 transition-colors"
          >
            Browse more properties
          </Link>
        </aside>
      </Container>

      {/* Direct Contact Prompt Modal */}
      {showContactModal && (
        <ContactPromptModal
          listing={listing}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </MarketingLayout>
  )
}
