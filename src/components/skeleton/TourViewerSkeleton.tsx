import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'

export interface TourViewerSkeletonProps {
  aspectRatio?: 'video' | '16/10' | '16/9' | 'custom'
  className?: string
  message?: string
}

const aspectMap = {
  video: 'aspect-video',
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  custom: '',
}

/**
 * Dedicated 3D Tour Viewer Skeleton for TwinSpace.
 * Accurately reserves dimensions and models the Matterport 3D canvas layout.
 */
export function TourViewerSkeleton({
  aspectRatio = 'video',
  className,
  message = 'Initializing 3D Space…',
}: TourViewerSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading interactive 3D virtual tour"
      className={cn(
        'relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-ink-950 text-white',
        aspectMap[aspectRatio],
        className,
      )}
    >
      {/* Background 3D grid effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Subtle shimmer layer */}
      <Skeleton variant="dark" className="absolute inset-0 h-full w-full" />

      {/* Top bar controls placeholder */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-brand-500 animate-ping opacity-75" />
          <span className="text-[11px] font-medium tracking-wide uppercase text-white/70">
            TwinSpace 360
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="dark" rounded="full" className="h-8 w-8" />
          <Skeleton variant="dark" rounded="full" className="h-8 w-8" />
        </div>
      </div>

      {/* Center 3D loading emblem */}
      <div className="relative z-10 mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md shadow-2xl">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-500 animate-pulse"
            aria-hidden="true"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <p className="font-medium text-sm text-white/90 tracking-wide">{message}</p>
        <p className="mt-1 text-xs text-white/50 max-w-xs">
          Preparing high-resolution photogrammetry &amp; spatial dollhouse…
        </p>
      </div>

      {/* Bottom control bar placeholder */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Skeleton variant="dark" rounded="md" className="h-6 w-16" />
          <Skeleton variant="dark" rounded="md" className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="dark" rounded="full" className="h-7 w-7" />
          <Skeleton variant="dark" rounded="full" className="h-7 w-7" />
        </div>
      </div>
    </div>
  )
}
