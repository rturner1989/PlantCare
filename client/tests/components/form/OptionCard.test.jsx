import { faCouch } from '@fortawesome/free-solid-svg-icons'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import OptionCard from '../../../src/components/form/OptionCard'

describe('OptionCard', () => {
  describe('rendering', () => {
    it('renders the children as the label', () => {
      render(<OptionCard>Living Room</OptionCard>)
      expect(screen.getByRole('button', { name: /Living Room/ })).toBeInTheDocument()
    })

    it('is a <button type="button"> so it does not submit enclosing forms', () => {
      render(<OptionCard>Bedroom</OptionCard>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })
  })

  describe('icon tile', () => {
    it('renders an icon tile when the icon prop is passed', () => {
      const { container } = render(<OptionCard icon={faCouch}>Living Room</OptionCard>)
      // Check glyph is always in the DOM now (fades between states), so an
      // OptionCard with an icon has two SVGs — tile glyph + check glyph.
      expect(container.querySelectorAll('svg')).toHaveLength(2)
    })

    it('does not render an icon tile when the icon prop is omitted', () => {
      const { container } = render(<OptionCard>Custom Room</OptionCard>)
      // Only the check glyph is in the tree — no tile.
      expect(container.querySelectorAll('svg')).toHaveLength(1)
    })
  })

  describe('selection state', () => {
    it('defaults to unselected (aria-pressed="false")', () => {
      render(<OptionCard>Kitchen</OptionCard>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    })

    it('reflects selected=true via aria-pressed', () => {
      render(<OptionCard selected>Kitchen</OptionCard>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    })

    // The check glyph is always mounted so the transition between states
    // can animate opacity + scale instead of snapping in on first paint.
    // Assertions target the classes that drive the visibility, not the
    // DOM presence.
    it('shows the check glyph at full opacity when selected', () => {
      const { container } = render(<OptionCard selected>Kitchen</OptionCard>)
      const checkIcon = container.querySelector('svg')
      expect(checkIcon).not.toBeNull()
      expect(checkIcon.getAttribute('class')).toContain('opacity-100')
      expect(checkIcon.getAttribute('class')).toContain('scale-100')
    })

    it('keeps the check glyph hidden via opacity-0 + scale-50 when not selected', () => {
      const { container } = render(<OptionCard>Kitchen</OptionCard>)
      const checkIcon = container.querySelector('svg')
      expect(checkIcon).not.toBeNull()
      expect(checkIcon.getAttribute('class')).toContain('opacity-0')
      expect(checkIcon.getAttribute('class')).toContain('scale-50')
    })
  })

  describe('onClick', () => {
    it('fires onClick when the button is clicked', async () => {
      const handleClick = vi.fn()
      render(<OptionCard onClick={handleClick}>Office</OptionCard>)
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('passthrough', () => {
    it('merges user className', () => {
      render(
        <OptionCard className="my-custom" selected>
          Bath
        </OptionCard>,
      )
      expect(screen.getByRole('button')).toHaveClass('my-custom')
    })

    it('forwards arbitrary props via ...kwargs', () => {
      render(<OptionCard data-testid="room-card">Bath</OptionCard>)
      expect(screen.getByTestId('room-card')).toBeInTheDocument()
    })
  })
})
