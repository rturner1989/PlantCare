import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import OptionCard from '../form/OptionCard'
import Action from '../ui/Action'

function useRoomPresets() {
  return useQuery({
    queryKey: ['rooms', 'presets'],
    queryFn: () => apiGet('/api/v1/rooms/presets'),
  })
}

export default function Step2Rooms({ onComplete }) {
  const [selectedRooms, setSelectedRooms] = useState([])
  const [customRoom, setCustomRoom] = useState('')

  const toast = useToast()
  const { data: presets = [], error: presetsError } = useRoomPresets()

  // Surface fetch failures through the same toast channel every other form
  // in the app uses. The effect watches the query's error field so a retry
  // that succeeds silently replaces a stale error toast.
  useEffect(() => {
    if (presetsError) toast.error(presetsError.message)
  }, [presetsError, toast])

  function toggleRoom(roomName) {
    setSelectedRooms((prev) => {
      if (prev.includes(roomName)) {
        return prev.filter((r) => r !== roomName)
      }
      return [...prev, roomName]
    })
  }

  function addCustomRoom() {
    const trimmed = customRoom.trim()
    if (trimmed && !selectedRooms.includes(trimmed)) {
      setSelectedRooms((prev) => [...prev, trimmed])
      setCustomRoom('')
    }
  }

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: async () => {
      // Room creations are independent — fire them in parallel with
      // Promise.all so the user isn't stuck waiting on sequential round
      // trips.
      const rooms = await Promise.all(
        selectedRooms.map((roomName) => {
          const preset = presets.find((r) => r.name === roomName)
          return apiPost('/api/v1/rooms', {
            room: { name: roomName, icon: preset?.icon || null },
          })
        }),
      )
      onComplete(rooms)
    },
    errorMessage: 'Could not create rooms',
  })

  const customRooms = selectedRooms.filter((r) => !presets.find((p) => p.name === r))

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm">
      <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">Where do your plants live?</h2>
      <p className="text-sm text-ink-soft mb-6">Pick the rooms in your home that have plants.</p>

      <div className="space-y-2 mb-4">
        {presets.map((room) => (
          <OptionCard
            key={room.name}
            selected={selectedRooms.includes(room.name)}
            onClick={() => toggleRoom(room.name)}
          >
            {room.name}
          </OptionCard>
        ))}

        {customRooms.map((room) => (
          <OptionCard key={room} selected onClick={() => toggleRoom(room)}>
            {room}
          </OptionCard>
        ))}

        <div className="flex gap-2">
          <input
            type="text"
            value={customRoom}
            onChange={(e) => setCustomRoom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomRoom()
              }
            }}
            className="flex-1 px-4 py-3 rounded-md bg-card border border-dashed border-ink-soft/30 text-ink text-sm outline-none focus:border-leaf"
            placeholder="Add custom room..."
          />
          {customRoom.trim() && (
            <Action variant="secondary" onClick={addCustomRoom}>
              Add
            </Action>
          )}
        </div>
      </div>

      <Action
        type="submit"
        variant="primary"
        disabled={selectedRooms.length === 0 || submitting}
        className="w-full mt-4"
      >
        {submitting ? 'Creating rooms...' : 'Continue'}
      </Action>
    </form>
  )
}
