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
      // Without selection, the check indicator has no glyph inside, so the
      // only SVG in the tree is the FA icon in the tile.
      expect(container.querySelectorAll('svg')).toHaveLength(1)
    })

    it('does not render an icon tile when the icon prop is omitted', () => {
      const { container } = render(<OptionCard>Custom Room</OptionCard>)
      expect(container.querySelector('svg')).toBeNull()
    })

    it('renders both tile icon and check glyph when icon is passed and selected', () => {
      const { container } = render(
        <OptionCard icon={faCouch} selected>
          Living Room
        </OptionCard>,
      )
      expect(container.querySelectorAll('svg')).toHaveLength(2)
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

    it('shows a check glyph on the right indicator when selected', () => {
      const { container } = render(<OptionCard selected>Kitchen</OptionCard>)
      // No icon prop here — only SVG in the tree should be the check glyph.
      expect(container.querySelectorAll('svg')).toHaveLength(1)
    })

    it('omits the check glyph when not selected', () => {
      const { container } = render(<OptionCard>Kitchen</OptionCard>)
      expect(container.querySelector('svg')).toBeNull()
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
