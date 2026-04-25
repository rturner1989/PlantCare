import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import SpaceCard from '../../src/components/SpaceCard'

// Action renders Link for to-props, so SpaceCard's onClick version only
// needs Router context when the inner Action reaches for hooks. Wrap to
// keep this future-proof without exercising routing here.
const render_ = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

const space = (overrides = {}) => ({
  id: 1,
  name: 'Living Room',
  icon: 'couch',
  plants_count: 3,
  ...overrides,
})

describe('SpaceCard', () => {
  describe('rendering', () => {
    it('shows the space name and plant count', () => {
      render_(<SpaceCard space={space()} />)
      expect(screen.getByText('Living Room')).toBeInTheDocument()
      expect(screen.getByText('3 plants')).toBeInTheDocument()
    })

    it('singularises the plant count for spaces with one plant', () => {
      render_(<SpaceCard space={space({ plants_count: 1 })} />)
      expect(screen.getByText('1 plant')).toBeInTheDocument()
    })

    it('renders the space icon tile for a known icon slug', () => {
      const { container } = render_(<SpaceCard space={space()} />)
      // FA renders an <svg> for the icon — verify one exists inside the tile.
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('omits the icon gracefully when the slug is unknown (no broken glyph)', () => {
      const { container } = render_(<SpaceCard space={space({ icon: 'garage' })} />)
      expect(container.querySelector('svg')).toBeNull()
    })
  })

  describe('attention state', () => {
    it('hides the attention badge when attentionCount is 0', () => {
      render_(<SpaceCard space={space()} attentionCount={0} />)
      expect(screen.queryByText(/thirsty/)).not.toBeInTheDocument()
    })

    it('renders a coral "N thirsty" badge when attentionCount > 0', () => {
      render_(<SpaceCard space={space()} attentionCount={2} />)
      expect(screen.getByText('2 thirsty')).toBeInTheDocument()
    })

    it('switches the card border to coral/30 when attention is present', () => {
      const { container } = render_(<SpaceCard space={space()} attentionCount={2} />)
      expect(container.firstChild.className).toContain('border-coral/30')
    })
  })

  describe('interaction', () => {
    it('fires onClick when activated', async () => {
      const onClick = vi.fn()
      render_(<SpaceCard space={space()} onClick={onClick} />)
      screen.getByRole('button').click()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('is a button, not a div — so keyboard and screen readers treat it as interactive', () => {
      render_(<SpaceCard space={space()} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
