import Logo from '../Logo'

export default function AuthMarketing({ pillLabel, heading, pitch, peekPills = [], supportLine }) {
  return (
    <div className="relative flex-1 flex flex-col gap-6 p-9 lg:p-11 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-36 -right-40 w-[460px] h-[460px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(255,184,61,0.28), transparent 55%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-44 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(134,219,101,0.22), transparent 55%)' }}
      />

      <div className="relative z-10">
        <Logo className="text-paper" />
      </div>

      {pillLabel && (
        <span className="relative z-10 inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-paper/15 text-[10px] font-extrabold tracking-[0.18em] uppercase text-paper/85">
          <span aria-hidden="true" className="w-[7px] h-[7px] rounded-full bg-sunshine" />
          {pillLabel}
        </span>
      )}

      {heading && (
        <h1 className="relative z-10 font-display italic font-normal text-[44px] lg:text-[54px] leading-[1.02] tracking-tight max-w-[360px]">
          {heading}
        </h1>
      )}

      {pitch && <p className="relative z-10 text-base text-paper/80 max-w-[360px] leading-relaxed">{pitch}</p>}

      {peekPills.length > 0 && (
        <ul className="relative z-10 mt-auto flex flex-col gap-2.5">
          {peekPills.map((pill) => (
            <li
              key={pill.id}
              className="inline-flex w-fit items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-full bg-paper/12 text-xs font-semibold text-paper/88 backdrop-blur-light"
            >
              <span className="w-7 h-7 rounded-full bg-paper text-forest inline-flex items-center justify-center text-sm flex-shrink-0">
                {pill.emoji}
              </span>
              <span>{pill.content}</span>
            </li>
          ))}
        </ul>
      )}

      {supportLine && (
        <p className="relative z-10 text-[11px] font-bold tracking-[0.1em] uppercase text-paper/45">{supportLine}</p>
      )}
    </div>
  )
}
