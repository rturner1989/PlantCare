// Fixed-height slab pattern — every Row carries the same min-height so
// the dashed divider sits at the same Y across a grid of cards. Locked
// per project_v2_design_decisions.md: 62px desktop / 34px mobile.

function SummarySlab({ children, className = '', ...kwargs }) {
  return (
    <div className={`flex flex-col ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

function Row({ children, className = '', ...kwargs }) {
  return (
    <div
      className={`flex items-center min-h-[34px] lg:min-h-[62px] [&:not(:first-child)]:border-t [&:not(:first-child)]:border-dashed [&:not(:first-child)]:border-paper-edge ${className}`}
      {...kwargs}
    >
      {children}
    </div>
  )
}

SummarySlab.Row = Row

export default SummarySlab
