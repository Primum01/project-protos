import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Button, Container } from '@/components/ui'

export function NotFound() {
  return (
    <MarketingLayout>
      <div className="h-20" />
      <Container className="py-32 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-ink-400">404</p>
        <h1 className="mt-3 text-3xl font-medium text-ink-950">Page not found</h1>
        <p className="mt-3 text-ink-500">The page you're looking for doesn't exist.</p>
        <Button href="/" className="mt-8">
          Back to home
        </Button>
      </Container>
    </MarketingLayout>
  )
}
