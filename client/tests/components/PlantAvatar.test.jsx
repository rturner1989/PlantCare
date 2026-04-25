import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlantAvatar from '../../src/components/PlantAvatar'

const species = (personality) => ({ id: 1, common_name: 'Monstera', personality })

describe('PlantAvatar', () => {
  describe('personality-keyed emoji', () => {
    it.each([
      ['dramatic', '🌿'],
      ['prickly', '🌵'],
      ['chill', '🪴'],
      ['needy', '🌸'],
      ['stoic', '🌲'],
    ])('renders the %s emoji (%s)', (personality, emoji) => {
      const { container } = render(<PlantAvatar species={species(personality)} />)
      expect(container.textContent).toBe(emoji)
    })

    it('falls back to a generic sprout for an unknown personality', () => {
      const { container } = render(<PlantAvatar species={species('mysterious')} />)
      expect(container.textContent).toBe('🌱')
    })

    it('falls back to the generic sprout when species is missing entirely', () => {
      const { container } = render(<PlantAvatar species={null} />)
      expect(container.textContent).toBe('🌱')
    })
  })

  describe('sizing', () => {
    it('defaults to the md size preset (48px via w-12 class)', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      expect(container.firstChild).toHaveClass('w-12')
    })

    it('accepts a preset size and passes it through to Avatar', () => {
      const { container } = render(<PlantAvatar species={species('chill')} size="xl" />)
      expect(container.firstChild).toHaveClass('w-20')
    })
  })

  describe('accessibility', () => {
    it('is aria-hidden because the adjacent plant name carries the label', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('appearance', () => {
    it('uses the mint background and tile radius (rounded-md) by default', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      const el = container.firstChild
      expect(el).toHaveClass('bg-mint')
      expect(el).toHaveClass('rounded-md')
    })

    it('switches to rounded-full when shape="circle"', () => {
      const { container } = render(<PlantAvatar species={species('chill')} shape="circle" />)
      const el = container.firstChild
      expect(el).toHaveClass('rounded-full')
      expect(el).not.toHaveClass('rounded-md')
    })

    it('forwards className and extra props to the root', () => {
      const { container } = render(
        <PlantAvatar species={species('chill')} className="border-2 border-card" data-testid="added-avatar" />,
      )
      const el = container.firstChild
      expect(el).toHaveClass('border-2')
      expect(el).toHaveAttribute('data-testid', 'added-avatar')
    })
  })

  describe('image mode', () => {
    const speciesWithImage = (imageUrl) => ({
      id: 1,
      common_name: 'Monstera',
      personality: 'dramatic',
      image_url: imageUrl,
    })

    it('renders an <img> with object-cover when species.image_url is present', () => {
      const { container } = render(<PlantAvatar species={speciesWithImage('/monty.jpg')} />)
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img).toHaveAttribute('src', '/monty.jpg')
      expect(img).toHaveClass('object-cover')
    })

    it('falls back to the personality emoji when no image_url', () => {
      const { container } = render(<PlantAvatar species={speciesWithImage(null)} />)
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toBe('🌿')
    })
  })
})
