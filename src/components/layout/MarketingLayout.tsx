import type { ReactNode } from 'react'
import { Footer, NavBar } from '@/components/ui'

interface MarketingLayoutProps {
  children: ReactNode
  overlayNav?: boolean
}

export function MarketingLayout({ children, overlayNav = false }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar overlay={overlayNav} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
