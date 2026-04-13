import Action from '../components/ui/Action'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-6xl font-extrabold text-ink mb-4">404</h1>
      <p className="text-lg text-ink-soft mb-8">Page not found</p>

      <Action to="/" variant="primary">
        Back to Today
      </Action>
    </div>
  )
}
