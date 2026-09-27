import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isAdminEmail, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { Button, Input, PasswordInput } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { usePageMeta } from '@/hooks/usePageMeta'

type Mode = 'sign_in' | 'sign_up'

export function AdminLogin() {
  const [searchParams] = useSearchParams()
  const isIdleTimeout = searchParams.get('reason') === 'idle_timeout'
  const [mode, setMode] = useState<Mode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    // Guard: only valid admin email is allowed
    if (!isAdminEmail(email)) {
      setError('Email not recognized or invalid credentials.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'sign_in') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
      }
      navigate('/admin/listings', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      // Make Firebase error messages human-readable
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

  async function handleGoogleSignIn() {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/admin/listings', { replace: true })
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed'
      if (msg.includes('popup-closed-by-user')) {
        setError('Sign-in cancelled.')
      } else if (msg.includes('Unauthorised') || msg.includes('invalid admin credentials')) {
        setError('Unauthorized: Google account does not match designated admin email.')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link to="/" className="font-display text-2xl font-medium text-ink-950 tracking-tight">
            TwinSpace
          </Link>
          <p className="mt-1.5 text-sm text-ink-500">Admin portal</p>
        </div>

        {/* Firebase warning */}
        {!isFirebaseConfigured && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Firebase not configured.</strong> Add your credentials to{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code>{' '}
            to enable authentication.
          </div>
        )}

        {/* Idle timeout notice */}
        {isIdleTimeout && (
          <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Session expired.</strong> Your admin session was automatically ended after 30 minutes of inactivity. Please sign in again.
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-ink-950/8 bg-paper p-8 shadow-lifted">
          <h1 className="text-xl font-semibold text-ink-950">
            {mode === 'sign_in' ? 'Sign in to your account' : 'Create admin account'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === 'sign_in'
              ? 'Enter your credentials to access the admin panel.'
              : 'Register the admin account for this portal.'}
          </p>

          {/* Google Sign In Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!isFirebaseConfigured || busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-950/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-xs transition hover:bg-ink-50 hover:border-ink-950/25 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-950/10" />
            <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider">or with email</span>
            <div className="h-px flex-1 bg-ink-950/10" />
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Input
                id="admin-email"
                type="email"
                label="Email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isFirebaseConfigured || busy}
              />
            </div>

            <PasswordInput
              id="admin-password"
              label="Password"
              autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!isFirebaseConfigured || busy}
            />
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-1 w-full"
              disabled={!isFirebaseConfigured || busy}
            >
              {busy ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError('') }}
            className="mt-5 block w-full text-center text-sm text-ink-500 transition-colors hover:text-ink-950"
          >
            {mode === 'sign_in'
              ? 'First time? Create an admin account →'
              : '← Back to sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
