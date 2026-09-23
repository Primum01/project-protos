import { Component, type ErrorInfo, type ReactNode } from 'react'
import { MarketingLayout } from '@/components/layout/MarketingLayout'
import { Button } from './Button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  /**
   * When 'marketing', wraps the fallback inside MarketingLayout so the
   * top navigation bar and footer remain visible and interactive.
   */
  layout?: 'marketing' | 'contained' | 'none'
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo)
  }

  handleReset = () => {
    this.props.onReset?.()
    this.setState({ hasError: false, error: null })
  }

  renderFallbackContent() {
    const { error } = this.state
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('dynamically imported module') ||
      error?.name === 'ChunkLoadError'

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-ink-950/10 bg-paper p-8 shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600 ring-1 ring-amber-500/20">
            ⚠️
          </div>

          <h2 className="mt-5 text-xl font-semibold text-ink-950">
            {isChunkError ? 'Update available' : 'Something went wrong'}
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {isChunkError
              ? 'A newer version of this page is available. Please reload to view the updated content.'
              : 'We encountered an unexpected issue while rendering this section.'}
          </p>

          {error?.message && !isChunkError && (
            <div className="mt-4 overflow-hidden rounded-lg bg-ink-50 p-3 text-left border border-ink-950/8">
              <p className="font-mono text-xs text-ink-700 break-words line-clamp-3">
                {error.message}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
            >
              Try again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { window.location.href = '/' }}
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const content = this.renderFallbackContent()

      if (this.props.layout === 'marketing') {
        return (
          <MarketingLayout>
            <div className="h-20" />
            {content}
          </MarketingLayout>
        )
      }

      return content
    }

    return this.props.children
  }
}
