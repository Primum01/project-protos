import { Section } from '@/components/ui'

/**
 * Interactive Matterport 3D walkthrough preview embedded in a mock browser container.
 */
export function TourPreviewMockup() {
  return (
    <Section
      id="guest-experience"
      eyebrow="The guest experience"
      title="A 3D tour that feels like walking through the door"
      description="Guests orbit, pan, and zoom through every room, follow hotspots for details, and jump straight to booking, no account required."
      align="center"
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-ink-950/10 bg-ink-950 shadow-lifted">
        {/* Browser bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          </div>
          <span className="text-xs text-white/50">twinspace.app/tour/demo</span>
          <span className="w-12" />
        </div>

        {/* Embedded Matterport 3D viewer fitting 16:9 ratio container */}
        <div className="relative aspect-16/9 w-full bg-ink-950 min-h-[300px] sm:min-h-0">
          <iframe
            src="https://my.matterport.com/show/?m=13oTzmx56ar&play=1&qs=1&brand=0&title=0&tourcta=0&help=0&hl=0"
            title="Matterport 3D Tour"
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            loading="lazy"
          />
        </div>
      </div>
    </Section>
  )
}
