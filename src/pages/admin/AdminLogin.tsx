import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isAdminEmail, signInWithEmail } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { usePageMeta } from '@/hooks/usePageMeta'
import { SkeletonLoginCard } from '@/components/skeleton'

export function AdminLogin() {
  const [searchParams] = useSearchParams()
  const isIdleTimeout = searchParams.get('reason') === 'idle_timeout'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()

  // Auto-redirect if already signed in with admin permissions
  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin/listings', { replace: true })
    }
  }, [user, isAdmin, loading, navigate])

  usePageMeta({
    title: 'Admin Login — TwinSpace',
    description: 'TwinSpace admin portal login.',
    path: '/admin/login',
    noIndex: true,
  })

  // Show login-card skeleton while Firebase auth initial state resolves
  if (loading) {
    return <SkeletonLoginCard />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // Guard: only valid admin email is allowed
    if (!isAdminEmail(email)) {
      setError('Email not recognized or invalid admin credentials.')
      return
    }

    setBusy(true)
    try {
      await signInWithEmail(email, password)
      navigate('/admin/listings', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setError('Incorrect email or password.')
      } else if (msg.includes('user-not-found')) {
        setError('No account found with that email.')
      } else if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f5f3ef] px-4 py-12 overflow-hidden selection:bg-orange-500/20 selection:text-orange-900">
      {/* iOS Soft Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] rounded-full bg-gradient-to-tr from-amber-200/40 via-orange-200/30 to-amber-100/20 blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl opacity-60" />

      <div className="relative w-full max-w-[420px]">
        {/* Firebase Config Notice */}
        {!isFirebaseConfigured && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-800 shadow-xs backdrop-blur-xs">
            <strong>Firebase not configured.</strong> Add credentials to{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-[11px]">.env.local</code>.
          </div>
        )}

        {/* Idle Timeout Notice */}
        {isIdleTimeout && (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-xs text-amber-900 shadow-xs backdrop-blur-xs">
            <strong>Session expired.</strong> Your session ended after 30 minutes of inactivity. Please sign in again.
          </div>
        )}

        {/* iOS-Style Modal Card */}
        <div className="rounded-[32px] border border-slate-200/90 bg-white p-8 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Official TwinSpace Logo (Black Text Version) */}
          <div className="mx-auto mb-6 flex justify-center">
            <Link to="/" title="TwinSpace Home" className="transition-transform active:scale-95">
              <img
                src="/twinspace-analytics-logo.png"
                alt="TwinSpace 360"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In to Admin
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
              Enter your administrator credentials to securely access system management.
            </p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">
                Admin Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Valid email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isFirebaseConfigured || busy}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/15 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isFirebaseConfigured || busy}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/15 disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 font-medium text-center animate-shake">
                {error}
              </div>
            )}

            {/* iOS Pill Primary Button */}
            <button
              type="submit"
              disabled={!isFirebaseConfigured || busy}
              className="mt-3 flex w-full h-12 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all hover:bg-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In to Admin</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
