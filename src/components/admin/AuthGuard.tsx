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
 * Wraps admin routes. Only sessions recognized as admin (team@twinspace360.com)
 * are permitted to access admin features.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <Spinner />

  // No user or not recognized as admin → gate behind login
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}

