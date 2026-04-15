import { useState } from 'react'
import { apiPost } from '../../api/client'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import SegmentedControl from '../form/SegmentedControl'
import Action from '../ui/Action'

const ENVIRONMENT_FIELDS = [
  { key: 'light_level', label: 'Light', options: ['low', 'medium', 'bright'] },
  { key: 'temperature_level', label: 'Temperature', options: ['cool', 'average', 'warm'] },
  { key: 'humidity_level', label: 'Humidity', options: ['dry', 'average', 'humid'] },
]

const DEFAULT_ENVIRONMENT = {
  light_level: 'medium',
  temperature_level: 'average',
  humidity_level: 'average',
}

export default function Step4Environment({ species, nickname, roomId, onComplete }) {
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm">
      <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">{"How's the environment?"}</h2>
      <p className="text-sm text-ink-soft mb-6">{"This helps us calculate your plant's care schedule."}</p>

      {ENVIRONMENT_FIELDS.map(({ key, label, options }) => (
        <SegmentedControl
          key={key}
          label={label}
          value={environment[key]}
          onChange={(next) => setEnvironment((prev) => ({ ...prev, [key]: next }))}
          options={options}
        />
      ))}

      <p className="text-xs text-ink-soft mb-6">Not sure? You can update anytime.</p>

      <Action type="submit" variant="primary" disabled={submitting} className="w-full">
        {submitting ? 'Adding plant...' : 'Continue'}
      </Action>
    </form>
  )
}
