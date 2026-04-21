import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getWelcomeQuote } from '../../personality/welcomeQuotes'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

export default function Step5Done({ createdPlants = [], onAddAnother, onFinish, finishing = false }) {
  const { user } = useAuth()
  const latest = createdPlants.at(-1) ?? null
  const species = latest?.species ?? null
  const plantName = latest?.nickname || species?.common_name

  // Quote is keyed off the latest plant's personality so each "add another"
  // lands on a fresh line. With no latest plant (skip path), falls through
  // to the generic pool.
  const quote = useMemo(() => getWelcomeQuote(species?.personality), [species?.personality])

  const count = createdPlants.length
  const eyebrow = count === 0 ? 'Your jungle' : count === 1 ? plantName?.toUpperCase() : `Your jungle of ${count}`
  const headline =
    count >= 2 ? (
      <>
        Your <em className="not-italic text-leaf">jungle</em> is taking shape
        {user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
      </>
    ) : (
      <>
        You&rsquo;re <em className="not-italic text-leaf">all set</em>
        {user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
      </>
    )

  return (
    <>
      <CardBody>
        <div className="text-center py-3" aria-hidden="true">
          <div className="text-7xl">✨</div>
        </div>

        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight mt-2">
          {headline}
        </h1>

        <div className="mt-4 p-4 rounded-lg text-white relative overflow-hidden bg-[image:var(--gradient-forest)]">
          <p className="text-[9px] font-extrabold text-lime uppercase tracking-wider mb-1.5">{eyebrow}</p>
          <p className="font-display text-base italic font-medium leading-snug pl-2.5 border-l-2 border-coral">
            {quote}
          </p>
        </div>
      </CardBody>

      <CardFooter className="border-t-0 flex flex-col gap-2.5">
        <Action variant="primary" onClick={onFinish} disabled={finishing} className="w-full">
          {finishing ? 'Finishing up...' : 'Enter your jungle'}
        </Action>
        {count >= 1 && onAddAnother && (
          <Action variant="secondary" onClick={onAddAnother} disabled={finishing} className="w-full">
            Add another plant
          </Action>
        )}
      </CardFooter>
    </>
  )
}
