import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/cn'
import {
  searchLocations,
  searchLocationsImmediate,
  type LocationSearchOptions,
  type LocationSuggestion,
  type LocationType,
} from '@/lib/location'

export interface LocationAutocompleteProps {
  id?: string
  name?: string
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: LocationSuggestion) => void
  type?: LocationType
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  inputClassName?: string
  dropdownClassName?: string
  variant?: 'standard' | 'sheet'
  countryFilter?: string
  maxSuggestions?: number
  helperText?: string
  error?: string
  autoComplete?: string
}

/**
 * Helper to highlight matching prefix/substring in suggestion text
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <span>{text}</span>

  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)

  if (idx === -1) return <span>{text}</span>

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)

  return (
    <span>
      {before}
      <span className="font-bold text-brand-600 underline underline-offset-2">{match}</span>
      {after}
    </span>
  )
}

/**
 * Type Pill Badge
 */
function TypeBadge({ type }: { type: LocationSuggestion['type'] }) {
  switch (type) {
    case 'city':
      return (
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
          City
        </span>
      )
    case 'county':
      return (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
          County
        </span>
      )
    case 'area':
      return (
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
          Area
        </span>
      )
    case 'country':
      return (
        <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
          Country
        </span>
      )
    default:
      return (
        <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 border border-ink-200">
          Location
        </span>
      )
  }
}

export const LocationAutocomplete = forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  function LocationAutocomplete(
    {
      id,
      name,
      label,
      value,
      onChange,
      onSelect,
      type = 'all',
      placeholder = 'e.g. Nairobi, Westlands, or Kenya',
      disabled = false,
      required = false,
      className,
      inputClassName,
      dropdownClassName,
      variant = 'standard',
      countryFilter,
      maxSuggestions = 8,
      helperText,
      error,
      autoComplete = 'off',
    },
    forwardedRef,
  ) {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [isSearching, setIsSearching] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const internalInputRef = useRef<HTMLInputElement | null>(null)
    const debounceTimerRef = useRef<any>(null)

    // Sync ref
    const setInputRef = useCallback(
      (el: HTMLInputElement | null) => {
        internalInputRef.current = el
        if (typeof forwardedRef === 'function') {
          forwardedRef(el)
        } else if (forwardedRef) {
          forwardedRef.current = el
        }
      },
      [forwardedRef],
    )

    // Search executor
    const performSearch = useCallback(
      (queryText: string) => {
        const trimmed = queryText.trim()
        if (!trimmed) {
          setSuggestions([])
          setIsOpen(false)
          setHighlightedIndex(-1)
          return
        }

        const options: LocationSearchOptions = {
          query: trimmed,
          type,
          country: countryFilter,
          limit: maxSuggestions,
        }

        // 1. Instant Synchronous Search for 0ms visual feedback
        const immediate = searchLocationsImmediate(options)
        setSuggestions(immediate)
        if (immediate.length > 0) {
          setIsOpen(true)
        }

        // 2. Debounced API search for server/cached results
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        setIsSearching(true)
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const results = await searchLocations(options)
            if (results && results.length > 0) {
              setSuggestions(results)
              setIsOpen(true)
            } else if (immediate.length === 0) {
              setIsOpen(false)
            }
          } catch {
            // Keep immediate results if error
          } finally {
            setIsSearching(false)
          }
        }, 150)
      },
      [type, countryFilter, maxSuggestions],
    )

    // Handle input change
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const nextVal = e.target.value
      onChange(nextVal)
      setHighlightedIndex(-1)
      performSearch(nextVal)
    }

    // Handle suggestion selection
    function handleSelectSuggestion(suggestion: LocationSuggestion) {
      // Determine what text to place into the input based on type
      let chosenText = suggestion.name
      if (type === 'property' && suggestion.type === 'area' && suggestion.city) {
        chosenText = `${suggestion.name}, ${suggestion.city}`
      }

      onChange(chosenText)
      if (onSelect) {
        onSelect(suggestion)
      }

      setIsOpen(false)
      setHighlightedIndex(-1)
    }

    // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'ArrowDown' && value.trim()) {
          performSearch(value)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
          break
        case 'Enter':
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            e.preventDefault()
            handleSelectSuggestion(suggestions[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
        case 'Tab':
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[highlightedIndex])
          } else {
            setIsOpen(false)
          }
          break
      }
    }

    // Close dropdown on click outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      }
    }, [])

    // Styling variants
    const standardInputStyle =
      'w-full rounded-md border border-ink-950/15 bg-paper px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none disabled:opacity-50'

    const sheetInputStyle =
      'w-full text-xs print:text-xs text-ink-900 bg-transparent border-b border-dashed border-transparent hover:border-ink-950/30 focus:border-brand-500 focus:outline-none pb-0.5 disabled:opacity-90 placeholder:text-ink-400'

    return (
      <div ref={containerRef} className={cn('relative flex flex-col gap-1.5 text-left', className)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink-800">
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={setInputRef}
            id={id}
            name={name}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={id ? `${id}-suggestions-list` : undefined}
            aria-activedescendant={
              highlightedIndex >= 0 && id ? `${id}-suggestion-${highlightedIndex}` : undefined
            }
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim() && suggestions.length > 0) {
                setIsOpen(true)
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={cn(
              variant === 'sheet' ? sheetInputStyle : standardInputStyle,
              error && 'border-red-500 focus:border-red-500',
              inputClassName,
            )}
          />

          {/* Micro Loading / Pin Icon for Standard Variant */}
          {variant === 'standard' && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-300">
              {isSearching ? (
                <svg className="h-4 w-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Suggestions Dropdown Menu */}
        {isOpen && suggestions.length > 0 && (
          <ul
            id={id ? `${id}-suggestions-list` : undefined}
            role="listbox"
            style={{ animation: 'iosDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both', transformOrigin: 'top left' }}
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl backdrop-saturate-150 focus:outline-none',
              dropdownClassName,
            )}
          >
            {suggestions.map((item, idx) => {
              const isSelected = idx === highlightedIndex
              return (
                <li
                  key={item.id}
                  id={id ? `${id}-suggestion-${idx}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelectSuggestion(item)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs transition-colors',
                    isSelected ? 'bg-amber-500/10 text-ink-950 font-medium' : 'text-ink-700 hover:bg-ink-50',
                  )}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink-900">
                      <HighlightMatch text={item.name} query={value} />
                    </span>
                    <span className="truncate text-[11px] text-ink-400">
                      {item.displayName !== item.name ? item.displayName : item.country}
                    </span>
                  </div>

                  <TypeBadge type={item.type} />
                </li>
              )
            })}
          </ul>
        )}

        {helperText && !error && <p className="text-xs text-ink-400">{helperText}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)

LocationAutocomplete.displayName = 'LocationAutocomplete'
