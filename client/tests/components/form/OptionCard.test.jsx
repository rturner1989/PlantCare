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

  describe('selection state', () => {
    it('defaults to unselected (aria-pressed="false")', () => {
      render(<OptionCard>Kitchen</OptionCard>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    })

    it('reflects selected=true via aria-pressed', () => {
      render(<OptionCard selected>Kitchen</OptionCard>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows a check indicator glyph when selected', () => {
      const { container } = render(<OptionCard selected>Kitchen</OptionCard>)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('hides the check indicator glyph when not selected', () => {
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
