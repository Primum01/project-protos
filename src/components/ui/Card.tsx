import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
}

export function Card({ children, className, hoverable = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-ink-950/8 bg-paper shadow-soft',
        hoverable &&
          'transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lifted',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
