import { Skeleton } from './Skeleton'

export interface SkeletonTableColumn {
  header?: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface SkeletonTableProps {
  columns?: (SkeletonTableColumn | string)[] | number
  rows?: number
  showHeader?: boolean
  className?: string
}

export function SkeletonTable({
  columns = 5,
  rows = 5,
  showHeader = true,
  className = '',
}: SkeletonTableProps) {
  const normalizedColumns: SkeletonTableColumn[] = Array.isArray(columns)
    ? columns.map((col) => (typeof col === 'string' ? { header: col } : col))
    : Array.from({ length: columns }).map(() => ({}))

  return (
    <div
      aria-busy="true"
      aria-label="Loading table data"
      className={`overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {showHeader && (
            <thead>
              <tr className="border-b border-ink-950/8 bg-ink-50">
                {normalizedColumns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400"
                    style={{ width: col.width }}
                  >
                    {col.header ? (
                      col.header
                    ) : (
                      <Skeleton rounded="sm" className="h-3.5 w-20" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-ink-950/6">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {normalizedColumns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-5 py-3.5 align-middle"
                    style={{ width: col.width }}
                  >
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton rounded="md" className="h-8 w-8 shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <Skeleton rounded="sm" className="h-4 w-3/4" />
                          <Skeleton rounded="sm" className="h-3 w-1/2" />
                        </div>
                      </div>
                    ) : cIdx === normalizedColumns.length - 1 ? (
                      <div className="flex items-center gap-2">
                        <Skeleton rounded="full" className="h-6 w-14" />
                      </div>
                    ) : (
                      <Skeleton
                        rounded="sm"
                        className={`h-4 ${
                          cIdx % 2 === 0 ? 'w-24' : 'w-16'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
