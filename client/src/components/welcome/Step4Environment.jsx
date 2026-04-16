import { faDroplet, faSun, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { apiPost } from '../../api/client'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import SegmentedControl from '../form/SegmentedControl'
import Action from '../ui/Action'

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

const DEFAULT_ENVIRONMENT = {
  light_level: 'medium',
  temperature_level: 'average',
  humidity_level: 'average',
}

export default function Step4Environment({ species, nickname, roomId, onBack, onComplete }) {
  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT)

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
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1">
      <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
        {'Tell me about '}
        <em className="not-italic text-leaf">{plantLabel}&rsquo;s spot</em>.
      </h1>
      <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
        {"I'll calculate the perfect care schedule based on the environment."}
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

      <div className="mt-auto pt-6 flex gap-2.5">
        <Action variant="secondary" onClick={onBack}>
          Back
        </Action>
        <Action type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Adding plant...' : 'Continue'}
        </Action>
      </div>
    </form>
  )
}
