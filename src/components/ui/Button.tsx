import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-ink-950 text-paper hover:bg-ink-800',
  secondary: 'bg-paper text-ink-950 border border-ink-950/15 hover:bg-sand-100',
  ghost: 'bg-transparent text-ink-950 hover:bg-ink-950/5',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-out-soft disabled:opacity-50 disabled:pointer-events-none'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  href?: undefined
}

interface ButtonAsLink extends CommonProps {
  href: string
  external?: boolean
}

type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)

  if ('href' in props && props.href) {
    if (props.external) {
      return (
        <a href={props.href} className={classes} target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    }
    return (
      <Link to={props.href} className={classes}>
        {children}
      </Link>
    )
  }

  const { variant: _variant, size: _size, className: _className, children: _children, ...rest } =
    props as ButtonAsButton
  void _variant
  void _size
  void _className
  void _children
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
