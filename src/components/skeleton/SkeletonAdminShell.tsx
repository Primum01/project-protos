import { Skeleton } from './Skeleton'
import { SkeletonStatCard } from './SkeletonDashboard'
import { SkeletonTable } from './SkeletonTable'

export function SkeletonAdminShell() {
  return (
    <div
      aria-busy="true"
      aria-label="Initializing admin workspace"
      className="flex min-h-screen bg-paper"
    >
      {/* ── Left Sidebar Skeleton (Desktop) ── */}
      <aside className="hidden w-64 flex-col justify-between border-r border-white/10 bg-ink-950 p-6 md:flex">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Skeleton variant="dark" rounded="md" className="h-8 w-8" />
            <Skeleton variant="dark" rounded="sm" className="h-5 w-28" />
          </div>

          {/* Navigation Links (8 items) */}
          <nav className="space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <Skeleton variant="dark" rounded="sm" className="h-4 w-4 shrink-0" />
                <Skeleton
                  variant="dark"
                  rounded="sm"
                  className={`h-3.5 ${i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-20' : 'w-28'}`}
                />
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile / Session area */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="dark" rounded="full" className="h-9 w-9 shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton variant="dark" rounded="sm" className="h-3.5 w-24" />
              <Skeleton variant="dark" rounded="sm" className="h-2.5 w-32" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Skeleton ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        {/* Top Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton rounded="sm" className="h-7 w-48" />
            <Skeleton rounded="sm" className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton rounded="lg" className="h-9 w-24" />
            <Skeleton rounded="lg" className="h-9 w-28" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Data Table */}
        <SkeletonTable
          columns={[
            { header: 'Item', width: '35%' },
            { header: 'Category', width: '20%' },
            { header: 'Status', width: '25%' },
            { header: 'Actions', width: '20%' },
          ]}
          rows={6}
        />
      </main>
    </div>
  )
}
