export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-ink-950 pb-20 pt-28 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/90 via-ink-900/60 to-ink-950" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          role="presentation"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e3dcc9" />
              <stop offset="100%" stopColor="#b08d57" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#wire)" strokeWidth="1.2">
            <path d="M100 650 L100 350 L400 200 L700 350 L700 650" />
            <path d="M100 350 L400 500 L700 350" />
            <path d="M400 200 L400 500" />
            <path d="M400 500 L400 650" />
            <rect x="180" y="420" width="90" height="110" />
            <rect x="500" y="420" width="90" height="110" />
            <path d="M760 700 L760 300 L1000 180 L1180 300 L1180 700" />
            <path d="M760 300 L1180 300" />
            <path d="M970 700 L970 480 L1030 480 L1030 700" />
          </g>
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6 text-center">
        <p className="mb-4 sm:mb-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          3D property tours for hosts &amp; property managers
        </p>
        <h1 className="text-3xl font-medium leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Experience properties
          <br />
          before you arrive
        </h1>
        <p className="mx-auto mt-5 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-white/75">
          Turn any listing into an interactive 3D tour guests can explore from anywhere,
          then send them straight to booking.
        </p>
      </div>
    </section>
  )
}
