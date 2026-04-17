import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { ValidationError } from '../../errors/ValidationError'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { useCreateRoom, useDeleteRoom, useRoomPresets } from '../../hooks/useRooms'
import { getRoomIcon } from '../../utils/roomIcons'
import OptionCard from '../form/OptionCard'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

export default function Step2Rooms({ initialRooms = [], onBack, onComplete }) {
  const [selectedRooms, setSelectedRooms] = useState(() => initialRooms.map((r) => r.name))
  const [customRoom, setCustomRoom] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)
  const toast = useToast()
  const inputRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const { data: presets = [], error: presetsError, isSuccess: presetsLoaded } = useRoomPresets()
  const createRoom = useCreateRoom()
  const deleteRoom = useDeleteRoom()

  useEffect(() => {
    if (presetsError) toast.error(presetsError.message)
  }, [presetsError, toast])

  // Focus moves in via the motion div's onAnimationStart (below) rather
  // than a useEffect on `addingCustom`: AnimatePresence mode="wait"
  // delays the input's mount until the trigger finishes exiting, so the
  // effect fires before the DOM node exists. onAnimationStart fires
  // after mount, which is the right moment to grab focus.

  function toggleRoom(roomName) {
    setSelectedRooms((prev) => (prev.includes(roomName) ? prev.filter((r) => r !== roomName) : [...prev, roomName]))
  }

  function addCustomRoom() {
    const trimmed = customRoom.trim()
    if (trimmed && !selectedRooms.includes(trimmed)) {
      setSelectedRooms((prev) => [...prev, trimmed])
    }
    setCustomRoom('')
    setAddingCustom(false)
  }

  function cancelAdding() {
    setCustomRoom('')
    setAddingCustom(false)
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
              return createRoom.mutateAsync({ name: roomName, icon: preset?.icon || null })
            }),
          ),
          Promise.all(toDelete.map((room) => deleteRoom.mutateAsync(room.id))),
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

  // Gate on presetsLoaded: before the presets query resolves, `presets`
  // is the default `[]`, which would misclassify a preset-named room
  // (e.g. "Living Room" hydrated from initialRooms) as custom. With the
  // custom-chip AnimatePresence, that transient misclassification
  // created a ghost chip that lingered during its exit animation next
  // to the preset card once it finally rendered — two "Living Room"s
  // on screen for ~250ms.
  const customRooms = presetsLoaded ? selectedRooms.filter((r) => !presets.find((p) => p.name === r)) : []

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      {/* flex-col CardBody so the title/subtitle can stay pinned while
          only the rooms area scrolls — mirrors Step 3's pattern where
          the species search results scroll but the step heading doesn't. */}
      <CardBody className="flex flex-col">
        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
          Where do your plants <em className="not-italic text-leaf">live</em>?
        </h1>
        <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
          Pick every room that has plants. You can add more later.
        </p>

        <div className="mt-5 flex-1 min-h-0 overflow-y-auto space-y-2">
          {presets.map((room) => (
            <OptionCard
              key={room.name}
              icon={getRoomIcon(room.icon)}
              selected={selectedRooms.includes(room.name)}
              onClick={() => toggleRoom(room.name)}
            >
              {room.name}
            </OptionCard>
          ))}

          {/* Custom rooms animate in and out. A fresh chip expands from
              height 0 + fade, pushing the trigger/input row below it
              down into place; removing a chip (toggle off) collapses it
              in reverse. `initial={false}` so already-persisted custom
              rooms don't play the entrance animation on first render. */}
          <AnimatePresence initial={false}>
            {customRooms.map((room) => (
              <motion.div
                key={room}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.33, 1, 0.68, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <OptionCard selected onClick={() => toggleRoom(room)}>
                  {room}
                </OptionCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Progressive-disclosure add-custom-room per mockup 07-onboarding-wizard.
              The button is the resting state; tapping it crossfades to the
              input panel, auto-focuses, then crossfades back on Add/Cancel.
              Motion is already a dep (Toast), so no bundle cost.

              Layout: trigger and input rows both render inside a fixed
              50px container via absolute positioning. Earlier versions
              used a height 0 ↔ auto animation which collapsed the
              container mid-transition, clamping CardBody's scrollTop and
              snapping a scrolled-to-bottom user back to the top of the
              list. Locking the height and crossfading opacity keeps the
              scroll position stable through every Add/Cancel cycle. */}
          <div className="relative h-[50px]">
            <AnimatePresence initial={false} mode="wait">
              {addingCustom ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: 'easeOut' }}
                  onAnimationStart={() => inputRef.current?.focus()}
                  className="absolute inset-0"
                >
                  {/* Two icon buttons instead of text "Add" / "Cancel" — the
                      primary CTA shadow reads as clunky inline, and a green-
                      check / mint-X pair matches the TaskRow check-circle
                      language used elsewhere. Keyboard users still get Enter
                      / Escape shortcuts on the input itself. */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={customRoom}
                      onChange={(e) => setCustomRoom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomRoom()
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelAdding()
                        }
                      }}
                      aria-label="New room name"
                      className="flex-1 px-4 py-3 rounded-md bg-card border border-dashed border-ink-soft/30 text-ink text-base outline-none focus:border-leaf"
                      placeholder="Room name"
                    />
                    <Action
                      variant="unstyled"
                      onClick={addCustomRoom}
                      disabled={!customRoom.trim()}
                      aria-label="Add room"
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        customRoom.trim() ? 'bg-leaf text-card hover:bg-emerald' : 'bg-mint text-ink-soft/50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-sm" />
                    </Action>
                    <Action
                      variant="unstyled"
                      onClick={cancelAdding}
                      aria-label="Cancel adding room"
                      className="shrink-0 w-10 h-10 rounded-full border border-mint text-ink-soft hover:border-coral/60 hover:text-coral-deep flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </Action>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.15, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <Action
                    variant="unstyled"
                    onClick={() => setAddingCustom(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 border-dashed border-mint text-ink-soft hover:text-leaf hover:border-leaf/50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    <span className="text-sm font-bold">Add a custom room</span>
                  </Action>
                </motion.div>
              )}
            </AnimatePresence>
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
