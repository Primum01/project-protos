import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DropdownOption<T = string> {
  value: T
  label: string
  subtitle?: string
  badge?: string
  icon?: ReactNode
}

export interface AdminDropdownProps<T = string> {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  icon?: ReactNode
  className?: string
  buttonClassName?: string
  panelClassName?: string
  align?: 'left' | 'right'
  disabled?: boolean
  id?: string
  title?: string
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-brand-600"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function AdminDropdown<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchable = false,
  searchPlaceholder = 'Search…',
  icon,
  className,
  buttonClassName,
  panelClassName,
  align = 'left',
  disabled = false,
  id,
  title,
}: AdminDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isFullWidth = className?.includes('w-full')

  // Close on click outside or Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearch('')
    } else if (searchable) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, searchable])

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  )

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options
    const q = search.trim().toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        (o.badge && o.badge.toLowerCase().includes(q)),
    )
  }, [options, search, searchable])

  return (
    <div
      ref={ref}
      className={cn('relative text-left', isFullWidth ? 'w-full' : 'inline-block', className)}
    >
      {/* Pill Trigger Button Matching Tours.tsx Dropdown */}
      <button
        id={id}
        type="button"
        title={title}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center justify-between gap-1.5 sm:gap-2 rounded-full border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium',
          'shadow-sm transition-all duration-200 select-none whitespace-nowrap min-w-0 disabled:opacity-50 disabled:pointer-events-none',
          isFullWidth && 'w-full',
          open
            ? 'border-ink-950/20 bg-ink-950 text-white shadow-lg'
            : 'border-ink-950/10 bg-white text-ink-800 hover:border-ink-950/20 hover:shadow-md',
          buttonClassName,
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider',
                open ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700',
              )}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>
        <span className="shrink-0 ml-1">
          <IconChevron open={open} />
        </span>
      </button>

      {/* Floating Panel with iosDropIn and Glassmorphism */}
      {open && (
        <div
          role="listbox"
          style={{
            animation: 'iosDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both',
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
          className={cn(
            'absolute top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl backdrop-saturate-150',
            isFullWidth ? 'w-full min-w-[260px]' : 'min-w-[240px]',
            'max-w-[calc(100vw-2rem)]',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {/* Optional Search bar inside Panel */}
          {searchable && (
            <div className="border-b border-ink-950/8 px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-ink-100/70 px-3 py-1.5">
                <span className="text-ink-400">
                  <IconSearch />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-ink-800 placeholder-ink-400 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-ink-400 hover:text-ink-700 transition-colors"
                  >
                    <IconX />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-ink-400">
                No matching options
              </p>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm text-left transition-colors duration-100',
                      i < filtered.length - 1 && 'border-b border-ink-950/5',
                      isSelected
                        ? 'bg-brand-50/80 font-semibold text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50/70',
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="rounded-full bg-ink-100 px-1.5 py-0.2 text-[10px] font-semibold text-ink-600">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subtitle && (
                        <span className="truncate text-[11px] font-normal text-ink-400 mt-0.5">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && <IconCheck />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
