import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { ValidationError } from '../../errors/ValidationError'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import OptionCard from '../form/OptionCard'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

// Unmapped icon keys fall through to undefined, which OptionCard treats
// as "no tile" — a safer default than crashing if the backend adds a new
// icon before we ship the matching glyph.
const ROOM_ICONS = {
  couch: faCouch,
  kitchen: faUtensils,
  bed: faBed,
  bath: faBath,
  desk: faBriefcase,
}

function useRoomPresets() {
  return useQuery({
    queryKey: ['rooms', 'presets'],
    queryFn: () => apiGet('/api/v1/rooms/presets'),
  })
}

export default function Step2Rooms({ initialRooms = [], onBack, onComplete }) {
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
      // Deselected rooms are DELETEd from the server, not just dropped from
      // state. Any attached plants cascade-destroy via `has_many :plants,
      // dependent: :destroy`.
      const existingByName = new Map(initialRooms.map((r) => [r.name, r]))
      const selectedNames = new Set(selectedRooms)
      const toDelete = initialRooms.filter((r) => !selectedNames.has(r.name))

      try {
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
      } catch (err) {
        // No room-name input is bound to fieldErrors here (preset toggles
        // + raw custom input), so ValidationErrors get rethrown as plain
        // Errors so useFormSubmit surfaces them via the toast path.
        if (err instanceof ValidationError) throw new Error(err.message)
        throw err
      }
    },
    errorMessage: 'Could not save rooms',
  })

  const customRooms = selectedRooms.filter((r) => !presets.find((p) => p.name === r))

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <CardBody>
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
      </CardBody>

      <CardFooter className="border-t-0 flex gap-2.5">
        <Action variant="secondary" onClick={onBack}>
          Back
        </Action>
        <Action type="submit" variant="primary" disabled={selectedRooms.length === 0 || submitting} className="flex-1">
          {submitting ? 'Creating rooms...' : 'Continue'}
        </Action>
      </CardFooter>
    </form>
  )
}
