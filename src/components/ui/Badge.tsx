import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

export function Badge({ children, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-ink-950/10 bg-sand-100 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink-700',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
