import { useAuth } from '../../hooks/useAuth'
import Action from '../ui/Action'
import { CardBody, CardFooter } from '../ui/Card'

export default function Step5Done({ species, nickname, onFinish, finishing = false }) {
  const { user } = useAuth()
  const plantName = nickname || species?.common_name

  return (
    <>
      <CardBody>
        <div className="text-center py-3" aria-hidden="true">
          <div className="text-7xl">✨</div>
        </div>

        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight mt-2">
          {"You're "}
          <em className="not-italic text-leaf">all set</em>
          {user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
        </h1>

        {species && (
          <div
            className="mt-4 p-4 rounded-2xl text-white relative overflow-hidden"
            style={{ background: 'var(--gradient-forest)' }}
          >
            <p className="text-[9px] font-extrabold text-lime uppercase tracking-wider mb-1.5">
              {species.personality ? `🎭 ${plantName?.toUpperCase() ?? ''}` : plantName?.toUpperCase()}
            </p>
            <p className="font-display text-base italic font-medium leading-snug pl-2.5 border-l-2 border-coral">
              {'"I\'m having the best day. Every day is the best day."'}
            </p>
          </div>
        )}
      </CardBody>

      <CardFooter className="border-t-0">
        <Action variant="primary" onClick={onFinish} disabled={finishing} className="w-full">
          {finishing ? 'Finishing up...' : 'Enter your jungle'}
        </Action>
      </CardFooter>
    </>
  )
}
