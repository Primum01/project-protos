import { Skeleton } from './Skeleton'

/**
 * SkeletonLoginCard
 *
 * Mimics the admin login page shape: cream/off-white background with ambient
 * glows, centered white card (max-w-[420px]) with logo, two input fields, button.
 *
 * Shown in AuthGuard while Firebase auth initializes, and in AdminLayout while
 * authLoading is true — before we know if the user is authenticated.
 */
export function SkeletonLoginCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading login"
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#f5f3ef] px-4 py-12 overflow-hidden"
    >
      {/* iOS Soft Ambient Glows — matches the real login page */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] rounded-full bg-gradient-to-tr from-amber-200/40 via-orange-200/30 to-amber-100/20 blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl opacity-60" />

      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-[32px] border border-slate-200/90 bg-white p-8 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Logo placeholder */}
          <div className="mx-auto mb-6 flex justify-center">
            <Skeleton rounded="md" className="h-10 w-36 sm:h-11" />
          </div>

          {/* Title + subtitle */}
          <div className="flex flex-col items-center gap-2 mb-7">
            <Skeleton rounded="sm" className="h-7 w-44" />
            <Skeleton rounded="sm" className="h-3.5 w-64" />
            <Skeleton rounded="sm" className="h-3.5 w-52" />
          </div>

          {/* Email field */}
          <div className="space-y-1.5 mb-4">
            <Skeleton rounded="sm" className="h-3 w-20" />
            <Skeleton rounded="xl" className="h-12 w-full" />
          </div>

          {/* Password field */}
          <div className="space-y-1.5 mb-6">
            <Skeleton rounded="sm" className="h-3 w-16" />
            <Skeleton rounded="xl" className="h-12 w-full" />
          </div>

          {/* Submit button */}
          <Skeleton rounded="pill" className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
