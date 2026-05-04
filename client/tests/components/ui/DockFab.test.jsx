import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DockFab from '../../../src/components/ui/DockFab'

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, ...kwargs }) => <div {...kwargs}>{children}</div>,
    button: ({ children, initial, animate, exit, transition, ...kwargs }) => (
      <button type="button" {...kwargs}>
        {children}
      </button>
    ),
    span: ({ children, animate, transition, ...kwargs }) => <span {...kwargs}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}))

const ACTIONS = [
  { id: 'add-photo', label: 'Photo', icon: '📷' },
  { id: 'add-note', label: 'Note', icon: '📝' },
  { id: 'add-plant', label: 'Plant', icon: '🌱' },
  { id: 'log-care', label: 'Care', icon: '💧' },
  { id: 'add-space', label: 'Space', icon: '🪟' },
]

function Wrapper({ children }) {
  return <BrowserRouter>{children}</BrowserRouter>
}

describe('DockFab', () => {
  it('renders the FAB collapsed by default', () => {
    render(<DockFab actions={ACTIONS} />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clicking the FAB toggles the action menu', () => {
    render(<DockFab actions={ACTIONS} />, { wrapper: Wrapper })
    const fab = screen.getByRole('button', { name: 'Add' })

    fireEvent.click(fab)
    expect(screen.getByRole('menu', { name: 'Add' })).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(ACTIONS.length)
    expect(fab).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(fab)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(fab).toHaveAttribute('aria-expanded', 'false')
  })

  it('fires onAction + closes when an action is clicked', () => {
    const onAction = vi.fn()
    render(<DockFab actions={ACTIONS} onAction={onAction} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Plant' }))

    expect(onAction).toHaveBeenCalledWith('add-plant')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does not fire onAction when a disabled action is clicked', () => {
    const onAction = vi.fn()
    render(<DockFab actions={[{ id: 'doctor', label: 'Doctor', icon: '🩺', disabled: true }]} onAction={onAction} />, {
      wrapper: Wrapper,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Doctor' }))
    expect(onAction).not.toHaveBeenCalled()
  })

  it('exposes disabledReason in aria-label', () => {
    render(
      <DockFab
        actions={[{ id: 'doctor', label: 'Doctor', icon: '🩺', disabled: true, disabledReason: 'Coming soon' }]}
      />,
      { wrapper: Wrapper },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('menuitem', { name: /Doctor.*Coming soon/ })).toBeInTheDocument()
  })

  it('Escape closes the menu', () => {
    render(<DockFab actions={ACTIONS} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('arrow keys cycle focus between actions', () => {
    render(<DockFab actions={ACTIONS} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('menuitem', { name: 'Photo' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByRole('menuitem', { name: 'Note' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByRole('menuitem', { name: 'Photo' })).toHaveFocus()
  })

  it('uses centreLabel + centreSlot props', () => {
    render(<DockFab actions={ACTIONS} centreLabel="Quick add" centreSlot="✚" />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: 'Quick add' })).toBeInTheDocument()
    expect(screen.getByText('✚')).toBeInTheDocument()
  })
})
