import Action from '../ui/Action'

export default function Step1Intro({ onNext }) {
  return (
    <>
      <div className="text-center py-3" aria-hidden="true">
        <div className="text-7xl">🌿</div>
      </div>

      <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight mt-2">
        {"Let's set up your "}
        <em className="not-italic text-leaf">garden</em>.
      </h1>

      <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
        {"We'll ask a few quick questions so we can calculate the perfect care schedule. Takes about a minute."}
      </p>

      <div className="mt-auto pt-6">
        <Action variant="primary" onClick={onNext} className="w-full">
          {"Let's begin"}
        </Action>
      </div>
    </>
  )
}
