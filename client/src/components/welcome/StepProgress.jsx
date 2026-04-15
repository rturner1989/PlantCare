export default function StepProgress({ step, total }) {
  const progressPercent = (step / total) * 100

  return (
    <div className="w-full max-w-sm mb-8">
      <div className="h-1.5 bg-mint rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, var(--leaf), var(--emerald))',
          }}
        />
      </div>
      <p className="text-xs text-ink-soft mt-2 text-right font-semibold">
        {step} / {total}
      </p>
    </div>
  )
}
