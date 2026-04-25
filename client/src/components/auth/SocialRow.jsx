import Action from '../ui/Action'

const BUTTON_CLASSES =
  'w-full px-4 py-2.5 rounded-md bg-paper-deep border border-paper-edge text-sm font-semibold text-ink-soft cursor-not-allowed opacity-70'

export default function SocialRow() {
  return (
    <>
      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-paper-edge" />
        <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink-softer">or</span>
        <span className="flex-1 h-px bg-paper-edge" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Action variant="unstyled" disabled title="Coming soon" className={BUTTON_CLASSES}>
          Continue with Google
        </Action>
        <Action variant="unstyled" disabled title="Coming soon" className={BUTTON_CLASSES}>
          Continue with Apple
        </Action>
      </div>
    </>
  )
}
