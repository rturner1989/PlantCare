import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import TaskRow from '../../src/components/TaskRow'

const render_ = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

const plant = (overrides = {}) => ({
  id: 1,
  nickname: 'Monty',
  species: { id: 1, common_name: 'Monstera', personality: 'dramatic' },
  water_status: 'overdue',
  feed_status: 'due_soon',
  days_until_water: -3,
  ...overrides,
})

describe('TaskRow', () => {
  describe('identity', () => {
    it('shows the plant nickname', () => {
      render_(<TaskRow plant={plant()} careType="watering" />)
      expect(screen.getByText('Monty')).toBeInTheDocument()
    })

    it('renders the voice quote when passed (italic line under the name)', () => {
      render_(<TaskRow plant={plant()} careType="watering" voiceQuote="I'm wilting dramatically." />)
      expect(screen.getByText("I'm wilting dramatically.")).toBeInTheDocument()
    })

    it('omits the voice quote element entirely when not passed', () => {
      render_(<TaskRow plant={plant()} careType="watering" />)
      // Name + care-tag label — no second <p> for the quote.
      expect(screen.queryByText(/wilting/)).not.toBeInTheDocument()
    })
  })

  describe('care-type + status badges', () => {
    it('shows "Water" for watering tasks and "Feed" for feeding tasks', () => {
      const { rerender } = render_(<TaskRow plant={plant()} careType="watering" />)
      expect(screen.getByText('Water')).toBeInTheDocument()

      rerender(
        <MemoryRouter>
          <TaskRow plant={plant()} careType="feeding" />
        </MemoryRouter>,
      )
      expect(screen.getByText('Feed')).toBeInTheDocument()
    })

    it('renders an "Overdue" status badge when water_status is overdue', () => {
      render_(<TaskRow plant={plant({ water_status: 'overdue' })} careType="watering" />)
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('reads feed_status instead of water_status when careType is feeding', () => {
      render_(<TaskRow plant={plant({ water_status: 'overdue', feed_status: 'due_today' })} careType="feeding" />)
      expect(screen.getByText('Due today')).toBeInTheDocument()
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    })

    it('hides the status badge for healthy/unknown (non-events on Today)', () => {
      render_(<TaskRow plant={plant({ water_status: 'healthy' })} careType="watering" />)
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
      expect(screen.queryByText('Due today')).not.toBeInTheDocument()
      expect(screen.queryByText('Due soon')).not.toBeInTheDocument()
    })
  })

  describe('visual state precedence', () => {
    it("done > overdue — a completed row doesn't show the coral overdue tint", () => {
      const { container } = render_(<TaskRow plant={plant({ water_status: 'overdue' })} careType="watering" done />)
      // The root row <div> is the direct child of the render container.
      const row = container.firstChild
      expect(row.className).not.toContain('border-coral/30')
      expect(row.className).toContain('opacity-75')
    })

    it('applies strikethrough to the name when done', () => {
      render_(<TaskRow plant={plant()} careType="watering" done />)
      expect(screen.getByText('Monty').className).toContain('line-through')
    })
  })

  describe('check button', () => {
    it('fires onComplete when tapped', () => {
      const onComplete = vi.fn()
      render_(<TaskRow plant={plant()} careType="watering" onComplete={onComplete} />)
      screen.getByRole('button', { name: /Mark water done for Monty/ }).click()
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("exposes the plant name + care type in the aria-label so screen readers know what they're acting on", () => {
      render_(<TaskRow plant={plant()} careType="feeding" />)
      expect(screen.getByRole('button', { name: /Mark feed done for Monty/ })).toBeInTheDocument()
    })

    it('flips the aria-label + aria-pressed when done', () => {
      render_(<TaskRow plant={plant()} careType="watering" done />)
      const button = screen.getByRole('button', { name: /Water done for Monty/ })
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it("is disabled once done so rapid taps don't double-fire", () => {
      render_(<TaskRow plant={plant()} careType="watering" done />)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
