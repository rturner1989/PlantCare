import { faDroplet, faSun, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { useCreatePlant } from '../../hooks/usePlants'
import SegmentedControl from '../form/SegmentedControl'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

const FIELD_META = [
  { key: 'light_level', label: 'Light', icon: faSun, optionsKey: 'light' },
  { key: 'temperature_level', label: 'Temperature', icon: faTemperatureHalf, optionsKey: 'temperature' },
  { key: 'humidity_level', label: 'Humidity', icon: faDroplet, optionsKey: 'humidity' },
]

export default function Step4Environment({ species, nickname, spaceId, onBack, onComplete }) {
  const [environment, setEnvironment] = useState(() => ({
    light_level: species.suggested_light_level,
    temperature_level: species.suggested_temperature_level,
    humidity_level: species.suggested_humidity_level,
  }))

  // useCreatePlant invalidates ['plants'] on success — Welcome.jsx reads that
  // same query for its createdPlants source, so Step 5 reflects the new plant
  // automatically + survives a page reload (server is source of truth).
  const createPlant = useCreatePlant()

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: async () => {
      await createPlant.mutateAsync({
        species_id: species.id,
        space_id: spaceId,
        nickname: nickname || species.common_name,
        ...environment,
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
          {FIELD_META.map(({ key, label, icon, optionsKey }) => (
            <SegmentedControl
              key={key}
              label={label}
              icon={icon}
              value={environment[key]}
              onChange={(next) => setEnvironment((prev) => ({ ...prev, [key]: next }))}
              options={species.plant_levels[optionsKey]}
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
