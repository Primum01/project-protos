import { Button } from '@/components/ui'
import { Container } from '@/components/ui'

export function FinalCTA() {
  return (
    <section className="bg-ink-950 py-24 text-white">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium leading-tight text-white lg:text-4xl">
            Give your listing the walkthrough it deserves
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Request a capture today and have a published 3D tour ready to share within days.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button href="/contact" size="lg">
              Get started
            </Button>
            <Button
              href="/pricing"
              size="lg"
              variant="secondary"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              View pricing
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
