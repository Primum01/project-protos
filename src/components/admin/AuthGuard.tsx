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
 * Wraps admin routes. Always redirects unauthenticated users to /admin/login.
 * If Firebase is not configured the login page will surface a warning —
 * but we never bypass auth and expose the admin UI publicly.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />

  // No user (or Firebase not configured) → always gate behind login
  if (!user) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
