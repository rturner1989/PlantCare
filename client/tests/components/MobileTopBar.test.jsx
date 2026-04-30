import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MobileTopBar from '../../src/components/MobileTopBar'
import { AuthProvider } from '../../src/context/AuthContext'

vi.mock('../../src/api/client', () => ({
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null),
}))

let queryClient

function wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('MobileTopBar', () => {
  beforeEach(() => {
    localStorage.clear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('semantics', () => {
    it('renders as a <header> element so SR users get the banner landmark', () => {
      const { container } = render(<MobileTopBar />, { wrapper })
      expect(container.querySelector('header')).toBeInTheDocument()
    })

    it('hides at md+ via Tailwind class (chrome only on phone + drawer widths)', () => {
      const { container } = render(<MobileTopBar />, { wrapper })
      expect(container.querySelector('header')).toHaveClass('md:hidden')
    })
  })

  describe('bell stub', () => {
    it('renders a disabled notifications button until B4 wires up unread counts', () => {
      render(<MobileTopBar />, { wrapper })
      const bell = screen.getByRole('button', { name: 'Notifications (coming soon)' })
      expect(bell).toBeDisabled()
    })
  })

  describe('burger', () => {
    it('does not render when no onMenuOpen handler is provided', () => {
      render(<MobileTopBar />, { wrapper })
      expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull()
    })

    it('renders when onMenuOpen is provided and is hidden below xs (480px)', () => {
      render(<MobileTopBar onMenuOpen={() => {}} />, { wrapper })
      const burger = screen.getByRole('button', { name: 'Open menu' })
      expect(burger).toBeInTheDocument()
      expect(burger.closest('div')).toHaveClass('hidden', 'xs:flex')
    })

    it('fires onMenuOpen when clicked', () => {
      const onMenuOpen = vi.fn()
      render(<MobileTopBar onMenuOpen={onMenuOpen} />, { wrapper })
      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
      expect(onMenuOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('logo', () => {
    it('renders the home-link logo', () => {
      render(<MobileTopBar />, { wrapper })
      expect(screen.getByRole('link', { name: /plantcare/i })).toHaveAttribute('href', '/')
    })
  })
})
