import { AuthGuard } from './AuthGuard'
import { AdminLayout } from './AdminLayout'
import { SessionProvider } from '@/contexts/SessionContext'
import { AdminDataProvider } from '@/contexts/AdminDataContext'

/**
 * Isolated Admin Shell component.
 * Isolates Firebase Auth, Firestore Session management, and the AdminLayout
 * so that they are strictly loaded on-demand when visiting /admin routes,
 * keeping the public marketing bundle lightweight and fast.
 */
export function AdminAppShell() {
  return (
    <AuthGuard>
      <AdminDataProvider>
        <SessionProvider>
          <AdminLayout />
        </SessionProvider>
      </AdminDataProvider>
    </AuthGuard>
  )
}

export default AdminAppShell
