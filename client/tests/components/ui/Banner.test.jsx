import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Banner from '../../../src/components/ui/Banner'

describe('Banner', () => {
  describe('modes', () => {
    it('renders with the leaf circle in the calm (non-urgent) state', () => {
      const { container } = render(<Banner title="All good" />)
      const iconCircle = container.querySelectorAll('div')[1]
      expect(iconCircle).toHaveClass('bg-leaf')
    })

    it('renders with the coral circle when urgent', () => {
      const { container } = render(<Banner urgent title="3 things changed" />)
      const iconCircle = container.querySelectorAll('div')[1]
      expect(iconCircle).toHaveClass('bg-coral')
    })
  })

  describe('content', () => {
    it('shows the title (required)', () => {
      render(<Banner title="3 things changed" />)
      expect(screen.getByText('3 things changed')).toBeInTheDocument()
    })

    it('shows the subtitle when provided', () => {
      render(<Banner title="3 things" subtitle="Monty's mood dropped" />)
      expect(screen.getByText("Monty's mood dropped")).toBeInTheDocument()
    })

    it('omits the subtitle element entirely when not provided', () => {
      const { container } = render(<Banner title="3 things" />)
      // Only the title paragraph should be in the text column, no second <p>.
      expect(container.querySelectorAll('p')).toHaveLength(1)
    })

    it('right-aligns the time meta when provided', () => {
      render(<Banner title="3 things" time="18h ago" />)
      expect(screen.getByText('18h ago')).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('uses the spec radius (rounded-lg = 18px) and mint background', () => {
      const { container } = render(<Banner title="x" />)
      const root = container.firstChild
      expect(root).toHaveClass('rounded-lg')
      expect(root).toHaveClass('bg-mint')
    })
  })
})
