import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-6xl font-extrabold text-ink mb-4">404</h1>
      <p className="text-lg text-ink-soft mb-8">Page not found</p>

      <Link to="/" className="px-6 py-3 rounded-full text-white font-extrabold text-sm no-underline bg-[image:var(--gradient-brand)]">
        Back to Today
      </Link>
    </div>
  )
}
