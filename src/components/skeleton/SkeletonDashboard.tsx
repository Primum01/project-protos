import { Skeleton } from './Skeleton'
import { SkeletonCard } from './SkeletonCard'
import { SkeletonTable } from './SkeletonTable'

export function SkeletonStatCard() {
  return (
    <SkeletonCard className="p-6">
      <Skeleton rounded="sm" className="h-4 w-24" />
      <Skeleton rounded="md" className="mt-3 h-8 w-16" />
      <Skeleton rounded="sm" className="mt-2 h-3 w-32" />
    </SkeletonCard>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="w-full space-y-10" aria-busy="true" aria-label="Loading dashboard metrics">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Recent listings section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton rounded="sm" className="h-5 w-32" />
          <Skeleton rounded="sm" className="h-4 w-16" />
        </div>
        <SkeletonTable
          columns={[
            { header: 'Property', width: '40%' },
            { header: 'Price', width: '20%' },
            { header: 'Status', width: '20%' },
            { header: 'Published', width: '20%' },
          ]}
          rows={5}
        />
      </div>
    </div>
  )
}
