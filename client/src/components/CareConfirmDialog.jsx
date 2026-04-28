import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { getConfirmQuote } from '../personality/confirmQuotes'
import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'
import Card from './ui/Card'
import Dialog from './ui/Dialog'

const CARE_LABELS = {
  watering: { verb: 'Water', noun: 'watering' },
  feeding: { verb: 'Feed', noun: 'feeding' },
}

export default function CareConfirmDialog({ open, onClose, onConfirm, plant, careType, submitting = false }) {
  const labels = CARE_LABELS[careType] ?? CARE_LABELS.watering
  const personality = plant?.species?.personality
  const [quote, setQuote] = useState('')

  useEffect(() => {
    if (open) setQuote(getConfirmQuote(personality))
  }, [open, personality])

  if (!plant) return null

  const headingText = `${labels.verb} ${plant.nickname}?`

  return (
    <Dialog open={open} onClose={onClose} title={headingText}>
      <Card.Header divider={false} className="flex items-center justify-between gap-3">
        <p className="text-lg font-extrabold text-ink">{headingText}</p>
        <Action
          variant="unstyled"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
        </Action>
      </Card.Header>

      <Card.Body className="flex flex-col items-center text-center gap-4">
        <PlantAvatar species={plant.species} size="xl" shape="circle" />

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald">{plant.nickname}</p>
          <p className="mt-2 font-display text-xl italic font-medium text-forest leading-snug">{quote}</p>
        </div>
      </Card.Body>

      <Card.Footer divider={false} className="flex gap-2.5">
        <Action variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Action>
        <Action variant="primary" onClick={onConfirm} disabled={submitting} className="flex-1">
          {submitting ? `${labels.verb}ing...` : `${labels.verb} ${plant.nickname}`}
        </Action>
      </Card.Footer>
    </Dialog>
  )
}
