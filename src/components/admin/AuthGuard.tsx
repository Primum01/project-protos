import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { SkeletonAdminShell } from '@/components/skeleton'

/**
 * Wraps admin routes. Only sessions recognized as admin (team@twinspace360.com)
 * are permitted to access admin features.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <SkeletonAdminShell />

  // No user or not recognized as admin → gate behind login
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}

