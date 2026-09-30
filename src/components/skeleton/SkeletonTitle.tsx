import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonTitleProps {
  level?: 'h1' | 'h2' | 'h3' | 'h4'
  width?: string
  variant?: SkeletonProps['variant']
  className?: string
}

const levelHeightMap: Record<NonNullable<SkeletonTitleProps['level']>, string> = {
  h1: 'h-8 sm:h-10',
  h2: 'h-7 sm:h-8',
  h3: 'h-6 sm:h-7',
  h4: 'h-5 sm:h-6',
}

/**
 * Heading skeleton matching font-display proportions and typical title widths.
 */
export function SkeletonTitle({
  level = 'h2',
  width = 'w-2/3',
  variant = 'light',
  className,
}: SkeletonTitleProps) {
  return (
    <Skeleton
      variant={variant}
      rounded="md"
      className={cn(levelHeightMap[level], width, className)}
    />
  )
}
