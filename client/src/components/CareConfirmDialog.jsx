import { useEffect, useState } from 'react'
import { getConfirmQuote } from '../personality/confirmQuotes'
import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'
import Dialog from './ui/Dialog'

const CARE_LABELS = {
  watering: { verb: 'Water', noun: 'watering' },
  feeding: { verb: 'Feed', noun: 'feeding' },
}

export default function CareConfirmDialog({ open, onClose, onConfirm, plant, careType, submitting = false }) {
  const labels = CARE_LABELS[careType] ?? CARE_LABELS.watering
  const personality = plant?.species?.personality
  const [quote, setQuote] = useState('')

  // Picks a fresh quote each time the dialog opens so repeated confirmations
  // cycle through the personality pool instead of showing the same line.
  useEffect(() => {
    if (open) setQuote(getConfirmQuote(personality))
  }, [open, personality])

  if (!plant) return null

  return (
    <Dialog open={open} onClose={onClose} title={`${labels.verb} ${plant.nickname}?`}>
      <div className="flex flex-col items-center text-center p-6 gap-4">
        <PlantAvatar species={plant.species} size="xl" shape="circle" />

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald">{plant.nickname}</p>
          <p className="mt-2 font-display text-xl italic font-medium text-forest leading-snug">{quote}</p>
        </div>
      </div>

      <div className="flex gap-2.5 p-4 border-t border-mint">
        <Action variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Action>
        <Action variant="primary" onClick={onConfirm} disabled={submitting} className="flex-1">
          {submitting ? `${labels.verb}ing...` : `${labels.verb} ${plant.nickname}`}
        </Action>
      </div>
    </Dialog>
  )
}
