import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageHeader from '../../../src/components/ui/PageHeader'

describe('PageHeader', () => {
  it('renders the heading from children', () => {
    render(<PageHeader>Browse your plants</PageHeader>)
    expect(screen.getByRole('heading', { level: 1, name: 'Browse your plants' })).toBeInTheDocument()
  })

  it('renders the eyebrow when provided', () => {
    render(<PageHeader eyebrow="Your greenhouse">Browse your plants</PageHeader>)
    expect(screen.getByText('Your greenhouse')).toBeInTheDocument()
  })

  it('omits the eyebrow when not provided', () => {
    render(<PageHeader>Browse your plants</PageHeader>)
    expect(screen.queryByText(/greenhouse/i)).not.toBeInTheDocument()
  })

  it('renders the meta line when provided', () => {
    render(<PageHeader meta="12 plants · 5 spaces">Browse your plants</PageHeader>)
    expect(screen.getByText('12 plants · 5 spaces')).toBeInTheDocument()
  })

  it('omits the meta line when not provided', () => {
    render(<PageHeader>Browse your plants</PageHeader>)
    expect(screen.queryByText(/plants ·/i)).not.toBeInTheDocument()
  })

  it('renders the actions slot when provided', () => {
    render(<PageHeader actions={<button type="button">View toggle</button>}>Browse your plants</PageHeader>)
    expect(screen.getByRole('button', { name: 'View toggle' })).toBeInTheDocument()
  })

  it('uses the display heading variant by default', () => {
    render(<PageHeader>Browse your plants</PageHeader>)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toMatch(/text-\[34px\]/)
  })

  it('honours an alternate headingVariant prop', () => {
    render(<PageHeader headingVariant="display-lg">Hi, Rob</PageHeader>)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toMatch(/text-\[44px\]/)
  })
})
