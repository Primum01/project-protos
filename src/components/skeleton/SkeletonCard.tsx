import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export function SkeletonCard({ children, className, ...props }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-xl border border-ink-950/8 bg-paper shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
