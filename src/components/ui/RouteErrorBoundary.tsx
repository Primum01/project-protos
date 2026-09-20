import { useRouteError, isRouteErrorResponse, useNavigate, useLocation } from 'react-router-dom'
import { Button } from './Button'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const location = useLocation()

  let errorMessage = 'An unexpected error occurred while loading this page.'

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || `${error.status} ${error.statusText}`
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-ink-950/10 bg-paper p-8 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600 ring-1 ring-amber-500/20">
          ⚠️
        </div>

        <h2 className="mt-5 text-xl font-semibold text-ink-950">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          We encountered an unexpected issue while rendering this view.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg bg-ink-50 p-3 text-left border border-ink-950/8">
          <p className="font-mono text-xs text-ink-700 break-words line-clamp-3">
            {errorMessage}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>

          {isAdmin ? (
            <Button
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              Back to Dashboard
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
