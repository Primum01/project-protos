import { useMemo, useRef, useState, useEffect } from "react"
import { MarketingLayout } from "@/components/layout/MarketingLayout"
import { TourCard } from "@/components/marketing/TourCard"
import { Section } from "@/components/ui"
import { usePublishedListings } from "@/hooks/useListings"
import { usePageMeta } from "@/hooks/usePageMeta"
import type { Listing } from "@/types/listing"

/** Seed list — any location found in live data that is not here gets auto-added. */
const SEED_LOCATIONS = new Set([
  "Westlands","Parklands","Lavington","Karen","Kilimani","Kileleshwa",
  "Runda","Muthaiga","Gigiri","Spring Valley","Loresho","South B",
  "South C","Langata","Upperhill","CBD","Diani","Lamu","Mombasa","Nakuru",
])

/**
 * Merges the seed list with any locations found in the data.
 * New locations from live listings are automatically included — no code change needed.
 */
function buildOptions(locations: (string | undefined)[]): string[] {
  const merged = new Set(SEED_LOCATIONS)
  for (const loc of locations) {
    if (loc && loc.trim()) merged.add(loc.trim())
  }
  return Array.from(merged).sort((a, b) => a.localeCompare(b))
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function IconPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function IconX() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

/* ── iOS Dropdown ───────────────────────────────────────────────────────── */
function LocationDropdown({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape key — single combined effect
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  // Reset query when dropdown closes
  useEffect(() => { if (!open) setQuery('') }, [open])

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  )

  return (
    <div ref={ref} className="relative">
      {/* Pill trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium
          shadow-sm transition-all duration-200 select-none whitespace-nowrap
          ${open
            ? "border-ink-950/20 bg-ink-950 text-white shadow-lg"
            : "border-ink-950/10 bg-white text-ink-800 hover:border-ink-950/20 hover:shadow-md"
          }
        `}
      >
        <IconPin />
        <span>{value || "All locations"}</span>
        <IconChevron open={open} />
      </button>

      {/* Panel */}
      {open && (
        <div
          role="listbox"
          style={{ animation: "iosDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both", transformOrigin: "top left" }}
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-white/60 bg-white/85 shadow-2xl backdrop-blur-xl backdrop-saturate-150"
        >
          {/* Search inside panel */}
          <div className="border-b border-ink-950/8 px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-ink-100/70 px-3 py-1.5">
              <span className="text-ink-400"><IconSearch /></span>
              <input
                autoFocus
                type="text"
                placeholder="Search location…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-ink-800 placeholder-ink-400 outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-ink-400 hover:text-ink-700 transition-colors">
                  <IconX />
                </button>
              )}
            </div>
          </div>

          {/* All row */}
          <button
            role="option"
            aria-selected={value === ""}
            onClick={() => { onChange(""); setOpen(false) }}
            className={`flex w-full items-center justify-between gap-3 border-b border-ink-950/6 px-4 py-3 text-sm transition-colors duration-100 ${value === "" ? "bg-ink-50 font-semibold text-ink-950" : "text-ink-700 hover:bg-ink-50/70"}`}
          >
            <span>All locations</span>
            {value === "" && <IconCheck />}
          </button>

          {/* Scrollable list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-ink-400">No matches for "{query}"</p>
            ) : (
              filtered.map((loc, i) => {
                const selected = value === loc
                return (
                  <button
                    key={loc}
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(loc); setOpen(false) }}
                    className={`
                      flex w-full items-center justify-between gap-3 px-4 py-3
                      text-sm transition-colors duration-100
                      ${i < filtered.length - 1 ? "border-b border-ink-950/5" : ""}
                      ${selected ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-ink-50/70"}
                    `}
                  >
                    <span>{loc}</span>
                    {selected && <IconCheck />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Search bar ─────────────────────────────────────────────────────────── */
function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-full border border-ink-950/10 bg-white px-4 py-2.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-ink-950/20 max-w-xs">
      <span className="text-ink-400 shrink-0"><IconSearch /></span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search properties…"}
        className="flex-1 bg-transparent text-sm text-ink-800 placeholder-ink-400 outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-ink-400 hover:text-ink-700 transition-colors shrink-0">
          <IconX />
        </button>
      )}
    </div>
  )
}

/* ── Filter bar combining dropdown + search ─────────────────────────────── */
function FilterBar({
  options,
  location,
  onLocation,
  search,
  onSearch,
  count,
}: {
  options: string[]
  location: string
  onLocation: (v: string) => void
  search: string
  onSearch: (v: string) => void
  count: number
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <LocationDropdown options={options} value={location} onChange={onLocation} />
      <SearchBar value={search} onChange={onSearch} />

      {/* Active chips */}
      {location && (
        <button
          onClick={() => onLocation("")}
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-80"
        >
          {location} <IconX />
        </button>
      )}

      <span className="ml-auto text-sm text-ink-400 tabular-nums whitespace-nowrap">
        {count} {count === 1 ? "property" : "properties"}
      </span>
    </div>
  )
}

/* ── Data helpers ───────────────────────────────────────────────────────── */
type TourCardData = {
  slug: string; title: string; location?: string; city: string; country: string
  propertyType: string; bedrooms: number; bathrooms: number
  accent: 'clay' | 'olive' | 'ink' | 'sand'; description: string
  amenities: string[]; externalUrl?: string; photoUrl?: string
}

function listingToCard(listing: Listing): TourCardData {
  return {
    slug: listing.id,
    title: listing.name,
    location: listing.location,
    city: listing.city,
    country: listing.country,
    propertyType: listing.propertyType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    accent: listing.accent,
    description: listing.description,
    amenities: listing.amenities,
    externalUrl: listing.tourUrl || undefined,
    photoUrl: listing.photoUrl || undefined,
  }
}

function matchesSearch(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase())
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export function Tours() {
  const { listings, loading } = usePublishedListings()

  usePageMeta({
    title: 'Browse 3D Property Tours — TwinSpace',
    description:
      'Explore interactive 3D tours of properties across Nairobi, Mombasa, and beyond. Find your next stay and walk through it before you book.',
    path: '/tours',
  })

  const [location, setLocation] = useState("")
  const [search, setSearch] = useState("")

  const locationOptions = useMemo(() => buildOptions(listings.map((l) => l.location)), [listings])

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const locationMatch = !location || l.location?.toLowerCase().includes(location.toLowerCase())
      const searchMatch = !search || [l.name, l.location, l.city, l.propertyType, l.description]
        .some((f) => matchesSearch(f ?? "", search))
      return locationMatch && searchMatch
    })
  }, [listings, location, search])

  return (
    <MarketingLayout>
      <div className="h-20" />

      <Section
        eyebrow="Available properties"
        title="Browse our listings"
        description="Properties currently available to view. Click any card to launch the 3D tour."
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-20 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-4 text-ink-300" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="font-medium text-ink-500">No properties listed yet</p>
            <p className="mt-1 text-sm text-ink-400">Check back soon — new tours are added regularly.</p>
          </div>
        ) : (
          <>
            <FilterBar
              options={locationOptions}
              location={location}
              onLocation={setLocation}
              search={search}
              onSearch={setSearch}
              count={filtered.length}
            />
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((l) => <TourCard key={l.id} tour={listingToCard(l)} />)}
              </div>
            ) : (
              <p className="text-ink-400">
                No listings match your filters.{" "}
                <button onClick={() => { setLocation(""); setSearch("") }} className="text-brand-600 underline">Clear all</button>
              </p>
            )}
          </>
        )}
      </Section>
    </MarketingLayout>
  )
}
