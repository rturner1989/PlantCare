import { faDroplet, faSun, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { apiPost } from '../../api/client'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import SegmentedControl from '../form/SegmentedControl'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

const ENVIRONMENT_FIELDS = [
  { key: 'light_level', label: 'Light', icon: faSun, options: ['low', 'medium', 'bright'] },
  {
    key: 'temperature_level',
    label: 'Temperature',
    icon: faTemperatureHalf,
    options: ['cool', 'average', 'warm'],
  },
  { key: 'humidity_level', label: 'Humidity', icon: faDroplet, options: ['dry', 'average', 'humid'] },
]

// Map the Species.light_requirement enum (coarser, covers "indirect",
// "direct", "full shade", "tolerates a range") onto the three-way
// light_level the user actually picks. Tolerant species default to
// "medium" — user gets a neutral starting point and can adjust if
// they know their spot skews bright or low.
const LIGHT_FROM_SPECIES = {
  bright_direct: 'bright',
  bright_indirect: 'bright',
  low: 'low',
  low_to_bright: 'medium',
  low_to_bright_indirect: 'medium',
}

const HUMIDITY_FROM_SPECIES = {
  high: 'humid',
  low: 'dry',
  average: 'average',
}

// Seed Step 4 with the species' own preferences so the common case
// (user picked a plant that roughly matches their home) is a single
// tap to continue. Unknown species values fall back to the neutral
// "medium / average / average" defaults. Temperature stays "average"
// regardless — Species.temperature_min/max are hardiness ranges
// (what the plant tolerates), not ideal-spot temperatures, so they
// don't map cleanly to the user's cool/average/warm scale.
export function environmentFromSpecies(species) {
  return {
    light_level: LIGHT_FROM_SPECIES[species?.light_requirement] ?? 'medium',
    temperature_level: 'average',
    humidity_level: HUMIDITY_FROM_SPECIES[species?.humidity_preference] ?? 'average',
  }
}

export default function Step4Environment({ species, nickname, roomId, onBack, onComplete }) {
  // Lazy initialiser so the species → environment mapping runs once on
  // mount, not on every render. Reading `species` through a prop so it
  // stays in sync if Step 3 gets a different selection and comes back.
  const [environment, setEnvironment] = useState(() => environmentFromSpecies(species))

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: async () => {
      await apiPost('/api/v1/plants', {
        plant: {
          species_id: species.id,
          room_id: roomId,
          nickname: nickname || species.common_name,
          ...environment,
        },
      })
      onComplete()
    },
    errorMessage: 'Could not add plant',
  })

  const plantLabel = nickname || species?.common_name || 'your plant'

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <CardBody>
        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
          {'Tell me about '}
          <em className="not-italic text-leaf">{plantLabel}&rsquo;s spot</em>.
        </h1>
        <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
          I&rsquo;ve picked what this plant usually likes — adjust if your spot&rsquo;s different.
        </p>

        <div className="mt-5">
          {ENVIRONMENT_FIELDS.map(({ key, label, icon, options }) => (
            <SegmentedControl
              key={key}
              label={label}
              icon={icon}
              value={environment[key]}
              onChange={(next) => setEnvironment((prev) => ({ ...prev, [key]: next }))}
              options={options}
            />
          ))}

          <p className="text-center text-xs text-ink-soft font-medium italic mt-2">
            Not sure? You can update these anytime.
          </p>
        </div>
      </CardBody>

      <CardFooter className="border-t-0 flex gap-2.5">
        <Action variant="secondary" onClick={onBack}>
          Back
        </Action>
        <Action type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Adding plant...' : 'Continue'}
        </Action>
      </CardFooter>
    </form>
  )
}
