import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { Button, Input, PasswordInput } from '@/components/ui'
import { usePageMeta } from '@/hooks/usePageMeta'

/** The only email address allowed to register an admin account. */
const ADMIN_EMAIL = 'team@twinspace360.com'

type Mode = 'sign_in' | 'sign_up'

export function AdminLogin() {
  const [mode, setMode] = useState<Mode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  usePageMeta({
    title: 'Admin Login — TwinSpace',
    description: 'TwinSpace admin portal login.',
    path: '/admin/login',
    noIndex: true,
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'sign_in') {
        await signInWithEmail(email, password)
      } else {
        // Guard: only the permitted admin email may register
        if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
          setError('Email not recognized.')
          setBusy(false)
          return
        }
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

        {/* Card */}
        <div className="rounded-2xl border border-ink-950/8 bg-paper p-8 shadow-lifted">
          <h1 className="text-xl font-semibold text-ink-950">
            {mode === 'sign_in' ? 'Sign in to your account' : 'Create admin account'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === 'sign_in'
              ? 'Enter your credentials to access the admin panel.'
              : 'Register the first admin account for this portal.'}
          </p>

          <form id="login-form" onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
              {/* Live warning: show as soon as user types a non-permitted email in sign-up mode */}
              {mode === 'sign_up' && email.length > 0 && email.trim().toLowerCase() !== ADMIN_EMAIL && (
                <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <span aria-hidden="true">⛔</span>
                  Email not recognized.
                </p>
              )}
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
