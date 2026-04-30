import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlantAvatar from '../../src/components/PlantAvatar'

const species = (overrides = {}) => ({ id: 1, common_name: 'Monstera', ...overrides })

describe('PlantAvatar', () => {
  describe('fallback', () => {
    it('renders the sprout fallback regardless of species personality', () => {
      const { container } = render(<PlantAvatar species={species({ personality: 'dramatic' })} />)
      expect(container.textContent).toBe('🌱')
    })

    it('renders the sprout fallback when species is missing entirely', () => {
      const { container } = render(<PlantAvatar species={null} />)
      expect(container.textContent).toBe('🌱')
    })
  })

  describe('sizing', () => {
    it('defaults to the md size preset (48px via w-12 class)', () => {
      const { container } = render(<PlantAvatar species={species()} />)
      expect(container.firstChild).toHaveClass('w-12')
    })

    it('accepts a preset size and passes it through to Avatar', () => {
      const { container } = render(<PlantAvatar species={species()} size="xl" />)
      expect(container.firstChild).toHaveClass('w-20')
    })
  })

  describe('accessibility', () => {
    it('is aria-hidden because the adjacent plant name carries the label', () => {
      const { container } = render(<PlantAvatar species={species()} />)
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('appearance', () => {
    it('uses the mint background and tile radius (rounded-md) by default', () => {
      const { container } = render(<PlantAvatar species={species()} />)
      const el = container.firstChild
      expect(el).toHaveClass('bg-mint')
      expect(el).toHaveClass('rounded-md')
    })

    it('switches to rounded-full when shape="circle"', () => {
      const { container } = render(<PlantAvatar species={species()} shape="circle" />)
      const el = container.firstChild
      expect(el).toHaveClass('rounded-full')
      expect(el).not.toHaveClass('rounded-md')
    })

    it('forwards className and extra props to the root', () => {
      const { container } = render(
        <PlantAvatar species={species()} className="border-2 border-card" data-testid="added-avatar" />,
      )
      const el = container.firstChild
      expect(el).toHaveClass('border-2')
      expect(el).toHaveAttribute('data-testid', 'added-avatar')
    })
  })

  describe('image mode', () => {
    it('renders an <img> with object-cover when species.image_url is present', () => {
      const { container } = render(<PlantAvatar species={species({ image_url: '/monty.jpg' })} />)
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img).toHaveAttribute('src', '/monty.jpg')
      expect(img).toHaveClass('object-cover')
    })

    it('falls back to the sprout emoji when no image_url', () => {
      const { container } = render(<PlantAvatar species={species({ image_url: null })} />)
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toBe('🌱')
    })
  })
})
