import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getListingById } from '@/lib/firebase/listings'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Badge, Button, Container } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ACCENT_GRADIENTS, LISTING_STATUSES } from '@/types/listing'
import type { Listing } from '@/types/listing'


export function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id || !isFirebaseConfigured) {
      setLoading(false)
      return
    }
    getListingById(id)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleShare() {
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
        <div className="h-20" />
        <Container className="py-24 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </Container>
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

  return (
    <MarketingLayout>
      <div className="h-20" />

      {/* Title bar */}
      <Container className="pb-6 pt-10">
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
            'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br text-white',
            ACCENT_GRADIENTS[listing.accent] ?? ACCENT_GRADIENTS.clay,
          )}
        >
          {listing.tourUrl ? (
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
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-white/80">3D tour coming soon</p>
              <p className="mt-1 text-sm text-white/55">Contact us to arrange a viewing.</p>
            </div>
          )}
        </div>
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

          {listing.amenities.length > 0 && (
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
        <aside className="h-fit rounded-xl border border-ink-950/10 p-6">
          <h2 className="text-base font-semibold text-ink-950">Interested?</h2>
          <p className="mt-2 text-sm text-ink-500">
            Get in touch with us to arrange a viewing or ask any questions.
          </p>

          {(listing.contactName || listing.contactPhone || listing.contactEmail) && (
            <div className="mt-5 space-y-1 border-t border-ink-950/8 pt-5 text-sm">
              {listing.contactName && (
                <p className="font-medium text-ink-950">{listing.contactName}</p>
              )}
              {listing.contactPhone && (
                <a href={`tel:${listing.contactPhone}`} className="block text-brand-600 hover:underline">
                  {listing.contactPhone}
                </a>
              )}
              {listing.contactEmail && (
                <a href={`mailto:${listing.contactEmail}`} className="block text-brand-600 hover:underline">
                  {listing.contactEmail}
                </a>
              )}
            </div>
          )}

          <Button href="/contact" className="mt-5 w-full">
            Contact us
          </Button>
          <Link
            to="/tours"
            className="mt-4 block text-center text-sm text-ink-500 hover:text-ink-950"
          >
            Browse more properties
          </Link>
        </aside>
      </Container>
    </MarketingLayout>
  )
}
