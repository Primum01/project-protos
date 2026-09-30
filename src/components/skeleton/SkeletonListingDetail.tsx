import { Container } from '@/components/ui'
import { Skeleton } from './Skeleton'
import { SkeletonParagraph } from './SkeletonParagraph'
import { TourViewerSkeleton } from './TourViewerSkeleton'

export function SkeletonListingDetail() {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading property listing">
      <div className="h-20" />

      {/* ── Title bar ── */}
      <Container className="pb-6 pt-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {/* City / Country */}
            <Skeleton rounded="sm" className="h-4 w-32" />
            {/* Name / Title */}
            <Skeleton rounded="md" className="h-9 w-64 sm:w-80" />
            {/* Price */}
            <Skeleton rounded="sm" className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <Skeleton rounded="full" className="h-7 w-20" />
            {/* Share button */}
            <Skeleton rounded="full" className="h-8 w-20" />
          </div>
        </div>
      </Container>

      {/* ── Tour viewer / hero ── */}
      <Container>
        <div className="h-[55vh] min-h-[360px] sm:h-auto sm:aspect-video w-full">
          <TourViewerSkeleton
            aspectRatio="custom"
            className="h-full w-full rounded-xl"
            message="Loading property tour…"
          />
        </div>
      </Container>

      {/* ── Body content & sidebar ── */}
      <Container className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Skeleton rounded="full" className="h-6 w-24" />
            <Skeleton rounded="full" className="h-6 w-20" />
          </div>

          {/* Bed / Bath metadata */}
          <Skeleton rounded="sm" className="h-4 w-44" />

          {/* Description */}
          <div className="pt-2">
            <SkeletonParagraph lines={4} gap="md" />
          </div>

          {/* Amenities grid */}
          <div className="pt-6">
            <Skeleton rounded="md" className="h-6 w-28 mb-4" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md border border-ink-950/10 p-3 bg-paper"
                >
                  <Skeleton rounded="sm" className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="h-fit rounded-xl border border-ink-950/10 p-6 bg-paper shadow-soft space-y-4">
          <Skeleton rounded="md" className="h-5 w-44" />
          <Skeleton rounded="sm" className="h-4 w-full" />
          <Skeleton rounded="sm" className="h-4 w-4/5" />

          {/* Contact rows */}
          <div className="space-y-3 border-t border-ink-950/8 pt-4">
            <div className="flex items-center justify-between">
              <Skeleton rounded="sm" className="h-4 w-28" />
              <Skeleton rounded="md" className="h-6 w-12" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton rounded="sm" className="h-4 w-36" />
              <Skeleton rounded="md" className="h-6 w-12" />
            </div>
          </div>

          {/* Action button */}
          <Skeleton rounded="full" className="h-10 w-full" />

          {/* Link */}
          <div className="flex justify-center pt-2">
            <Skeleton rounded="sm" className="h-4 w-36" />
          </div>
        </aside>
      </Container>
    </div>
  )
}
