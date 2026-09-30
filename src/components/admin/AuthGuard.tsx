import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonLoginCard } from '@/components/skeleton'

/**
 * Wraps admin routes. Only sessions recognized as admin (team@twinspace360.com)
 * are permitted to access admin features.
 *
 * While Firebase auth is initializing (loading=true) we show a skeleton that
 * matches the login card — NOT the admin dashboard shell — since we don't yet
 * know whether this is a new visitor or an authenticated admin.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  // Show login-page-shaped skeleton while Firebase auth state resolves
  if (loading) return <SkeletonLoginCard />

  // No user or not recognized as admin → gate behind login
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
