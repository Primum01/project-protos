import { Section } from '@/components/ui'

const rooms = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Balcony']

/**
 * Illustrative mockup of the guest-facing 3D viewer UI (room selector,
 * hotspots, orbit control). Not a live 3D render: the real viewer ships in
 * a later increment. This exists to show visitors what the experience will
 * look like.
 */
export function TourPreviewMockup() {
  return (
    <Section
      eyebrow="The guest experience"
      title="A 3D tour that feels like walking through the door"
      description="Guests orbit, pan, and zoom through every room, follow hotspots for details, and jump straight to booking, no account required."
      align="center"
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-ink-950/10 bg-ink-950 shadow-lifted">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          </div>
          <span className="text-xs text-white/50">twinspace.app/tour/westlands-skyline-loft</span>
          <span className="w-12" />
        </div>

        <div className="relative aspect-16/9 w-full bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950">
          <svg
            className="absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 800 450"
            preserveAspectRatio="xMidYMid slice"
            role="presentation"
            aria-hidden="true"
          >
            <g fill="none" stroke="#e3dcc9" strokeWidth="1">
              <path d="M120 380 L120 180 L400 90 L680 180 L680 380" />
              <path d="M120 180 L400 270 L680 180" />
              <path d="M400 90 L400 270 L400 380" />
              <rect x="200" y="250" width="70" height="90" />
              <rect x="520" y="250" width="70" height="90" />
            </g>
          </svg>

          {/* hotspots */}
          <span className="absolute left-[27%] top-[62%] flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-white/90 shadow-lifted">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
          </span>
          <span className="absolute left-[68%] top-[58%] flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-white/90 shadow-lifted">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />
          </span>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
            {rooms.map((room, index) => (
              <span
                key={room}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium ' +
                  (index === 0 ? 'bg-white text-ink-950' : 'text-white/70')
                }
              >
                {room}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
