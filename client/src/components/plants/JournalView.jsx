import { useState } from 'react'
import FileTabs from '../ui/FileTabs'

const JOURNAL_TABS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'photos', label: 'Photos' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'schedule', label: 'Schedule' },
]

// Returning empty data lets each tab render its own empty state without
// blocking this page on the Journal region's data layer landing first.
function useJournalStub() {
  return { entries: [], isLoading: false }
}

export default function JournalView({ plant }) {
  const [tab, setTab] = useState('timeline')
  const { entries } = useJournalStub({ plant_id: plant.id })

  return (
    <FileTabs tabs={JOURNAL_TABS} activeId={tab} onChange={setTab} label={`Journal for ${plant.nickname}`}>
      <FileTabs.Panel className="!shadow-none">
        <p className="text-sm text-ink-soft italic">
          {entries.length === 0 ? `No ${tab} entries yet.` : `${entries.length} entries.`}
        </p>
      </FileTabs.Panel>
    </FileTabs>
  )
}
