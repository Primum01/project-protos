import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Skeleton, type SkeletonProps } from './Skeleton'

export interface SkeletonImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  aspectRatio?: '16/10' | '16/9' | '4/3' | '1/1' | 'video' | 'auto'
  rounded?: SkeletonProps['rounded']
  variant?: SkeletonProps['variant']
  containerClassName?: string
  fallbackText?: string
}

const aspectMap = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  'video': 'aspect-video',
  'auto': '',
}

/**
 * Image skeleton placeholder & smart image loader.
 * Preserves exact container aspect ratio to prevent layout shifts.
 * Smoothly transitions from shimmer placeholder to loaded image.
 */
export function SkeletonImage({
  src,
  alt = '',
  aspectRatio = '16/10',
  rounded = 'none',
  variant = 'light',
  className,
  containerClassName,
  fallbackText,
  loading = 'lazy',
  ...props
}: SkeletonImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const aspectClass = aspectMap[aspectRatio]

  // If no source is provided at all, render pure skeleton
  if (!src) {
    return (
      <div className={cn('relative w-full overflow-hidden', aspectClass, containerClassName)}>
        <Skeleton
          variant={variant}
          rounded={rounded}
          className={cn('h-full w-full', className)}
        />
        {fallbackText && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-400">
            {fallbackText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-ink-100',
        aspectClass,
        containerClassName,
      )}
    >
      {/* Skeleton shown until image is fully loaded */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant={variant}
          rounded={rounded}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* Error state */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink-100 p-3 text-center text-ink-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[11px] font-medium">{fallbackText || 'Image unavailable'}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none',
            className,
          )}
          {...props}
        />
      )}
    </div>
  )
}
