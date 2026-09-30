import { Skeleton } from './Skeleton'

/**
 * SkeletonOtpCard
 *
 * Mimics the Admin2FAGate OTP input screen: same cream/off-white background
 * with ambient glows, centered card with envelope illustration, 6 digit boxes,
 * verify button, and resend link.
 *
 * Shown in AdminLayout while the /api/auth/session-check request is in-flight —
 * the user is authenticated but we don't yet know if 2FA has been completed.
 * This is contextually correct: the user will next see either the 2FA gate
 * or (if already verified) the admin shell skeleton.
 */
export function SkeletonOtpCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Checking verification status"
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#f5f3ef] px-4 py-12 overflow-hidden"
    >
      {/* iOS Soft Ambient Glows — matches Admin2FAGate */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] rounded-full bg-gradient-to-tr from-amber-200/40 via-orange-200/30 to-amber-100/20 blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl opacity-60" />

      <div className="relative w-full max-w-[440px]">
        {/* Card */}
        <div className="rounded-[32px] border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Close button placeholder */}
          <div className="absolute top-5 right-5">
            <Skeleton rounded="full" className="h-8 w-8" />
          </div>

          {/* Envelope illustration placeholder */}
          <div className="flex justify-center pt-2 mb-3">
            <Skeleton rounded="lg" className="h-[92px] w-[128px]" />
          </div>

          {/* Title + subtitle */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <Skeleton rounded="sm" className="h-7 w-52" />
            <Skeleton rounded="sm" className="h-3.5 w-64" />
            <Skeleton rounded="sm" className="h-3.5 w-56" />
          </div>

          {/* Six digit input boxes */}
          <div className="flex justify-center gap-2 sm:gap-2.5 mb-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} rounded="xl" className="h-14 w-11 sm:h-16" />
            ))}
          </div>

          {/* Verify button */}
          <Skeleton rounded="pill" className="h-12 w-full mb-4" />

          {/* Resend + timer */}
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton rounded="sm" className="h-3 w-24" />
            <Skeleton rounded="sm" className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
