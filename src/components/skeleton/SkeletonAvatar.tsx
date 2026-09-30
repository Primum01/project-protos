import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  variant?: SkeletonProps['variant']
  className?: string
}

const sizeMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
}

export function SkeletonAvatar({
  size = 'md',
  shape = 'circle',
  variant = 'light',
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      variant={variant}
      rounded={shape === 'circle' ? 'full' : 'md'}
      className={cn('shrink-0', sizeMap[size], className)}
    />
  )
}
