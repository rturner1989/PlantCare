import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import OptionCard from '../form/OptionCard'
import Action from '../ui/Action'

// Maps the Room::ICONS vocabulary (owned by the backend and returned by
// /api/v1/rooms/presets) to the FA icon we want to render in each
// OptionCard's tile. If the backend introduces a new icon key we haven't
// mapped yet the lookup returns undefined and OptionCard skips the tile.
const ROOM_ICONS = {
  couch: faCouch,
  kitchen: faUtensils,
  bed: faBed,
  bath: faBath,
  desk: faBriefcase,
}

// Presets are owned by the backend so the icon vocabulary stays in sync with
// Room::ICONS validation. See api/app/controllers/api/v1/rooms/presets_controller.rb.
function useRoomPresets() {
  return useQuery({
    queryKey: ['rooms', 'presets'],
    queryFn: () => apiGet('/api/v1/rooms/presets'),
  })
}

export default function Step2Rooms({ initialRooms = [], onBack, onComplete }) {
  // Pre-select anything the user has already created (returning via Back,
  // or resumed from a prior session). Lazy init from the prop so it's read
  // once on mount rather than re-derived each render.
  const [selectedRooms, setSelectedRooms] = useState(() => initialRooms.map((r) => r.name))
  const [customRoom, setCustomRoom] = useState('')
  const toast = useToast()

  const { data: presets = [], error: presetsError } = useRoomPresets()

  useEffect(() => {
    if (presetsError) toast.error(presetsError.message)
  }, [presetsError, toast])

  function toggleRoom(roomName) {
    setSelectedRooms((prev) => (prev.includes(roomName) ? prev.filter((r) => r !== roomName) : [...prev, roomName]))
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
      // Three categories to reconcile on submit:
      //   1. Names in selectedRooms that were in initialRooms → reuse as-is
      //      (no API call; the server already has them).
      //   2. Names in selectedRooms NOT in initialRooms → POST to create.
      //   3. initialRooms NOT in selectedRooms → user deselected them after
      //      an earlier save, so DELETE from the server. Any attached
      //      plants cascade-destroy via Room's `has_many :plants,
      //      dependent: :destroy` — fine at this stage because plants
      //      only enter the flow in Step 4.
      const existingByName = new Map(initialRooms.map((r) => [r.name, r]))
      const selectedNames = new Set(selectedRooms)
      const toDelete = initialRooms.filter((r) => !selectedNames.has(r.name))

      const [rooms] = await Promise.all([
        Promise.all(
          selectedRooms.map((roomName) => {
            if (existingByName.has(roomName)) return existingByName.get(roomName)
            const preset = presets.find((r) => r.name === roomName)
            return apiPost('/api/v1/rooms', {
              room: { name: roomName, icon: preset?.icon || null },
            })
          }),
        ),
        Promise.all(toDelete.map((room) => apiDelete(`/api/v1/rooms/${room.id}`))),
      ])

      onComplete(rooms)
    },
    errorMessage: 'Could not save rooms',
  })

  const customRooms = selectedRooms.filter((r) => !presets.find((p) => p.name === r))

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1">
      <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
        Where do your plants <em className="not-italic text-leaf">live</em>?
      </h1>
      <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
        Pick every room that has plants. You can add more later.
      </p>

      <div className="mt-5 space-y-2">
        {presets.map((room) => (
          <OptionCard
            key={room.name}
            icon={ROOM_ICONS[room.icon]}
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
            className="flex-1 px-4 py-3 rounded-md bg-card border border-dashed border-ink-soft/30 text-ink text-base outline-none focus:border-leaf"
            placeholder="Add custom room..."
          />
          {customRoom.trim() && (
            <Action variant="secondary" onClick={addCustomRoom}>
              Add
            </Action>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 flex gap-2.5">
        <Action variant="secondary" onClick={onBack}>
          Back
        </Action>
        <Action type="submit" variant="primary" disabled={selectedRooms.length === 0 || submitting} className="flex-1">
          {submitting ? 'Creating rooms...' : 'Continue'}
        </Action>
      </div>
    </form>
  )
}
