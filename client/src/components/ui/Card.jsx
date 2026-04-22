export default function Card({ className = '', ref, children, ...kwargs }) {
  return (
    <div ref={ref} className={`bg-card rounded-md border border-mint overflow-hidden ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', divider = true, children, ...kwargs }) {
  const dividerClass = divider ? 'border-b border-mint' : ''
  return (
    <div className={`px-6 pt-6 pb-4 ${dividerClass} ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...kwargs }) {
  return (
    <div className={`p-6 flex-1 min-h-0 overflow-y-auto ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', divider = true, children, ...kwargs }) {
  const dividerClass = divider ? 'border-t border-mint' : ''
  return (
    <div className={`p-6 ${dividerClass} ${className}`} {...kwargs}>
      {children}
    </div>
  )
}
