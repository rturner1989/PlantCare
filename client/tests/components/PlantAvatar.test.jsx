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
    it('defaults to 48px square', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      const el = container.firstChild
      expect(el.style.width).toBe('48px')
      expect(el.style.height).toBe('48px')
    })

    it('accepts a custom size and scales the font accordingly (0.45 ratio)', () => {
      const { container } = render(<PlantAvatar species={species('chill')} size={64} />)
      const el = container.firstChild
      expect(el.style.width).toBe('64px')
      expect(el.style.height).toBe('64px')
      expect(el.style.fontSize).toBe(`${64 * 0.45}px`)
    })
  })

  describe('accessibility', () => {
    it('is aria-hidden because the adjacent plant name carries the label', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('appearance', () => {
    it('uses the mint background and spec radius (rounded-xl = 22px)', () => {
      const { container } = render(<PlantAvatar species={species('chill')} />)
      const el = container.firstChild
      expect(el).toHaveClass('bg-mint')
      expect(el).toHaveClass('rounded-xl')
    })
  })
})
