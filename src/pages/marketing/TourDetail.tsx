import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Badge, Button, Container } from '@/components/ui'
import { exampleTours } from '@/data/exampleTours'
import { recordLinkShared, recordSessionDuration, recordTourView } from '@/lib/firebase/analytics'
import { cn } from '@/lib/cn'
import { usePageMeta } from '@/hooks/usePageMeta'

const accentClasses: Record<string, string> = {
  clay: 'from-[#d9a373] to-[#8c5a3c]',
  olive: 'from-[#a9b48a] to-[#5f6b48]',
  ink: 'from-[#4a4a55] to-[#1a1a22]',
  sand: 'from-[#e3dcc9] to-[#b9a97e]',
}

export function TourDetail() {
  const { slug } = useParams<{ slug: string }>()
  const tour = exampleTours.find((item) => item.slug === slug)
  const [copied, setCopied] = useState(false)

  // Track tour view and session duration
  useEffect(() => {
    if (!tour) return
    void recordTourView(tour.slug, tour.title)
    const startTime = Date.now()
    return () => {
      const duration = (Date.now() - startTime) / 1000
      void recordSessionDuration(tour.slug, duration, tour.title)
    }
  }, [tour?.slug])

  usePageMeta({
    title: tour ? `${tour.title} — 3D Property Tour` : '3D Property Tour — TwinSpace',
    description: tour
      ? `${tour.propertyType} in ${tour.location}, ${tour.city}. ${tour.description ?? 'Explore this property in an interactive 3D tour on TwinSpace.'}`
      : 'Explore this property in an interactive 3D tour on TwinSpace.',
    path: `/tour/${slug}`,
  })

  if (!tour) {
    return (
      <MarketingLayout>
        <div className="h-20" />
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-medium">Tour not found</h1>
          <p className="mt-3 text-ink-500">
            This tour may have been unpublished or the link is incorrect.
          </p>
          <Button href="/tours" className="mt-8">
            Browse example tours
          </Button>
        </Container>
      </MarketingLayout>
    )
  }

  async function handleShare() {
    if (tour) void recordLinkShared(tour.slug, tour.title)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail (permissions/unsupported browser); link stays visible in the address bar.
    }
  }

  return (
    <MarketingLayout>
      <div className="h-20" />
      <Container className="pt-10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-500">
              {tour.city}, {tour.country}
            </p>
            <h1 className="mt-1 text-3xl font-medium text-ink-950">{tour.title}</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={handleShare}>
            {copied ? 'Link copied' : 'Share tour'}
          </Button>
        </div>
      </Container>

      <Container>
        <div
          className={cn(
            'relative flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br text-white',
            accentClasses[tour.accent],
          )}
        >
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">
              3D viewer preview
            </p>
            <p className="mt-2 max-w-sm px-6 text-sm text-white/70">
              The interactive Three.js viewer for this tour ships in a later build. This
              placeholder shows where it will render.
            </p>
          </div>
        </div>
      </Container>

      <Container className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Badge>{tour.propertyType}</Badge>
          <p className="mt-4 text-sm text-ink-500">
            {tour.bedrooms} bedrooms &middot; {tour.bathrooms} bathrooms
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700">
            {tour.description}
          </p>

          <h2 className="mt-10 text-lg font-semibold text-ink-950">Amenities</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tour.amenities.map((amenity) => (
              <li
                key={amenity}
                className="rounded-md border border-ink-950/10 px-3 py-2 text-sm text-ink-700"
              >
                {amenity}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-lg border border-ink-950/10 p-6 h-fit">
          <h2 className="text-base font-semibold text-ink-950">Interested in staying?</h2>
          <p className="mt-2 text-sm text-ink-500">
            This tour links out to the host's existing booking page.
          </p>
          <Button href="/contact" className="mt-5 w-full">
            Contact host
          </Button>
          <Link
            to="/tours"
            className="mt-4 block text-center text-sm text-ink-500 hover:text-ink-950"
          >
            Browse more tours
          </Link>
        </aside>
      </Container>
    </MarketingLayout>
  )
}
