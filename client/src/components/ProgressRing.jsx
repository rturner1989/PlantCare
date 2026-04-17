/**
 * ProgressRing — circular progress indicator.
 *
 * Pure SVG — no deps, no state. `value` is the 0–100 fill percentage;
 * values outside the range are clamped. The track uses `--mint` and the
 * fill defaults to `--leaf`, so it inherits the app palette without
 * hardcoding hex. Pass `color` as any CSS colour token/value to retint.
 *
 * `children` renders inside the ring — typically a fraction like "1/3"
 * or a single emoji. Consumers center-align it in the parent.
 *
 *   <ProgressRing value={66} size={44}>1/3</ProgressRing>
 */
export default function ProgressRing({ value = 0, size = 44, strokeWidth = 3, color = 'var(--leaf)', children }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clamped = Math.max(0, Math.min(value, 100))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--mint)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      {children != null && children !== false && children !== '' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-ink">
          {children}
        </div>
      )}
    </div>
  )
}
