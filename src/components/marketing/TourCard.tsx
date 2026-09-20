import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import { extractEmbedSrc } from '@/lib/embed'
import { recordLinkShared } from '@/lib/firebase/analytics'
import { cn } from '@/lib/cn'

export interface TourCardData {
  slug: string
  title: string
  location?: string
  city?: string
  country?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  accent?: string
  description?: string
  amenities?: string[]
  externalUrl?: string
  photoUrl?: string
  embedCode?: string
}

const accentClasses: Record<string, string> = {
  clay: 'from-[#d9a373] to-[#8c5a3c]',
  olive: 'from-[#a9b48a] to-[#5f6b48]',
  ink: 'from-[#4a4a55] to-[#1a1a22]',
  sand: 'from-[#e3dcc9] to-[#b9a97e]',
}

export function TourCard({ tour }: { tour: TourCardData }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const embedSrc = extractEmbedSrc(tour.embedCode || tour.externalUrl)
  const tourLink = tour.externalUrl || embedSrc

  // Close kebab menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleCopyLink() {
    void recordLinkShared(tour.slug, tour.title)
    const urlToCopy = tourLink || window.location.origin + `/listing/${tour.slug}`
    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setMenuOpen(false)
      }, 1500)
    } catch {
      setMenuOpen(false)
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden border border-ink-950/8 bg-paper shadow-soft transition-all duration-200 hover:shadow-lifted">
      {/* ── 3D Embed / Photo Container ── */}
      <div
        className={cn(
          'relative aspect-[16/10] w-full overflow-hidden bg-ink-950',
          accentClasses[tour.accent ?? 'clay'] ?? accentClasses.clay,
        )}
      >
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={tour.title}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
            loading="lazy"
          />
        ) : tour.photoUrl ? (
          <img
            src={tour.photoUrl}
            alt={tour.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
            3D tour preview
          </div>
        )}

        {/* Top-left property type badge */}
        {tour.propertyType && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm shadow-sm">
            {tour.propertyType}
          </span>
        )}

        {/* Top-right Kebab Menu */}
        <div ref={menuRef} className="absolute right-3 top-3 z-20">
          <button
            type="button"
            aria-label="Tour options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 shadow-md focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-ink-950/10 bg-paper py-1.5 shadow-lifted z-30 animate-in fade-in zoom-in-95 duration-100">
              {tourLink && (
                <a
                  href={tourLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2 text-xs font-medium text-ink-800 hover:bg-ink-50 hover:text-brand-600 transition-colors"
                >
                  <span>Visit tour URL</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              <Link
                to={`/listing/${tour.slug}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2 text-xs font-medium text-ink-800 hover:bg-ink-50 hover:text-brand-600 transition-colors"
              >
                <span>View property details</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-ink-800 hover:bg-ink-50 hover:text-brand-600 transition-colors"
              >
                <span>{copied ? 'Link copied!' : 'Copy tour link'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Property Details ── */}
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <Link
          to={`/listing/${tour.slug}`}
          className="text-base font-semibold text-ink-950 transition-colors hover:text-brand-600"
        >
          {tour.title}
        </Link>
        <p className="text-xs text-ink-500">
          {[tour.location, tour.city, tour.country].filter(Boolean).join(', ')}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-ink-950/6">
          <p className="text-xs text-ink-500">
            {tour.bedrooms} bed &middot; {tour.bathrooms} bath
          </p>
          <Link
            to={`/listing/${tour.slug}`}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Details &rarr;
          </Link>
        </div>
      </div>
    </Card>
  )
}
