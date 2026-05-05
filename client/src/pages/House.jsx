import { useState } from 'react'
import SegmentedControl from '../components/form/SegmentedControl'
import PageHeader from '../components/ui/PageHeader'
import { pluralize } from '../utils/pluralize'

const VIEW_OPTIONS = [
  { value: 'rooms', label: 'Rooms', icon: '⊞' },
  { value: 'list', label: 'List', icon: '☰' },
  { value: 'habitat', label: 'Habitat', icon: '🏠', disabled: true, phase: 'P3' },
]

export default function House() {
  const [view, setView] = useState('rooms')

  // Wired in R3a step 2 — derived from useSpaces() + usePlants().
  const totalSpaces = 0
  const totalPlants = 0
  const overdueCount = 0

  const meta =
    totalSpaces > 0
      ? [
          pluralize(totalPlants, 'plant'),
          pluralize(totalSpaces, 'space'),
          overdueCount > 0 && `${overdueCount} ${overdueCount === 1 ? 'needs' : 'need'} attention`,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-5 lg:gap-7 px-3 lg:px-6 py-4 lg:py-6">
      <PageHeader
        eyebrow="Your greenhouse"
        meta={meta}
        actions={
          <SegmentedControl
            label="View as"
            labelHidden
            value={view}
            onChange={setView}
            options={VIEW_OPTIONS}
          />
        }
      >
        Browse your <em className="text-emerald">plants</em>
      </PageHeader>

      <main className="flex-1 min-h-0">
        {view === 'rooms' && (
          <div className="flex-1 flex items-center justify-center min-h-[200px] text-sm text-ink-soft">
            Rooms grid lands in step 2.
          </div>
        )}
        {view === 'list' && (
          <div className="flex-1 flex items-center justify-center min-h-[200px] text-sm text-ink-soft">
            List view ships in TICKET-039b (R3b).
          </div>
        )}
      </main>
    </div>
  )
}
