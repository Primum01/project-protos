import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonParagraphProps {
  lines?: number
  gap?: 'sm' | 'md' | 'lg'
  variant?: SkeletonProps['variant']
  className?: string
}

const defaultWidths = ['w-full', 'w-[96%]', 'w-[92%]', 'w-[88%]', 'w-[65%]']

export function SkeletonParagraph({
  lines = 3,
  gap = 'sm',
  variant = 'light',
  className,
}: SkeletonParagraphProps) {
  const gapClass = gap === 'sm' ? 'space-y-2' : gap === 'md' ? 'space-y-2.5' : 'space-y-3'

  return (
    <div className={cn(gapClass, className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => {
        const widthClass = i === lines - 1 ? 'w-[60%]' : defaultWidths[i % defaultWidths.length]
        return (
          <Skeleton
            key={i}
            variant={variant}
            rounded="sm"
            className={cn('h-3.5', widthClass)}
          />
        )
      })}
    </div>
  )
}
