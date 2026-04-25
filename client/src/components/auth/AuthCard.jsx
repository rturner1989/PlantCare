import { useLocation } from 'react-router-dom'
import Action from '../ui/Action'
import SocialRow from './SocialRow'

const CROSS_AUTH_BY_PATH = {
  '/login': { prompt: "Don't have an account?", linkText: 'Sign up', to: '/register' },
  '/register': { prompt: 'Already have an account?', linkText: 'Log in', to: '/login' },
  '/forgot-password': { prompt: 'Remembered it?', linkText: 'Log in', to: '/login' },
}

export default function AuthCard({
  preheading,
  heading,
  subtitle,
  children,
  showSocial = true,
  showCrossAuth = true,
  className = '',
}) {
  const location = useLocation()
  const crossAuth = showCrossAuth ? (CROSS_AUTH_BY_PATH[location.pathname] ?? null) : null

  return (
    <div className={`w-full max-w-auth ${className}`}>
      <div className="bg-paper rounded-lg shadow-warm-md p-7 sm:p-8 lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0">
        {preheading && (
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.22em] uppercase text-emerald mb-2">
            <span
              aria-hidden="true"
              className="w-[7px] h-[7px] rounded-full bg-emerald shadow-[0_0_0_3px_rgba(20,144,47,0.2)]"
            />
            {preheading}
          </div>
        )}
        {heading && (
          <h1 className="font-display italic font-normal text-[34px] sm:text-[40px] leading-none tracking-tight text-ink mb-2">
            {heading}
          </h1>
        )}
        {subtitle && <p className="text-sm text-ink-soft leading-relaxed mb-5">{subtitle}</p>}
        {children}
        {showSocial && <SocialRow />}
        {crossAuth && (
          <p className="mt-5 text-sm text-ink-soft text-center">
            {crossAuth.prompt}{' '}
            <Action to={crossAuth.to} variant="unstyled" className="text-emerald font-bold hover:underline">
              {crossAuth.linkText}
            </Action>
          </p>
        )}
      </div>
    </div>
  )
}
