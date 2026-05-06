import Action from '../../ui/Action'

export default function AddSpaceTile({ onClick }) {
  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-md border-2 border-dashed border-emerald/30 hover:border-leaf hover:bg-lime/10 transition-colors"
    >
      <span
        aria-hidden="true"
        className="w-11 h-11 rounded-full bg-mint text-emerald flex items-center justify-center text-[22px] font-bold"
      >
        +
      </span>
      <span className="font-display italic text-[17px] text-emerald leading-none">Add a space</span>
      <span className="text-[11px] font-semibold tracking-[0.04em] text-ink-softer">Indoor or outdoor</span>
    </Action>
  )
}
