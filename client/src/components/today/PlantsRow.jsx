import { useEffect, useRef, useState } from 'react'
import PlantActionWheel from '../plants/ActionWheel'
import PlantAvatar from '../plants/Avatar'
import Action from '../ui/Action'
import Card from '../ui/Card'
import Heading from '../ui/Heading'

// Direct port of the v2 mockup `.plant-card` (docs/mockups/plantcare-ui/v2/17-today-density-v1.html).
// Tile = paper-cream surface with warm shadow; portrait = round
// gradient-paper cradle with a soft top-left highlight; mood dot is
// a small white pill with a coloured icon top-right; coral inset
// shadow on the portrait for urgent plants.

function plantStatus(plant) {
  const states = [plant.water_status, plant.feed_status]
  if (states.includes('overdue')) return 'wilting'
  if (states.includes('due_today') || states.includes('due_soon')) return 'thirsty'
  return 'thriving'
}

const MOOD_ICON = {
  thriving: { glyph: '✓', className: 'text-leaf' },
  thirsty: { glyph: '💧', className: 'text-sunshine-deep' },
  wilting: { glyph: '!', className: 'text-coral shadow-[0_0_0_2px_rgba(255,107,61,0.22)]' },
}

const MOOD_LABEL = {
  thriving: 'thriving',
  thirsty: 'needs water',
  wilting: 'wilting',
}

const HEADER_ICON = (
  <span
    aria-hidden="true"
    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] bg-mint text-emerald"
  >
    🪴
  </span>
)

export default function PlantsRow({ plants = [], spacesCount = 0 }) {
  if (plants.length === 0) return null

  const plantWord = plants.length === 1 ? 'plant' : 'plants'
  const spaceLabel = spacesCount > 0 ? ` · ${spacesCount} ${spacesCount === 1 ? 'space' : 'spaces'}` : ''

  return (
    <Card variant="paper-warm" className="px-4 pt-4 gap-2">
      <Card.Header divider={false} className="flex items-center justify-between">
        <Heading as="h2" variant="panel" className="text-ink flex items-center gap-2">
          {HEADER_ICON}
          What you've got
        </Heading>
        <Action
          to="/house"
          variant="unstyled"
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] text-emerald"
        >
          See all →
        </Action>
      </Card.Header>
      <Card.Body className="!overflow-visible !flex-none flex flex-col gap-3">
        <Card.Meta count={plants.length} className="block">
          {plantWord}
          {spaceLabel}
        </Card.Meta>
        <div className="-mx-4 px-4 pb-4 overflow-x-auto">
          <ul className="flex gap-3">
            <li className="shrink-0">
              <AddPlantTile />
            </li>
            {plants.map((plant) => (
              <li key={plant.id} className="shrink-0">
                <PlantTile plant={plant} />
              </li>
            ))}
          </ul>
        </div>
      </Card.Body>
    </Card>
  )
}

function PlantTile({ plant }) {
  const mood = plantStatus(plant)
  const moodIcon = MOOD_ICON[mood]
  const isUrgent = mood === 'wilting'
  const [wheelOpen, setWheelOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const portraitRef = useRef(null)
  const prevMoodRef = useRef(mood)

  // Trigger the celebrate pulse when the plant transitions out of a
  // needs-care state (wilting/thirsty → thriving). Plants that were
  // already thriving don't pulse on every refetch.
  useEffect(() => {
    const prev = prevMoodRef.current
    prevMoodRef.current = mood
    if (mood === 'thriving' && (prev === 'wilting' || prev === 'thirsty')) {
      setCelebrate(true)
      const timer = setTimeout(() => setCelebrate(false), 720)
      return () => clearTimeout(timer)
    }
  }, [mood])

  const portrait = (
    <span
      ref={portraitRef}
      className={`relative mx-auto mb-2.5 w-[100px] h-[100px] rounded-full plant-portrait ${isUrgent ? 'plant-portrait-urgent' : ''} ${celebrate ? 'plant-portrait-celebrate' : ''} flex items-center justify-center`}
    >
      <span className="relative z-[2]">
        <PlantAvatar species={plant.species} size="2xl" shape="circle" />
      </span>
    </span>
  )

  return (
    <>
      <Action
        variant="unstyled"
        onClick={() => setWheelOpen(true)}
        aria-haspopup="menu"
        aria-expanded={wheelOpen}
        className="relative block w-40 px-3 pt-4 pb-3 rounded-md bg-paper shadow-warm-sm text-center"
        aria-label={`${plant.nickname} — ${MOOD_LABEL[mood]}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-paper flex items-center justify-center text-[10px] font-bold shadow-[0_2px_6px_rgba(80,56,18,0.12),0_0_0_1px_rgba(80,56,18,0.04)] ${moodIcon.className}`}
        >
          {moodIcon.glyph}
        </span>
        {portrait}
        <span className="block text-[13px] font-bold tracking-tight text-ink truncate">{plant.nickname}</span>
        {plant.species?.common_name ? (
          <span className="block font-display italic text-[11px] text-ink-soft truncate">
            {plant.species.common_name}
          </span>
        ) : null}
      </Action>

      <PlantActionWheel
        plant={plant}
        open={wheelOpen}
        onOpenChange={setWheelOpen}
        anchor={portraitRef.current}
        size="md"
        centreSlot={
          <span className="relative w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center">
            <PlantAvatar species={plant.species} size="2xl" shape="circle" />
          </span>
        }
      />
    </>
  )
}

// Direct port of mockup 21's `.room-card.add-space` — dashed-border CTA
// tile that drops in as the first cell of the plant strip. Same w-40
// width as PlantTile so it sits flush with the rest of the row.
function AddPlantTile() {
  return (
    <Action
      to="/add-plant"
      variant="unstyled"
      aria-label="Add plant"
      className="flex flex-col items-center justify-center gap-1.5 w-40 h-full px-3 py-4 rounded-md border-2 border-dashed border-emerald/30 bg-paper hover:border-leaf hover:bg-lime/10 transition-colors text-center"
    >
      <span
        aria-hidden="true"
        className="w-11 h-11 rounded-full bg-mint text-emerald flex items-center justify-center text-[22px] font-bold mb-1"
      >
        +
      </span>
      <span className="font-display italic text-[17px] text-emerald leading-none">Add a plant</span>
      <span className="text-[11px] font-semibold tracking-[0.04em] text-ink-softer">New roommate</span>
    </Action>
  )
}
