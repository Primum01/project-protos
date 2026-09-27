import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/firebase/auth'
import { useAuth } from '@/hooks/useAuth'
import { sendOtpRequest, verifyOtpRequest } from '@/lib/auth2fa'
import { clearAdminStorage } from '@/lib/storage'
import { Button } from '@/components/ui'

interface Admin2FAGateProps {
  onVerified: () => void
}

export function Admin2FAGate({ onVerified }: Admin2FAGateProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string>('')
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [cooldown, setCooldown] = useState<number>(45)
  const [expiresAt, setExpiresAt] = useState<number>(Date.now() + 5 * 60 * 1000)
  const [timeLeft, setTimeLeft] = useState<number>(300)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-send OTP code on mount
  useEffect(() => {
    let isMounted = true

    async function initialSend() {
      if (!user) return
      setIsSending(true)
      try {
        const token = await user.getIdToken()
        const res = await sendOtpRequest(token)
        if (!isMounted) return

        if (res.success) {
          if (res.expiresAt) setExpiresAt(res.expiresAt)
          if (res.cooldownSeconds) setCooldown(res.cooldownSeconds)
        } else if (res.error) {
          setError(res.error)
          if (res.cooldownSeconds) setCooldown(res.cooldownSeconds)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to dispatch verification code.')
      } finally {
        if (isMounted) setIsSending(false)
      }
    }

    initialSend()

    return () => {
      isMounted = false
    }
  }, [user])

  // Countdown timer for code expiry
  useEffect(() => {
    const timer = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remainingSeconds)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Focus the first empty digit box
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => d === '')
    const targetIndex = firstEmptyIndex === -1 ? 5 : firstEmptyIndex
    inputRefs.current[targetIndex]?.focus()
  }, [])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Handle single digit changes
  function handleDigitChange(index: number, val: string) {
    setError('')
    const clean = val.replace(/\D/g, '')

    if (!clean) {
      const nextDigits = [...digits]
      nextDigits[index] = ''
      setDigits(nextDigits)
      return
    }

    const digit = clean.slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = digit
    setDigits(nextDigits)

    // Automatically advance to the next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else {
      // If last box entered, check if complete and trigger auto-submit
      const fullCode = nextDigits.join('')
      if (fullCode.length === 6) {
        submitCode(fullCode)
      }
    }
  }

  // Handle keyboard navigation (Backspace, arrows)
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle pasting full 6-digit code
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    setError('')
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasteData) return

    const nextDigits = [...digits]
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasteData[i] || ''
    }
    setDigits(nextDigits)

    if (pasteData.length === 6) {
      inputRefs.current[5]?.focus()
      submitCode(pasteData)
    } else {
      inputRefs.current[pasteData.length]?.focus()
    }
  }

  async function submitCode(codeToVerify: string) {
    if (!user) return
    setIsVerifying(true)
    setError('')

    try {
      const idToken = await user.getIdToken()
      const res = await verifyOtpRequest(codeToVerify, idToken)

      if (res.success) {
        onVerified()
      } else {
        setError(res.error || 'Verification failed. Please check the code and try again.')
        if (typeof res.remainingAttempts === 'number') {
          setRemainingAttempts(res.remainingAttempts)
        }
        // Clear digits on error so user can re-type easily
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during verification.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || isSending || !user) return
    setIsSending(true)
    setError('')
    setDigits(['', '', '', '', '', ''])

    try {
      const idToken = await user.getIdToken()
      const res = await sendOtpRequest(idToken)

      if (res.success) {
        if (res.expiresAt) setExpiresAt(res.expiresAt)
        setCooldown(res.cooldownSeconds || 45)
        inputRefs.current[0]?.focus()
      } else {
        setError(res.error || 'Failed to resend code.')
        if (res.cooldownSeconds) setCooldown(res.cooldownSeconds)
      }
    } catch (err: any) {
      setError(err.message || 'Network error resending code.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleSignOut() {
    clearAdminStorage()
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    const fullCode = digits.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }
    submitCode(fullCode)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <span className="font-display text-2xl font-medium tracking-tight text-white">
            TwinSpace
          </span>
          <p className="mt-1 text-xs text-ink-400">Admin Security Verification</p>
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-white/10 bg-paper p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink-950">
              Two-Factor Authentication
            </h1>
            <p className="mt-1.5 text-xs text-ink-600 leading-relaxed">
              We've dispatched a 6-digit verification code to{' '}
              <strong className="text-ink-900 font-mono">team@twinspace360.com</strong>.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
            {/* 6 Digit Input Boxes */}
            <div>
              <label className="sr-only">6-Digit Verification Code</label>
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying}
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-ink-950/20 bg-white text-center font-mono text-xl sm:text-2xl font-bold text-ink-950 shadow-xs transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-center font-medium animate-shake">
                {error}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-0.5 text-[11px] text-red-600 font-normal">
                    {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before lockout.
                  </p>
                )}
              </div>
            )}

            {/* Timer and Expiration Info */}
            <div className="flex items-center justify-between text-xs text-ink-500 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`inline-block h-2 w-2 rounded-full ${timeLeft > 60 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {timeLeft > 0 ? (
                  <span>Code expires in <strong className="font-mono text-ink-900">{formatTime(timeLeft)}</strong></span>
                ) : (
                  <span className="text-red-600 font-semibold">Code expired</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isSending}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-ink-400 transition"
              >
                {isSending
                  ? 'Sending...'
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend code'}
              </button>
            </div>

            {/* Verification Button */}
            <Button
              type="submit"
              disabled={isVerifying || digits.join('').length !== 6 || timeLeft === 0}
              className="w-full h-11 text-sm font-semibold shadow-soft"
            >
              {isVerifying ? 'Verifying Code...' : 'Verify & Continue'}
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 border-t border-ink-950/8 pt-4 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-ink-500 hover:text-ink-800 transition"
            >
              ← Sign out / Switch account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
