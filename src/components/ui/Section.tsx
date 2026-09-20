import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './Container'

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  children: ReactNode
  eyebrow?: string
  title?: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
}

export function Section({
  children,
  className,
  eyebrow,
  title,
  description,
  align = 'left',
  ...rest
}: SectionProps) {
  const centered = align === 'center'
  return (
    <section className={cn('py-14 sm:py-20 lg:py-28', className)} {...rest}>
      <Container>
        {(eyebrow || title || description) && (
          <div className={cn('mb-12 max-w-2xl', centered && 'mx-auto text-center')}>
            {eyebrow && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-2xl sm:text-3xl font-medium leading-tight lg:text-4xl">{title}</h2>
            )}
            {description && (
              <p className="mt-4 text-base leading-relaxed text-ink-500">{description}</p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
