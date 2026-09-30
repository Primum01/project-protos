import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'full' | 'xl' | 'lg' | 'md'
  fullWidth?: boolean
  variant?: SkeletonProps['variant']
  className?: string
}

const sizeMap = {
  sm: 'h-8 px-4 w-24',
  md: 'h-10 px-5 w-32',
  lg: 'h-12 px-6 w-40',
}

export function SkeletonButton({
  size = 'md',
  rounded = 'full',
  fullWidth = false,
  variant = 'light',
  className,
}: SkeletonButtonProps) {
  return (
    <Skeleton
      variant={variant}
      rounded={rounded === 'full' ? 'full' : rounded}
      className={cn(
        sizeMap[size],
        fullWidth && 'w-full',
        className,
      )}
    />
  )
}
