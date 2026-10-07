import { useEffect, useState, useCallback } from 'react'
import { Section } from '@/components/ui'
import { TourViewerWithSkeleton } from '@/components/skeleton'

const DEMO_MODEL_ID = '13oTzmx56ar'
const POSTER_IMAGE = `https://my.matterport.com/api/v1/player/models/${DEMO_MODEL_ID}/thumb`

/**
 * Interactive Matterport 3D walkthrough preview embedded in a mock browser container.
 * Uses a full-bleed, high-performance facade pattern to avoid loading heavy 3D WebGL
 * scripts and render-blocking iframe assets during initial page load and mobile evaluation.
 */
export function TourPreviewMockup() {
  const [isInteractive, setIsInteractive] = useState(false)
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

  // Dynamically warm up connection only when user expresses intent or scrolls near
  const warmUpMatterport = useCallback(() => {
    if (typeof document === 'undefined') return
    if (!document.getElementById('matterport-preconnect-dynamic')) {
      const link = document.createElement('link')
      link.id = 'matterport-preconnect-dynamic'
      link.rel = 'preconnect'
      link.href = 'https://my.matterport.com'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }
  }, [])

  // Pre-warm DNS / TLS when section approaches the viewport
  useEffect(() => {
    const target = document.getElementById('guest-experience')
    if (!target || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          warmUpMatterport()
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [warmUpMatterport])

  // Desktop view: user clicks explore to start tour.
  // Mobile view: play=1&qs=1 to start inline without triggering mobile tab redirect.
  const tourSrc = isMobile
    ? `https://my.matterport.com/show/?m=${DEMO_MODEL_ID}&play=1&qs=1&brand=0&title=0&tourcta=0&help=0&hl=0`
    : `https://my.matterport.com/show/?m=${DEMO_MODEL_ID}&play=1&brand=0&title=0&tourcta=0&help=0&hl=0`

  return (
    <Section
      id="guest-experience"
      eyebrow="The guest experience"
      title="A 3D tour that feels like walking through the door"
      description="Guests orbit, pan, and zoom through every room, follow hotspots for details, and jump straight to booking, no account required."
      align="center"
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-ink-950/10 bg-ink-950 shadow-lifted">
        {/* Browser bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          </div>
          <span className="text-xs text-white/50">twinspace.app/tour/demo</span>
          <span className="w-12" />
        </div>

        {/* Full-bleed 16:9 ratio container (300px min-height on mobile, aspect-16/9 on desktop) */}
        <div className="relative aspect-16/9 w-full bg-ink-950 min-h-[300px] sm:min-h-0">
          {isInteractive ? (
            <>
              <TourViewerWithSkeleton
                src={tourSrc}
                title="Matterport 3D Tour Demo"
                aspectRatio="16/9"
                containerClassName="min-h-[300px] sm:min-h-0 rounded-none h-full w-full"
                loadingMessage="Initializing Interactive 3D Walkthrough…"
                loading="eager"
              />

              {/* Reset to static facade button (allows smooth page scrolling on mobile touch screens) */}
              <button
                type="button"
                onClick={() => setIsInteractive(false)}
                className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-black/95 transition-colors shadow-lifted border border-white/10 cursor-pointer"
                aria-label="Pause 3D tour and enable scrolling"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause 3D tour
              </button>
            </>
          ) : (
            <div className="group absolute inset-0 overflow-hidden select-none">
              {/* Full-bleed high-res static poster image */}
              <img
                src={POSTER_IMAGE}
                alt="Interactive 3D Walkthrough Preview"
                loading="lazy"
                width={1200}
                height={675}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Cinematic Vignette Overlay covering the full frame */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-ink-950/45" />

              {/* Bottom Feature Pill */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 hidden xs:flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs text-white/80 border border-white/10 shadow-sm">
                <svg
                  className="h-3.5 w-3.5 text-brand-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span>Matterport Spatial Engine</span>
              </div>

              {/* Click to Explore Interaction Button */}
              <button
                type="button"
                onClick={() => {
                  warmUpMatterport()
                  setIsInteractive(true)
                }}
                onMouseEnter={warmUpMatterport}
                onFocus={warmUpMatterport}
                aria-label="Click to explore interactive 3D virtual tour"
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {/* Premium Stylized Play Button */}
                <div className="relative flex items-center justify-center">
                  {/* Ambient subtle glow aura on hover */}
                  <div className="absolute inset-0 rounded-full bg-brand-500/25 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:bg-brand-500/40" />

                  {/* Frosted Glass Disc housing the custom outline play icon */}
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur-md shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:ring-brand-400/60 group-hover:bg-black/60 group-hover:shadow-[0_0_35px_rgba(176,141,87,0.45)]">
                    <img
                      src="/play-icon-white.png"
                      alt=""
                      aria-hidden="true"
                      width={512}
                      height={512}
                      className="h-9 w-9 sm:h-11 sm:w-11 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>

                <span className="mt-3.5 sm:mt-4 text-base sm:text-lg font-medium text-white drop-shadow-md transition-colors duration-200 group-hover:text-brand-300">
                  Click to Explore in 3D
                </span>
                <span className="mt-1 text-xs sm:text-sm text-white/75 drop-shadow-sm px-4">
                  Orbit rooms • Dollhouse 3D view • Floor plan navigation
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
