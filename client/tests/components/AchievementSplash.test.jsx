import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AchievementSplash from '../../src/components/AchievementSplash'

vi.mock('motion/react', () => {
  const motion = new Proxy(
    { create: (Component) => Component },
    {
      get: (target, prop) => {
        if (prop in target) return target[prop]
        return ({ children, ...kwargs }) => <div {...kwargs}>{children}</div>
      },
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }) => <>{children}</>,
  }
})

const markSeenMock = vi.fn()
let queueMock = []

vi.mock('../../src/hooks/useUnseenAchievements', () => ({
  useUnseenAchievements: () => ({ achievements: queueMock, markSeen: markSeenMock }),
}))

describe('<AchievementSplash />', () => {
  beforeEach(() => {
    markSeenMock.mockClear()
    queueMock = []
  })

  it('renders nothing when the queue is empty', () => {
    queueMock = []
    const { container } = render(<AchievementSplash />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the front of the queue with emoji + label', () => {
    queueMock = [{ id: 7, kind: 'login_streak_7', label: '7-day visit streak', emoji: '⭐' }]
    render(<AchievementSplash />)

    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '7-day visit streak' })).toBeInTheDocument()
    expect(screen.getByText('Achievement unlocked')).toBeInTheDocument()
  })

  it('uses dialog semantics for screen readers', () => {
    queueMock = [{ id: 7, kind: 'login_streak_7', label: '7-day visit streak', emoji: '⭐' }]
    render(<AchievementSplash />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'achievement-splash-title')
  })

  it('calls markSeen with the front entry id on Continue', async () => {
    queueMock = [{ id: 7, kind: 'login_streak_7', label: '7-day visit streak', emoji: '⭐' }]
    render(<AchievementSplash />)

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(markSeenMock).toHaveBeenCalledWith(7)
  })

  it('renders only the front of the queue when multiple are pending', () => {
    queueMock = [
      { id: 7, kind: 'login_streak_7', label: '7-day visit streak', emoji: '⭐' },
      { id: 8, kind: 'login_streak_30', label: '30-day visit streak', emoji: '⭐' },
    ]
    render(<AchievementSplash />)

    expect(screen.getByRole('heading', { name: '7-day visit streak' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '30-day visit streak' })).not.toBeInTheDocument()
  })
})
