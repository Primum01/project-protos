import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | 'full'
  animate?: boolean
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  pill: 'rounded-full',
  full: 'rounded-full',
}

/**
 * Base skeleton primitive for Twinspace.
 * Uses the brand warm ink tones with subtle shimmer animation.
 */
export function Skeleton({
  variant = 'light',
  rounded = 'md',
  animate = true,
  className,
  'aria-hidden': ariaHidden = true,
  ...props
}: SkeletonProps) {
  const isDark = variant === 'dark'

  return (
    <div
      aria-hidden={ariaHidden}
      className={cn(
        roundedMap[rounded],
        animate ? (isDark ? 'ts-skeleton-dark' : 'ts-skeleton') : (isDark ? 'bg-white/10' : 'bg-ink-100'),
        className,
      )}
      {...props}
    />
  )
}
