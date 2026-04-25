import { Outlet } from 'react-router-dom'
import AuthMarketing from '../components/auth/AuthMarketing'
import SunshineEm from '../components/auth/SunshineEm'
import Logo from '../components/Logo'
import Action from '../components/ui/Action'

export default function AuthLayout() {
  return (
    <div className="min-h-dvh lg:h-dvh lg:grid lg:grid-cols-2">
      <aside className="hidden lg:flex bg-[image:var(--gradient-forest-marketing)] text-paper relative overflow-hidden">
        <SharedMarketing />
      </aside>

      <div className="flex flex-col px-6 py-8 sm:py-12 lg:px-12 lg:py-16 min-h-dvh lg:min-h-0 lg:overflow-y-auto">
        <Logo className="lg:hidden mb-10 self-start" />

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full flex justify-center">
            <Outlet />
          </div>
        </div>

        <p className="hidden lg:block mt-auto text-[11px] text-ink-softer text-center pt-8">
          By signing in you agree to our{' '}
          <Action to="#" variant="unstyled" className="underline hover:text-emerald">
            Terms
          </Action>{' '}
          &amp;{' '}
          <Action to="#" variant="unstyled" className="underline hover:text-emerald">
            Privacy
          </Action>
          .
        </p>
      </div>
    </div>
  )
}

function SharedMarketing() {
  return (
    <AuthMarketing
      pillLabel="Plant care without the spreadsheet"
      heading={
        <>
          Care that <SunshineEm>actually fits</SunshineEm> your week.
        </>
      }
      pitch="Personality-driven reminders. Schedules that learn from your space. Photos, milestones, and a streak that quietly cheers you on."
      peekPills={[
        {
          id: 'overdue',
          emoji: '🌿',
          content: (
            <>
              <em className="font-display italic text-sunshine">Monstera</em> needs water · 3d overdue
            </>
          ),
        },
        {
          id: 'milestone',
          emoji: '🎂',
          content: (
            <>
              <em className="font-display italic text-sunshine">Basil</em> · 30 days with you today
            </>
          ),
        },
        { id: 'rain', emoji: '🌧', content: 'Rain Sunday · outdoor schedule shifted' },
      ]}
      supportLine="· Indie · No spam · Your data exports ·"
    />
  )
}
