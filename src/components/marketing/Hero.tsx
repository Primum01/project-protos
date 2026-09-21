export function Hero() {
  function handleScrollDown() {
    const target = document.getElementById('guest-experience')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' })
    }
  }

  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-ink-950 pb-16 sm:pb-20 pt-28 text-white">
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

        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-2 sm:gap-2.5">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            A PRODUCT OF
          </span>
          <img
            src="/diaspace-logo.png"
            alt="DiaSpace — Building Possibilities, Bridging Distances"
            className="w-56 sm:w-72 md:w-80 max-w-[85vw] h-auto object-contain transition-opacity duration-300 hover:opacity-100"
          />
        </div>

        {/* ── Central 'Discover More' indicator ── */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <button
            type="button"
            onClick={handleScrollDown}
            aria-label="Discover More"
            className="group flex flex-col items-center gap-2 text-white/60 hover:text-white transition-all duration-300 focus:outline-none cursor-pointer"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 group-hover:text-white transition-colors duration-300">
              Discover More
            </span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 backdrop-blur-md shadow-sm transition-all duration-300 group-hover:border-white/50 group-hover:bg-white/10 group-hover:scale-105">
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce text-white/80 group-hover:text-white transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </section>
  )
}
