import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Action from '../../../src/components/ui/Action'

// Small helper so Action's <Link> branch has a router above it.
function renderWithRouter(ui) {
  return render(ui, { wrapper: MemoryRouter })
}

describe('Action', () => {
  describe('element selection', () => {
    it('renders a <button> when neither to nor href is given', () => {
      render(<Action onClick={() => {}}>Save</Action>)
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    })

    it('renders a <Link> when `to` is given', () => {
      renderWithRouter(<Action to="/foo">Go</Action>)
      const link = screen.getByRole('link', { name: 'Go' })
      expect(link).toHaveAttribute('href', '/foo')
    })

    it('renders an <a> when `href` is given', () => {
      render(<Action href="https://example.com">Docs</Action>)
      expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://example.com')
    })
  })

  describe('button defaults', () => {
    it('defaults <button> to type="button" to prevent accidental form submission', () => {
      render(<Action>Click</Action>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('allows overriding type="submit" explicitly', () => {
      render(<Action type="submit">Submit</Action>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('fires onClick when clicked', async () => {
      const handleClick = vi.fn()
      render(<Action onClick={handleClick}>Click</Action>)
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledOnce()
    })
  })

  describe('external links', () => {
    it('adds target and rel attributes when external is true', () => {
      render(
        <Action href="https://example.com" external>
          External
        </Action>,
      )
      const link = screen.getByRole('link', { name: 'External' })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not add target or rel when external is false', () => {
      render(<Action href="https://example.com">Internal</Action>)
      const link = screen.getByRole('link', { name: 'Internal' })
      expect(link).not.toHaveAttribute('target')
      expect(link).not.toHaveAttribute('rel')
    })
  })

  describe('disabled semantics', () => {
    it('real <button disabled> when disabled + onClick', () => {
      render(<Action disabled>Off</Action>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('renders a non-clickable <span> (not an <a>) when disabled + to', () => {
      renderWithRouter(
        <Action to="/foo" disabled>
          Off
        </Action>,
      )
      // Action deliberately keeps role="link" on the disabled span so screen
      // readers still announce it as a link — we assert on tag + aria-disabled
      // instead of querying by role.
      const el = screen.getByText('Off')
      expect(el.tagName).toBe('SPAN')
      expect(el).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('styling', () => {
    it('applies variant classes by default', () => {
      render(<Action variant="primary">Hello</Action>)
      // primary includes `rounded-full` — cheap signal that the variant wired up
      expect(screen.getByRole('button')).toHaveClass('rounded-full')
    })

    it('merges user-provided className with variant classes', () => {
      render(
        <Action variant="fab" className="extra-class" aria-label="Test">
          <span>+</span>
        </Action>,
      )
      const button = screen.getByRole('button', { name: 'Test' })
      expect(button).toHaveClass('extra-class')
      // fab variant has this width
      expect(button.className).toContain('w-[54px]')
    })

    it('variant="unstyled" skips variant classes and the focus ring', () => {
      render(
        <Action variant="unstyled" className="only-mine">
          Bare
        </Action>,
      )
      const button = screen.getByRole('button')
      // User className is applied
      expect(button).toHaveClass('only-mine')
      // No variant visuals
      expect(button.className).not.toContain('rounded-full')
      expect(button.className).not.toContain('bg-[image:')
      // No focus ring
      expect(button.className).not.toContain('focus-visible:ring')
      // Element-level resets (border-0, cursor-pointer) still apply — they're
      // not "variant styling", they're "make <button> behave sanely".
    })
  })

  describe('passthrough props', () => {
    it('forwards arbitrary props (id, data-*, aria-label) via ...kwargs', () => {
      render(
        <Action id="my-action" data-testid="action-1" aria-label="Pressable">
          <span>+</span>
        </Action>,
      )
      const button = screen.getByTestId('action-1')
      expect(button).toHaveAttribute('id', 'my-action')
      expect(button).toHaveAttribute('aria-label', 'Pressable')
    })
  })
})
