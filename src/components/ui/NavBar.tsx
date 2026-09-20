import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Container } from './Container'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/tours', label: 'Tours' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

interface NavBarProps {
  /** When true, the bar starts transparent over a hero image and solidifies on scroll. */
  overlay?: boolean
}

export function NavBar({ overlay = false }: NavBarProps) {
  const [scrolled, setScrolled] = useState(!overlay)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!overlay) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overlay])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const isLight = overlay && !scrolled && !menuOpen

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out-soft',
        scrolled || menuOpen ? 'bg-paper/95 shadow-soft backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <Container>
        <nav
          className="relative flex h-20 items-center justify-between py-4"
          aria-label="Primary"
        >
          <Link
            to="/"
            aria-label="TwinSpace – home"
          >
            <img
              src="/logo.png"
              alt="TwinSpace"
              className={cn(
                'h-10 w-auto object-contain transition-all duration-300',
                isLight ? 'brightness-100' : 'brightness-0',
              )}
            />
          </Link>

          <ul className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors',
                      isLight
                        ? 'text-white/80 hover:text-white'
                        : 'text-ink-700 hover:text-ink-950',
                      isActive && (isLight ? 'text-white' : 'text-ink-950'),
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden',
              isLight ? 'text-white hover:bg-white/10' : 'text-ink-950 hover:bg-ink-950/5',
            )}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M2.5 5h15M2.5 10h15M2.5 15h15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </nav>
      </Container>

      {menuOpen && (
        <div className="border-t border-ink-950/8 bg-paper md:hidden">
          <Container>
            <ul className="flex flex-col divide-y divide-ink-950/8 py-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block py-3 text-base font-medium text-ink-700 transition-colors hover:text-ink-950',
                        isActive && 'text-ink-950',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      )}
    </header>
  )
}
