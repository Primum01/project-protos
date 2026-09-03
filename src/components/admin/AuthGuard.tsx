import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  )
}

/**
 * Wraps admin routes. Redirects unauthenticated users to /admin/login.
 * When Firebase is not yet configured, grants access with a dev-mode warning
 * shown in the AdminLayout sidebar so the UI is still explorable.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isConfigured } = useAuth()

  if (loading) return <Spinner />

  // Dev mode: Firebase not configured — allow through so the UI can be previewed
  if (!isConfigured) return <>{children}</>

  if (!user) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
