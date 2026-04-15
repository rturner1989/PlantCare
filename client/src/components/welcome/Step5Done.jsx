import { useAuth } from '../../hooks/useAuth'
import Action from '../ui/Action'
import Card from '../ui/Card'

export default function Step5Done({ species, nickname, onFinish }) {
  const { user } = useAuth()

  return (
    <div className="w-full max-w-sm text-center">
      <div className="text-6xl mb-6">✨</div>
      <h1 className="font-display text-4xl font-extrabold italic text-ink mb-4 tracking-tight">
        {"You're "}
        <em className="text-leaf">all set</em>
        {user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="text-ink-soft mb-6">Your garden is ready. Time to start caring.</p>

      {species && (
        <Card className="p-4 border-l-4 mb-6 text-left" style={{ borderLeftColor: 'var(--leaf)' }}>
          <p className="text-sm italic text-ink-soft font-display">
            {'"I\'m having the best day. Every day is the best day."'}
          </p>
          <p className="text-xs text-ink-soft mt-2 font-bold">{`- ${nickname || species.common_name}`}</p>
        </Card>
      )}

      <Action variant="primary" onClick={onFinish}>
        Enter your jungle
      </Action>
    </div>
  )
}
