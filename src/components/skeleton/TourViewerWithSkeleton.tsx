import { useEffect, useState, type IframeHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { TourViewerSkeleton } from './TourViewerSkeleton'

export interface TourViewerWithSkeletonProps extends IframeHTMLAttributes<HTMLIFrameElement> {
  src: string
  title: string
  containerClassName?: string
  aspectRatio?: 'video' | '16/10' | '16/9' | 'custom'
  loadingMessage?: string
  sandbox?: string
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
  loadingMessage = 'loading...',
  sandbox = 'allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock',
  className,
  onLoad,
  loading,
  allow,
  ...props
}: TourViewerWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Reset loading state and install safety fallback timeout when src changes
  useEffect(() => {
    setIsLoaded(false)
    // Safety fallback: Ensure skeleton fades out smoothly after 4s even on slow mobile connections
    // or when mobile browsers suppress/delay cross-origin iframe load events
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [src])

  const hasCustomRounding = Boolean(
    containerClassName && /\brounded(-[a-z0-9]+)?\b/.test(containerClassName),
  )

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-ink-950',
        !hasCustomRounding && 'rounded-xl',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === '16/10' && 'aspect-[16/10]',
        aspectRatio === '16/9' && 'aspect-[16/9]',
        containerClassName,
      )}
    >
      {/* Embedded 3D viewer (kept rendered in DOM so mobile WebGL contexts initialize immediately) */}
      <iframe
        src={src}
        title={title}
        onLoad={(e) => {
          setIsLoaded(true)
          if (onLoad) onLoad(e)
        }}
        className={cn(
          'block absolute inset-0 h-full w-full border-0',
          className,
        )}
        allowFullScreen
        allow={allow ?? 'autoplay; fullscreen; web-share; xr-spatial-tracking; gyroscope; accelerometer'}
        sandbox={sandbox}
        loading={loading ?? 'eager'}
        {...props}
      />

      {/* Skeleton overlay — fades out smoothly once iframe loads or timeout fires */}
      <div
        className={cn(
          'absolute inset-0 z-10 transition-opacity duration-700 ease-out',
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
        aria-hidden={isLoaded}
      >
        <TourViewerSkeleton
          aspectRatio="custom"
          message={loadingMessage}
          className="h-full w-full rounded-none"
        />
      </div>
    </div>
  )
}
