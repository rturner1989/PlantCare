/**
 * Card — compound-component surface primitive.
 *
 * Default export is the wrapper container. Named exports (CardHeader, CardBody,
 * CardFooter) are optional sections with sensible padding and divider borders.
 * Consumers mix and match — any section can be omitted:
 *
 *   <Card>
 *     <CardHeader>Title</CardHeader>
 *     <CardBody>Content</CardBody>
 *     <CardFooter>Actions</CardFooter>
 *   </Card>
 *
 * All four accept `className` for override and `...kwargs` for passthrough.
 *
 * Shadow is NOT baked in — elevation is a call-site choice. Add via className
 * when you want a floating card (e.g. auth forms use `shadow-[var(--shadow-md)]`).
 */

export default function Card({ className = '', children, ...kwargs }) {
  return (
    <div className={`bg-card rounded-lg border border-mint overflow-hidden ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...kwargs }) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b border-mint ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

// `flex-1 min-h-0 overflow-y-auto` make the body the scrollable region
// whenever its Card parent is height-constrained (e.g. WizardCard). For
// an unconstrained Card (Login, Register), flex-1/min-h-0 are no-ops and
// overflow-y-auto never triggers because content fits its natural height.
export function CardBody({ className = '', children, ...kwargs }) {
  return (
    <div className={`p-6 flex-1 min-h-0 overflow-y-auto ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...kwargs }) {
  return (
    <div className={`p-6 border-t border-mint ${className}`} {...kwargs}>
      {children}
    </div>
  )
}
