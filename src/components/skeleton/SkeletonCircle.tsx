import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonCircleProps {
  size?: number | string
  variant?: SkeletonProps['variant']
  className?: string
}

export function SkeletonCircle({
  size = 40,
  variant = 'light',
  className,
}: SkeletonCircleProps) {
  const isNumber = typeof size === 'number'
  const style = isNumber ? { width: size, height: size } : undefined
  const sizeClass = !isNumber ? (size as string) : ''

  return (
    <Skeleton
      variant={variant}
      rounded="full"
      style={style}
      className={cn('shrink-0', sizeClass, className)}
    />
  )
}
