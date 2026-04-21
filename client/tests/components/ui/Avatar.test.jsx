import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Avatar from '../../../src/components/ui/Avatar'

describe('Avatar', () => {
  describe('source selection', () => {
    it('renders the image when src is provided', () => {
      const { container } = render(<Avatar src="/plant.jpg" fallback={<span>F</span>} />)
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img).toHaveAttribute('src', '/plant.jpg')
      expect(container.textContent).toBe('')
    })

    it('renders the fallback when src is missing', () => {
      const { container } = render(<Avatar fallback={<span>F</span>} />)
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toBe('F')
    })

    it('flips to the fallback when the image fails to load', () => {
      const { container } = render(<Avatar src="/broken.jpg" fallback={<span>F</span>} />)
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      fireEvent.error(img)
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toBe('F')
    })
  })

  describe('shape + sizing', () => {
    it('uses rounded-xl by default (tile shape)', () => {
      const { container } = render(<Avatar fallback={<span>F</span>} />)
      expect(container.firstChild).toHaveClass('rounded-xl')
    })

    it('switches to rounded-full when shape="circle"', () => {
      const { container } = render(<Avatar fallback={<span>F</span>} shape="circle" />)
      expect(container.firstChild).toHaveClass('rounded-full')
    })

    it('scales width, height, and font-size together', () => {
      const { container } = render(<Avatar fallback={<span>F</span>} size={64} />)
      const el = container.firstChild
      expect(el.style.width).toBe('64px')
      expect(el.style.height).toBe('64px')
      expect(el.style.fontSize).toBe(`${64 * 0.45}px`)
    })
  })

  describe('passthrough', () => {
    it('forwards className and extra props to the root', () => {
      const { container } = render(
        <Avatar fallback={<span>F</span>} className="border-2 border-card" data-testid="user-avatar" />,
      )
      const el = container.firstChild
      expect(el).toHaveClass('border-2')
      expect(el).toHaveAttribute('data-testid', 'user-avatar')
    })
  })
})
