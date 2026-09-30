import { Skeleton } from './Skeleton'
import { SkeletonCard } from './SkeletonCard'

export function SkeletonListingForm() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading listing details for editing"
      className="mx-auto max-w-6xl p-6 lg:p-10 space-y-8"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton rounded="lg" className="h-9 w-9" />
          <div className="space-y-1.5">
            <Skeleton rounded="sm" className="h-7 w-48" />
            <Skeleton rounded="sm" className="h-3.5 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton rounded="lg" className="h-9 w-20" />
          <Skeleton rounded="lg" className="h-9 w-28" />
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-ink-950/8 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} rounded="lg" className="h-8 w-24" />
        ))}
      </div>

      {/* Form sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main form body (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard className="p-6 space-y-5">
            <Skeleton rounded="sm" className="h-5 w-32" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton rounded="sm" className="h-3.5 w-24" />
                <Skeleton rounded="lg" className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton rounded="sm" className="h-3.5 w-20" />
                  <Skeleton rounded="lg" className="h-10 w-full" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton rounded="sm" className="h-3.5 w-20" />
                  <Skeleton rounded="lg" className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Skeleton rounded="sm" className="h-3.5 w-28" />
                <Skeleton rounded="lg" className="h-24 w-full" />
              </div>
            </div>
          </SkeletonCard>

          <SkeletonCard className="p-6 space-y-4">
            <Skeleton rounded="sm" className="h-5 w-40" />
            <Skeleton rounded="xl" className="h-36 w-full" />
          </SkeletonCard>
        </div>

        {/* Sidebar settings (1 col) */}
        <div className="space-y-6">
          <SkeletonCard className="p-6 space-y-4">
            <Skeleton rounded="sm" className="h-4 w-28" />
            <Skeleton rounded="full" className="h-6 w-20" />
            <Skeleton rounded="sm" className="h-3.5 w-full" />
            <Skeleton rounded="lg" className="h-10 w-full" />
          </SkeletonCard>

          <SkeletonCard className="p-6 space-y-4">
            <Skeleton rounded="sm" className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton rounded="sm" className="h-3.5 w-full" />
              <Skeleton rounded="sm" className="h-3.5 w-4/5" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  )
}
