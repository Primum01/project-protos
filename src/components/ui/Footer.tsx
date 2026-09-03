import { Link } from 'react-router-dom'
import { Container } from './Container'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Example tours', to: '/tours' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-ink-950/8 bg-paper pt-16 pb-10">
      <Container>
        <div className="grid grid-cols-2 gap-10 pb-12 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="font-display text-xl font-medium text-ink-950">
              TwinSpace
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              Interactive 3D tours that let guests experience a property before they arrive.
            </p>
            <p className="mt-4 flex items-start gap-1.5 text-sm text-ink-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              GTC Office Tower 14th Floor, Westlands
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink-950">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-500 transition-colors hover:text-ink-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-ink-950/8 pt-6 text-xs text-ink-300 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} TwinSpace. All rights reserved.</p>
          <p>Made for hosts, property managers, and hotels.</p>
        </div>
      </Container>
    </footer>
  )
}
