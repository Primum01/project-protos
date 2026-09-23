import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SessionProvider } from '@/contexts/SessionContext'
import { AdminDataProvider } from '@/contexts/AdminDataContext'

import { RouteErrorBoundary, ErrorBoundary } from '@/components/ui'

/**
 * Wraps dynamic component imports with controlled automatic retry on chunk loading failure.
 * When a chunk fails to fetch (e.g. after a deployment or intermittent network packet drop),
 * it triggers at most ONE automatic page reload to download the latest index.html and chunk hashes.
 * If the error persists after a reload, it throws to the ErrorBoundary to prevent infinite reload loops.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  chunkName: string,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const sessionKey = `ts_retry_${chunkName}`
    const hasRetried = sessionStorage.getItem(sessionKey)

    try {
      const module = await componentImport()
      // On successful import, clear the retry flag so future chunk loads can still retry
      sessionStorage.removeItem(sessionKey)
      return module
    } catch (error) {
      console.warn(`[lazyWithRetry] Failed to load chunk "${chunkName}":`, error)

      // Only attempt one controlled reload to avoid an infinite loop
      if (!hasRetried) {
        sessionStorage.setItem(sessionKey, 'true')
        window.location.reload()
        // Return a pending promise so React doesn't render an error state while reloading
        return new Promise<{ default: T }>(() => {})
      }

      // If already retried and failed again, clear the flag and bubble to the ErrorBoundary
      sessionStorage.removeItem(sessionKey)
      throw error
    }
  })
}

// ── Lazy-loaded pages with automatic single-recovery retry ───────────────────
const NotFound        = lazyWithRetry(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })), 'NotFound')
const About           = lazyWithRetry(() => import('@/pages/marketing/About').then(m => ({ default: m.About })), 'About')
const Contact         = lazyWithRetry(() => import('@/pages/marketing/Contact').then(m => ({ default: m.Contact })), 'Contact')
const Home            = lazyWithRetry(() => import('@/pages/marketing/Home').then(m => ({ default: m.Home })), 'Home')
const ListingDetail   = lazyWithRetry(() => import('@/pages/marketing/ListingDetail').then(m => ({ default: m.ListingDetail })), 'ListingDetail')
const Pricing         = lazyWithRetry(() => import('@/pages/marketing/Pricing').then(m => ({ default: m.Pricing })), 'Pricing')
const TourDetail      = lazyWithRetry(() => import('@/pages/marketing/TourDetail').then(m => ({ default: m.TourDetail })), 'TourDetail')
const Tours           = lazyWithRetry(() => import('@/pages/marketing/Tours').then(m => ({ default: m.Tours })), 'Tours')
const AdminDashboard  = lazyWithRetry(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })), 'AdminDashboard')
const AdminListingForm = lazyWithRetry(() => import('@/pages/admin/AdminListingForm').then(m => ({ default: m.AdminListingForm })), 'AdminListingForm')
const AdminListings   = lazyWithRetry(() => import('@/pages/admin/AdminListings').then(m => ({ default: m.AdminListings })), 'AdminListings')
const AdminLogin      = lazyWithRetry(() => import('@/pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })), 'AdminLogin')
const AdminMessages   = lazyWithRetry(() => import('@/pages/admin/AdminMessages').then(m => ({ default: m.AdminMessages })), 'AdminMessages')
const AdminSorting    = lazyWithRetry(() => import('@/pages/admin/AdminSorting').then(m => ({ default: m.AdminSorting })), 'AdminSorting')
const AdminShootPricing = lazyWithRetry(() => import('@/pages/admin/AdminShootPricing').then(m => ({ default: m.AdminShootPricing })), 'AdminShootPricing')
const AdminLogs       = lazyWithRetry(() => import('@/pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })), 'AdminLogs')
const AdminAnalytics  = lazyWithRetry(() => import('@/pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })), 'AdminAnalytics')
const AdminInvoice    = lazyWithRetry(() => import('@/pages/admin/AdminInvoice').then(m => ({ default: m.AdminInvoice })), 'AdminInvoice')
const AdminReceipt    = lazyWithRetry(() => import('@/pages/admin/AdminReceipt').then(m => ({ default: m.AdminReceipt })), 'AdminReceipt')

/** Minimal spinner shown while a lazy chunk is being fetched. */
function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  const isPublicMarketing = !pathname.startsWith('/admin')

  return (
    <ErrorBoundary key={pathname} layout={isPublicMarketing ? 'marketing' : 'contained'}>
      <Suspense fallback={<PageSpinner />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // ── Public marketing routes
      { path: '/', element: <Home /> },
      { path: '/pricing', element: <Pricing /> },
      { path: '/tours', element: <Tours /> },
      { path: '/tour/:slug', element: <TourDetail /> },
      { path: '/listing/:id', element: <ListingDetail /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },

      // ── Admin login (public)
      { path: '/admin/login', element: <AdminLogin /> },

      // ── Protected admin shell
      {
        path: '/admin',
        errorElement: <RouteErrorBoundary />,
        element: (
          <AuthGuard>
            <AdminDataProvider>
              <SessionProvider>
                <AdminLayout />
              </SessionProvider>
            </AdminDataProvider>
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/listings" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'analytics', element: <AdminAnalytics /> },
          { path: 'invoice', element: <AdminInvoice /> },
          { path: 'receipt', element: <AdminReceipt /> },
          { path: 'listings', element: <AdminListings /> },
          { path: 'listings/new', element: <AdminListingForm /> },
          { path: 'listings/:id', element: <AdminListingForm /> },
          { path: 'sorting', element: <AdminSorting /> },
          { path: 'messages', element: <AdminMessages /> },
          { path: 'pricing', element: <AdminShootPricing /> },
          { path: 'logs', element: <AdminLogs /> },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])

