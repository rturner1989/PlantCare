import { useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getPersonalityEmoji } from '../../personality/emoji'
import { getWelcomeQuote } from '../../personality/welcomeQuotes'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

// Decorative leaves that peek from the card corners as the user's collection
// grows. Count scales (0–4); emojis rotate so each corner feels distinct.
const CORNER_LEAVES = [
  { emoji: '🌿', className: '-top-2 -left-2 text-6xl opacity-25 -rotate-12' },
  { emoji: '🪴', className: '-top-3 -right-3 text-5xl opacity-20 rotate-12' },
  { emoji: '🌸', className: '-bottom-2 -left-3 text-5xl opacity-25 rotate-45' },
  { emoji: '🌲', className: '-bottom-3 -right-2 text-6xl opacity-20 -rotate-12' },
]

function CornerLeaves({ count }) {
  if (count <= 0) return null
  const visible = Math.min(count + 1, CORNER_LEAVES.length)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CORNER_LEAVES.slice(0, visible).map((leaf) => (
        <span key={leaf.emoji} className={`absolute ${leaf.className}`}>
          {leaf.emoji}
        </span>
      ))}
    </div>
  )
}

function AddedAvatar({ plant, size = 48 }) {
  const imageUrl = plant.species?.image_url
  const emoji = getPersonalityEmoji(plant.species?.personality)
  return (
    <div
      data-testid="added-avatar"
      className="rounded-full overflow-hidden border-2 border-card shadow-[var(--shadow-sm)] shrink-0 bg-mint flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  )
}

export default function Step5Done({ createdPlants = [], onAddAnother, onFinish, finishing = false }) {
  const { user } = useAuth()
  const latest = createdPlants.at(-1) ?? null
  const species = latest?.species ?? null
  const plantName = latest?.nickname || species?.common_name

  // Quote keys off the latest plant's personality so each "add another" shows
  // a fresh line. Generic pool kicks in when no plants exist (skip path).
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
      <CardBody className="relative">
        <CornerLeaves count={count} />

        <div className="relative">
          <div className="text-center py-3" aria-hidden="true">
            <div className="text-7xl">✨</div>
          </div>

          <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight mt-2">
            {headline}
          </h1>

          {count > 0 && (
            <div className="mt-5 flex justify-center -space-x-3">
              {createdPlants.map((plant) => (
                <AddedAvatar key={plant.id} plant={plant} />
              ))}
            </div>
          )}

          <div className="mt-5 p-4 rounded-lg text-white relative overflow-hidden bg-[image:var(--gradient-forest)]">
            <p className="text-[9px] font-extrabold text-lime uppercase tracking-wider mb-1.5">{eyebrow}</p>
            <p className="font-display text-base italic font-medium leading-snug pl-2.5 border-l-2 border-coral">
              {quote}
            </p>
          </div>
        </div>
      </CardBody>

      <CardFooter className="border-t-0 flex gap-2.5">
        {count >= 1 && onAddAnother && (
          <Action variant="secondary" onClick={onAddAnother} disabled={finishing}>
            Add another
          </Action>
        )}
        <Action variant="primary" onClick={onFinish} disabled={finishing} className="flex-1">
          {finishing ? 'Finishing up...' : 'Enter your jungle'}
        </Action>
      </CardFooter>
    </>
  )
}
