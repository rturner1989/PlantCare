import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EmptyState from '../../../src/components/ui/EmptyState'

describe('EmptyState', () => {
  describe('slot rendering', () => {
    it('renders only the description when icon/title/action are omitted', () => {
      render(<EmptyState description="No species found." />)
      expect(screen.getByText('No species found.')).toBeInTheDocument()
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders the title in an <h2> by default', () => {
      render(<EmptyState title="No plants yet" />)
      const heading = screen.getByRole('heading', { name: 'No plants yet' })
      expect(heading.tagName).toBe('H2')
    })

    it('promotes the title to an <h1> when headingLevel="h1" (for page-level empties)', () => {
      render(<EmptyState title="All caught up!" headingLevel="h1" />)
      const heading = screen.getByRole('heading', { name: 'All caught up!' })
      expect(heading.tagName).toBe('H1')
    })

    it('renders the icon inside a circular mint badge', () => {
      render(<EmptyState icon={<span data-testid="leaf-icon">🌿</span>} />)
      const icon = screen.getByTestId('leaf-icon')
      const badge = icon.parentElement
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('bg-mint')
    })

    it('renders the action below the description', () => {
      render(<EmptyState description="Empty" action={<button type="button">Add</button>} />)
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    })

    it('renders all four slots together when fully populated', () => {
      render(
        <EmptyState
          icon={<span data-testid="icon">i</span>}
          title="Empty house"
          description="Add your first plant."
          action={<button type="button">Add</button>}
        />,
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Empty house' })).toBeInTheDocument()
      expect(screen.getByText('Add your first plant.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    })
  })

  describe('description spacing', () => {
    it('omits mt-1 when there is no title above (description hugs the top)', () => {
      render(<EmptyState description="Just text" />)
      expect(screen.getByText('Just text')).not.toHaveClass('mt-1')
    })

    it('adds mt-1 when a title is present (separates the two)', () => {
      render(<EmptyState title="Heading" description="Detail" />)
      expect(screen.getByText('Detail')).toHaveClass('mt-1')
    })
  })

  describe('description content', () => {
    it('accepts a JSX node, not just a string (for query interpolation etc.)', () => {
      render(
        <EmptyState
          description={
            <>
              No matches for <strong>"xyz"</strong>.
            </>
          }
        />,
      )
      expect(screen.getByText('xyz', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('"xyz"').tagName).toBe('STRONG')
    })
  })

  describe('layout', () => {
    it('centers its slots in a flex column', () => {
      const { container } = render(<EmptyState description="hi" />)
      const root = container.firstChild
      expect(root).toHaveClass('flex')
      expect(root).toHaveClass('flex-col')
      expect(root).toHaveClass('items-center')
      expect(root).toHaveClass('justify-center')
      expect(root).toHaveClass('text-center')
    })

    it("does NOT bake in vertical padding — outer spacing is the caller's job", () => {
      const { container } = render(<EmptyState description="hi" />)
      expect(container.firstChild.className).not.toMatch(/\bpy-/)
    })
  })

  describe('className', () => {
    it('merges a user-provided className alongside the layout classes', () => {
      const { container } = render(<EmptyState description="hi" className="py-8" />)
      const root = container.firstChild
      expect(root).toHaveClass('py-8')
      expect(root).toHaveClass('flex')
    })
  })
})
