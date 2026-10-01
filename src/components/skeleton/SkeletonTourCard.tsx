import { Card } from '@/components/ui'
import { Skeleton } from './Skeleton'

export function SkeletonTourCard() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border border-ink-950/8 bg-paper shadow-soft">
      {/* ── 3D Embed / Photo Container ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-200/60">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />

        {/* Top-left property type pill skeleton */}
        <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 z-10">
          <Skeleton
            variant="dark"
            rounded="full"
            className="h-4 sm:h-5 w-14 sm:w-20 bg-black/25"
          />
        </div>

        {/* Top-right kebab menu button skeleton */}
        <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10">
          <Skeleton
            variant="dark"
            rounded="full"
            className="h-7 w-7 sm:h-8 sm:w-8 bg-black/25"
          />
        </div>
      </div>

      {/* ── Property Details ── */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div className="space-y-1.5 sm:space-y-2">
          {/* Title */}
          <Skeleton rounded="sm" className="h-3.5 sm:h-5 w-4/5" />
          {/* Location */}
          <Skeleton rounded="sm" className="h-2.5 sm:h-3.5 w-1/2" />
        </div>

        {/* Bottom metadata row */}
        <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-ink-950/6 pt-2.5 sm:pt-3">
          {/* Bed / Bath count */}
          <Skeleton rounded="sm" className="h-2.5 sm:h-3.5 w-16 sm:w-28" />
          {/* Details arrow */}
          <Skeleton rounded="sm" className="h-2.5 sm:h-3.5 w-10 sm:w-14" />
        </div>
      </div>
    </Card>
  )
}

export const SkeletonListingCard = SkeletonTourCard
