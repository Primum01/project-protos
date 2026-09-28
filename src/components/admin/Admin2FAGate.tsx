import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtpRequest, verifyOtpRequest } from '@/lib/auth2fa'
import { clearAdminStorage } from '@/lib/storage'
import { signOut } from '@/lib/firebase/auth'
import { useAuth } from '@/hooks/useAuth'

interface Admin2FAGateProps {
  onVerified: () => void
}

export function Admin2FAGate({ onVerified }: Admin2FAGateProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(45)
  const [timeLeft, setTimeLeft] = useState(5 * 60) // 5 minutes in seconds
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [expiresAt, setExpiresAt] = useState<number>(Date.now() + 5 * 60 * 1000)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // On mount: trigger the initial 6-digit code dispatch to team@twinspace360.com
  useEffect(() => {
    let isSubscribed = true

    async function dispatchInitialOtp() {
      if (!user) return
      setIsSending(true)
      try {
        const idToken = await user.getIdToken()
        const res = await sendOtpRequest(idToken)

        if (!isSubscribed) return

        if (res.success) {
          if (res.expiresAt) {
            setExpiresAt(res.expiresAt)
            setTimeLeft(Math.max(0, Math.floor((res.expiresAt - Date.now()) / 1000)))
          }
          setCooldown(res.cooldownSeconds || 45)
        } else {
          setError(res.error || 'Failed to dispatch verification code.')
          if (res.cooldownSeconds) {
            setCooldown(res.cooldownSeconds)
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setError(err.message || 'Network error requesting verification code.')
        }
      } finally {
        if (isSubscribed) {
          setIsSending(false)
        }
      }
    }

    dispatchInitialOtp()

    return () => {
      isSubscribed = false
    }
  }, [user])

  // Count down expiration timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  // Count down resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  // Focus the first digit box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
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
        if (res.expiresAt) {
          setExpiresAt(res.expiresAt)
          setTimeLeft(Math.max(0, Math.floor((res.expiresAt - Date.now()) / 1000)))
        }
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f5f3ef] px-4 py-12 overflow-hidden selection:bg-orange-500/20 selection:text-orange-900">
      {/* iOS Soft Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] rounded-full bg-gradient-to-tr from-amber-200/40 via-orange-200/30 to-amber-100/20 blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl opacity-60" />

      <div className="relative w-full max-w-[440px]">
        {/* Verification Card (Matches Reference Photo & iOS Aesthetics) */}
        <div className="relative rounded-[32px] border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">
          {/* iOS Style Close Button in Top Right */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Cancel and switch account"
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Reference Illustration: Envelope with Key & Password Pill */}
          <div className="text-center pt-2">
            <svg width="128" height="92" viewBox="0 0 128 92" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3" aria-hidden="true">
              {/* Soft Ground Shadow */}
              <ellipse cx="64" cy="85" rx="44" ry="5" fill="#000000" fillOpacity="0.06" />

              {/* Envelope Body Base */}
              <rect x="24" y="20" width="80" height="54" rx="10" fill="#F59E0B" />
              <path d="M24 28L64 56L104 28" stroke="#D97706" strokeWidth="2.5" strokeLinejoin="round" />
              
              {/* Envelope Top Flap */}
              <path d="M24 26C24 22.6863 26.6863 20 30 20H98C101.314 20 104 22.6863 104 26L64 54L24 26Z" fill="#FBBF24" />

              {/* Key Badge (Left) */}
              <g filter="drop-shadow(0px 3px 6px rgba(234, 88, 12, 0.35))">
                <circle cx="34" cy="46" r="13" fill="#EA580C" />
                <circle cx="34" cy="46" r="5" fill="#FFF7ED" />
                <rect x="32" y="55" width="4.5" height="15" rx="2" fill="#EA580C" />
                <rect x="36.5" y="61" width="5" height="3" rx="1.5" fill="#EA580C" />
                <rect x="36.5" y="66" width="4" height="2.5" rx="1.2" fill="#EA580C" />
              </g>

              {/* Password Pill (Right) */}
              <g filter="drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.12))">
                <rect x="66" y="50" width="46" height="20" rx="6" fill="#FFFFFF" />
                <circle cx="74" cy="60" r="2.2" fill="#1E293B" />
                <circle cx="81" cy="60" r="2.2" fill="#1E293B" />
                <circle cx="88" cy="60" r="2.2" fill="#1E293B" />
                <circle cx="95" cy="60" r="2.2" fill="#1E293B" />
                <circle cx="102" cy="60" r="2.2" fill="#1E293B" />
              </g>
            </svg>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Verify Your Email Address
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-[320px] mx-auto">
              We've dispatched a 6-digit security code to{' '}
              <strong className="text-slate-800 font-medium">team@twinspace360.com</strong>. Enter it below to proceed.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
            {/* 6 Digit Input Boxes (Matches Reference Photo style) */}
            <div>
              <label className="sr-only">6-Digit Verification Code</label>
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {digits.map((digit, idx) => {
                  const isFilled = Boolean(digit)
                  return (
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
                      className={`h-14 w-11 sm:h-16 sm:w-13 rounded-2xl border text-center font-bold text-2xl text-slate-900 shadow-xs transition-all duration-150 focus:outline-none disabled:opacity-50 ${
                        isFilled
                          ? 'border-slate-300 bg-white'
                          : 'border-slate-200/80 bg-slate-100/90'
                      } focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-700 text-center font-medium animate-shake">
                {error}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="mt-0.5 text-[11px] text-red-600 font-normal">
                    {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before temporary lockout.
                  </p>
                )}
              </div>
            )}

            {/* Change Email / Sign Out helper row */}
            <div className="text-center text-xs text-slate-500">
              <span>Want to Change Your Email Address? </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-semibold text-slate-700 hover:text-amber-600 underline underline-offset-2 transition-colors"
              >
                Change Here
              </button>
            </div>

            {/* iOS Pill Primary Button (Matching Reference Photo) */}
            <button
              type="submit"
              disabled={isVerifying || digits.join('').length !== 6 || timeLeft === 0}
              className="w-full h-12 sm:h-13 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 font-semibold text-sm sm:text-base text-white shadow-md shadow-orange-500/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend Code Link & Expiration Timer */}
            <div className="pt-1 flex flex-col items-center gap-1.5 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isSending}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:text-slate-400 transition-colors"
              >
                {isSending
                  ? 'Sending fresh code...'
                  : cooldown > 0
                    ? `Resend Code (${cooldown}s)`
                    : 'Resend Code'}
              </button>

              <div className="text-[11px] text-slate-400">
                {timeLeft > 0 ? (
                  <span>Code expires in <strong className="font-mono text-slate-600">{formatTime(timeLeft)}</strong></span>
                ) : (
                  <span className="text-red-500 font-semibold">Code has expired</span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
