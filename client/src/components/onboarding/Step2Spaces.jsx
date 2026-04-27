import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { ValidationError } from '../../errors/ValidationError'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { useCreateSpace, useDeleteSpace, useSpacePresets } from '../../hooks/useSpaces'
import { getSpaceIcon } from '../../utils/spaceIcons'
import CheckboxCardInput from '../form/CheckboxCardInput'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

export default function Step2Spaces({ initialSpaces = [], onBack, onComplete }) {
  const [selectedSpaces, setSelectedSpaces] = useState(() => initialSpaces.map((s) => s.name))
  const [customSpace, setCustomSpace] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)
  const toast = useToast()
  const inputRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const { data: presets = [], error: presetsError, isSuccess: presetsLoaded } = useSpacePresets()
  const createSpace = useCreateSpace()
  const deleteSpace = useDeleteSpace()

  useEffect(() => {
    if (presetsError) toast.error(presetsError.message)
  }, [presetsError, toast])

  function toggleSpace(spaceName) {
    setSelectedSpaces((prev) => (prev.includes(spaceName) ? prev.filter((s) => s !== spaceName) : [...prev, spaceName]))
  }

  function addCustomSpace() {
    const trimmed = customSpace.trim()
    if (trimmed && !selectedSpaces.includes(trimmed)) {
      setSelectedSpaces((prev) => [...prev, trimmed])
    }
    setCustomSpace('')
    setAddingCustom(false)
  }

  function cancelAdding() {
    setCustomSpace('')
    setAddingCustom(false)
  }

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: async () => {
      // Deselected spaces are DELETEd from the server; attached plants
      // cascade-destroy via Rails' dependent: :destroy.
      const existingByName = new Map(initialSpaces.map((s) => [s.name, s]))
      const selectedNames = new Set(selectedSpaces)
      const toDelete = initialSpaces.filter((s) => !selectedNames.has(s.name))

      try {
        const [spaces] = await Promise.all([
          Promise.all(
            selectedSpaces.map((spaceName) => {
              if (existingByName.has(spaceName)) return existingByName.get(spaceName)
              const preset = presets.find((s) => s.name === spaceName)
              return createSpace.mutateAsync({ name: spaceName, icon: preset?.icon || null })
            }),
          ),
          Promise.all(toDelete.map((space) => deleteSpace.mutateAsync(space.id))),
        ])
        onComplete(spaces)
      } catch (err) {
        // No field-bound input for the space name here — rethrow as plain Error
        // so useFormSubmit shows the toast instead of trying to attach fields.
        if (err instanceof ValidationError) throw new Error(err.message)
        throw err
      }
    },
    errorMessage: 'Could not save spaces',
  })

  // Gate on presetsLoaded — otherwise a preset-named space from initialSpaces
  // flashes as a custom chip for ~250ms while presets are still loading.
  const customSpaces = presetsLoaded ? selectedSpaces.filter((s) => !presets.find((p) => p.name === s)) : []

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <CardBody className="flex flex-col">
        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
          Where do your plants <em className="not-italic text-leaf">live</em>?
        </h1>
        <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
          Pick every space that has plants. You can add more later.
        </p>

        <div className="mt-5 flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-2">
          {presets.map((space) => (
            <CheckboxCardInput
              key={space.name}
              icon={getSpaceIcon(space.icon)}
              selected={selectedSpaces.includes(space.name)}
              onClick={() => toggleSpace(space.name)}
            >
              {space.name}
            </CheckboxCardInput>
          ))}

          {/* initial={false} so persisted custom spaces don't replay the
              entrance animation on mount. */}
          <AnimatePresence initial={false}>
            {customSpaces.map((space) => (
              <motion.div
                key={space}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.33, 1, 0.68, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <CheckboxCardInput selected onClick={() => toggleSpace(space)}>
                  {space}
                </CheckboxCardInput>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Fixed-height crossfade — height 0 ↔ auto animation clamped
              CardBody's scrollTop and snapped a scrolled user to the top. */}
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
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={customSpace}
                      onChange={(e) => setCustomSpace(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomSpace()
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelAdding()
                        }
                      }}
                      aria-label="New space name"
                      className="flex-1 px-4 py-3 rounded-md bg-card border border-dashed border-ink-soft/30 text-ink text-base outline-none focus:border-leaf"
                      placeholder="Space name"
                    />
                    <Action
                      variant="unstyled"
                      onClick={addCustomSpace}
                      disabled={!customSpace.trim()}
                      aria-label="Add space"
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        customSpace.trim() ? 'bg-leaf text-card hover:bg-emerald' : 'bg-mint text-ink-soft/50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCheck} className="text-sm" />
                    </Action>
                    <Action
                      variant="unstyled"
                      onClick={cancelAdding}
                      aria-label="Cancel adding space"
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
                    <span className="text-sm font-bold">Add a custom space</span>
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
        <Action type="submit" variant="primary" disabled={selectedSpaces.length === 0 || submitting} className="flex-1">
          {submitting ? 'Creating spaces...' : 'Continue'}
        </Action>
      </CardFooter>
    </form>
  )
}
