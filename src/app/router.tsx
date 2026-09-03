import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { SessionProvider } from '@/contexts/SessionContext'

// ── Lazy-loaded pages (each becomes its own JS chunk) ──────────────────────
const NotFound        = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })))
const About           = lazy(() => import('@/pages/marketing/About').then(m => ({ default: m.About })))
const Contact         = lazy(() => import('@/pages/marketing/Contact').then(m => ({ default: m.Contact })))
const Home            = lazy(() => import('@/pages/marketing/Home').then(m => ({ default: m.Home })))
const ListingDetail   = lazy(() => import('@/pages/marketing/ListingDetail').then(m => ({ default: m.ListingDetail })))
const Pricing         = lazy(() => import('@/pages/marketing/Pricing').then(m => ({ default: m.Pricing })))
const TourDetail      = lazy(() => import('@/pages/marketing/TourDetail').then(m => ({ default: m.TourDetail })))
const Tours           = lazy(() => import('@/pages/marketing/Tours').then(m => ({ default: m.Tours })))
const AdminDashboard  = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminListingForm = lazy(() => import('@/pages/admin/AdminListingForm').then(m => ({ default: m.AdminListingForm })))
const AdminListings   = lazy(() => import('@/pages/admin/AdminListings').then(m => ({ default: m.AdminListings })))
const AdminLogin      = lazy(() => import('@/pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })))
const AdminMessages   = lazy(() => import('@/pages/admin/AdminMessages').then(m => ({ default: m.AdminMessages })))
const AdminSorting    = lazy(() => import('@/pages/admin/AdminSorting').then(m => ({ default: m.AdminSorting })))

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
  return (
    <Suspense fallback={<PageSpinner />}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
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
        element: (
          <AuthGuard>
            <SessionProvider>
              <AdminLayout />
            </SessionProvider>
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/listings" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'listings', element: <AdminListings /> },
          { path: 'listings/new', element: <AdminListingForm /> },
          { path: 'listings/:id', element: <AdminListingForm /> },
          { path: 'sorting', element: <AdminSorting /> },
          { path: 'messages', element: <AdminMessages /> },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])

