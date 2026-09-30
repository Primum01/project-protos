import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonTextProps {
  lines?: number
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  lastLineWidth?: string
  variant?: SkeletonProps['variant']
  className?: string
}

const heightMap: Record<NonNullable<SkeletonTextProps['size']>, string> = {
  xs: 'h-2.5',
  sm: 'h-3.5',
  base: 'h-4',
  lg: 'h-5',
  xl: 'h-6',
}

const gapMap: Record<NonNullable<SkeletonTextProps['gap']>, string> = {
  xs: 'space-y-1.5',
  sm: 'space-y-2',
  md: 'space-y-2.5',
  lg: 'space-y-3.5',
}

/**
 * Text lines skeleton. Renders one or multiple lines with an authentic final line variation.
 */
export function SkeletonText({
  lines = 1,
  gap = 'sm',
  size = 'base',
  lastLineWidth = '70%',
  variant = 'light',
  className,
}: SkeletonTextProps) {
  if (lines <= 1) {
    return (
      <Skeleton
        variant={variant}
        rounded="sm"
        className={cn(heightMap[size], 'w-full max-w-full', className)}
      />
    )
  }

  return (
    <div className={cn(gapMap[gap], className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1
        return (
          <Skeleton
            key={i}
            variant={variant}
            rounded="sm"
            style={isLast ? { width: lastLineWidth } : undefined}
            className={cn(heightMap[size], isLast ? '' : 'w-full')}
          />
        )
      })}
    </div>
  )
}
