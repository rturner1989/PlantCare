import Action from '../ui/Action'

export default function Step1Intro({ onNext }) {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-6xl mb-6">🌿</div>
      <h1 className="font-display text-4xl font-extrabold italic text-ink mb-4 tracking-tight">
        {"Let's set up your "}
        <em className="text-leaf">garden</em>
      </h1>
      <p className="text-ink-soft mb-8">
        {"We'll get your rooms ready and add your first plant. It only takes a minute."}
      </p>
      <Action variant="primary" onClick={onNext}>
        Get started
      </Action>
    </div>
  )
}
