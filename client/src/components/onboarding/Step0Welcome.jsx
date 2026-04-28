import Action from '../ui/Action'
import Card from '../ui/Card'
import Emphasis from '../ui/Emphasis'
import Heading from '../ui/Heading'
import Preheading from '../ui/Preheading'

const PORTRAIT_URL = '/onboarding/monstera.png'

export default function Step0Welcome({ onNext }) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 max-w-[1100px] w-full mx-auto py-6 lg:py-12"
    >
      <div className="text-center lg:text-left">
        <Preheading className="mb-4">Begin here</Preheading>

        <Heading id="welcome-heading" variant="display-xl" className="text-ink mb-5">
          Say hello to <Emphasis className="block">your greenhouse.</Emphasis>
        </Heading>

        <p className="text-sm leading-relaxed text-ink-soft max-w-[400px] mx-auto lg:mx-0 mb-5">
          <span className="step0-dropcap">A</span>
          place for every plant you've met. Water, feed, notice. Watch them grow. Write a little. Forget sometimes —
          it's allowed.
        </p>

        <div className="flex items-center justify-center lg:justify-start gap-4 mt-4 flex-wrap">
          <Action variant="primary" onClick={onNext}>
            Let's meet them →
          </Action>
          <span className="font-display italic text-[13px] text-ink-soft">takes about two minutes</span>
        </div>
      </div>

      <figure className="relative w-[260px] h-[340px] lg:w-[360px] lg:h-[460px] mx-auto m-0">
        <Card variant="glass" className="absolute inset-0 p-1.5">
          <img src={PORTRAIT_URL} alt="" className="w-full h-full object-contain" />
        </Card>

        <figcaption className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-paper px-4 py-2 rounded-full shadow-warm-sm flex items-center gap-2 z-10">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-leaf" />
          <em className="font-display italic font-normal text-xs text-ink">Monstera deliciosa</em>
        </figcaption>
      </figure>
    </section>
  )
}
