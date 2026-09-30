import { useState, type IframeHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { TourViewerSkeleton } from './TourViewerSkeleton'

export interface TourViewerWithSkeletonProps extends IframeHTMLAttributes<HTMLIFrameElement> {
  src: string
  title: string
  containerClassName?: string
  aspectRatio?: 'video' | '16/10' | '16/9' | 'custom'
  loadingMessage?: string
}

/**
 * Interactive 3D tour container with reserved dimensions and progressive loading.
 * Displays TourViewerSkeleton while the iframe initializes, fading the viewer in smoothly upon load.
 */
export function TourViewerWithSkeleton({
  src,
  title,
  containerClassName,
  aspectRatio = 'video',
  loadingMessage = 'Loading 3D space…',
  className,
  onLoad,
  ...props
}: TourViewerWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-ink-950',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === '16/10' && 'aspect-[16/10]',
        aspectRatio === '16/9' && 'aspect-[16/9]',
        containerClassName,
      )}
    >
      {/* Skeleton overlay until iframe triggers onLoad */}
      {!isLoaded && (
        <TourViewerSkeleton
          aspectRatio="custom"
          message={loadingMessage}
          className="absolute inset-0 z-10 h-full w-full rounded-none"
        />
      )}

      {/* Embedded 3D viewer */}
      <iframe
        src={src}
        title={title}
        onLoad={(e) => {
          setIsLoaded(true)
          if (onLoad) onLoad(e)
        }}
        className={cn(
          'h-full w-full border-0 transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none',
          className,
        )}
        allowFullScreen
        allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
        loading="lazy"
        {...props}
      />
    </div>
  )
}
