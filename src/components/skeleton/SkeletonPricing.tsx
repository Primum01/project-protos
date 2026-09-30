import { Skeleton } from './Skeleton'
import { SkeletonCard } from './SkeletonCard'

export function SkeletonPricingPlan() {
  return (
    <SkeletonCard className="flex flex-col justify-between p-6 sm:p-7 min-h-[460px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton rounded="sm" className="h-6 w-28" />
          <Skeleton rounded="full" className="h-5 w-16" />
        </div>
        <Skeleton rounded="sm" className="mt-2 h-4 w-40" />

        {/* Price */}
        <div className="mt-6 border-b border-ink-950/8 pb-6">
          <Skeleton rounded="md" className="h-10 w-36" />
          <Skeleton rounded="sm" className="mt-2 h-3.5 w-24" />
        </div>

        {/* Features */}
        <div className="mt-6 space-y-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton rounded="full" className="h-4 w-4 shrink-0" />
              <Skeleton rounded="sm" className={`h-3.5 ${i % 2 === 0 ? 'w-4/5' : 'w-3/5'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Button */}
      <div className="mt-8">
        <Skeleton rounded="full" className="h-11 w-full" />
      </div>
    </SkeletonCard>
  )
}

export function SkeletonPricing() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading pricing packages"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonPricingPlan key={i} />
      ))}
    </div>
  )
}
