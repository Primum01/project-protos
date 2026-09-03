import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import type { ExampleTour } from '@/data/exampleTours'
import { cn } from '@/lib/cn'

const accentClasses: Record<ExampleTour['accent'], string> = {
  clay: 'from-[#d9a373] to-[#8c5a3c]',
  olive: 'from-[#a9b48a] to-[#5f6b48]',
  ink: 'from-[#4a4a55] to-[#1a1a22]',
  sand: 'from-[#e3dcc9] to-[#b9a97e]',
}

function TourCardInner({ tour }: { tour: ExampleTour }) {
  const photoUrl = (tour as ExampleTour & { photoUrl?: string }).photoUrl
  return (
    <Card hoverable className="flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          'relative aspect-4/3 w-full overflow-hidden bg-gradient-to-br',
          accentClasses[tour.accent],
        )}
      >
        {/* Photo cover — shown when an uploaded image exists */}
        {photoUrl && (
          <img
            src={photoUrl}
            alt={tour.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink-800">
          {tour.propertyType}
        </span>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          360&deg; 3D tour
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold text-ink-950 group-hover:underline">
          {tour.title}
        </h3>
        <p className="text-sm text-ink-500">
          {tour.city}, {tour.country}
        </p>
        <p className="mt-auto pt-3 text-sm text-ink-500">
          {tour.bedrooms} bed &middot; {tour.bathrooms} bath
        </p>
      </div>
    </Card>
  )
}

export function TourCard({ tour }: { tour: ExampleTour }) {
  if (tour.externalUrl) {
    return (
      <a
        href={tour.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full"
      >
        <TourCardInner tour={tour} />
      </a>
    )
  }

  return (
    <Link to={`/tour/${tour.slug}`} className="group block h-full">
      <TourCardInner tour={tour} />
    </Link>
  )
}
