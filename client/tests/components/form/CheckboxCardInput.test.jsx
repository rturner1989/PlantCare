import { faCouch } from '@fortawesome/free-solid-svg-icons'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CheckboxCardInput from '../../../src/components/form/CheckboxCardInput'

describe('CheckboxCardInput', () => {
  describe('rendering', () => {
    it('renders the children as the label', () => {
      render(<CheckboxCardInput>Living Room</CheckboxCardInput>)
      expect(screen.getByRole('checkbox', { name: /Living Room/ })).toBeInTheDocument()
    })

    it('is a <button type="button"> so it does not submit enclosing forms', () => {
      render(<CheckboxCardInput>Bedroom</CheckboxCardInput>)
      expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'button')
    })
  })

  describe('icon tile', () => {
    it('renders an icon tile when the icon prop is passed', () => {
      const { container } = render(<CheckboxCardInput icon={faCouch}>Living Room</CheckboxCardInput>)
      expect(container.querySelectorAll('svg')).toHaveLength(2)
    })

    it('does not render an icon tile when the icon prop is omitted', () => {
      const { container } = render(<CheckboxCardInput>Custom Space</CheckboxCardInput>)
      expect(container.querySelectorAll('svg')).toHaveLength(1)
    })
  })

  describe('selection state', () => {
    it('defaults to unselected (aria-checked="false")', () => {
      render(<CheckboxCardInput>Kitchen</CheckboxCardInput>)
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    })

    it('reflects selected=true via aria-checked', () => {
      render(<CheckboxCardInput selected>Kitchen</CheckboxCardInput>)
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    })

    // Check glyph is always mounted so the transition can animate opacity +
    // scale instead of snapping in on first paint.
    it('shows the check glyph at full opacity when selected', () => {
      const { container } = render(<CheckboxCardInput selected>Kitchen</CheckboxCardInput>)
      const checkIcon = container.querySelector('svg')
      expect(checkIcon).not.toBeNull()
      expect(checkIcon.getAttribute('class')).toContain('opacity-100')
      expect(checkIcon.getAttribute('class')).toContain('scale-100')
    })

    it('keeps the check glyph hidden via opacity-0 + scale-50 when not selected', () => {
      const { container } = render(<CheckboxCardInput>Kitchen</CheckboxCardInput>)
      const checkIcon = container.querySelector('svg')
      expect(checkIcon).not.toBeNull()
      expect(checkIcon.getAttribute('class')).toContain('opacity-0')
      expect(checkIcon.getAttribute('class')).toContain('scale-50')
    })
  })

  describe('onClick', () => {
    it('fires onClick when the button is clicked', async () => {
      const handleClick = vi.fn()
      render(<CheckboxCardInput onClick={handleClick}>Office</CheckboxCardInput>)
      await userEvent.click(screen.getByRole('checkbox'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('passthrough', () => {
    it('merges user className', () => {
      render(
        <CheckboxCardInput className="my-custom" selected>
          Bath
        </CheckboxCardInput>,
      )
      expect(screen.getByRole('checkbox')).toHaveClass('my-custom')
    })

    it('forwards arbitrary props via ...kwargs', () => {
      render(<CheckboxCardInput data-testid="space-card">Bath</CheckboxCardInput>)
      expect(screen.getByTestId('space-card')).toBeInTheDocument()
    })
  })
})
