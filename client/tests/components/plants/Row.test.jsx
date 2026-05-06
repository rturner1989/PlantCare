import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Row from '../../../src/components/plants/Row'

function renderRow(plant) {
  return render(
    <MemoryRouter>
      <Row plant={plant} />
    </MemoryRouter>,
  )
}

const baseHealthy = {
  id: 1,
  nickname: 'Monty',
  species: { common_name: 'Monstera deliciosa' },
  water_status: 'healthy',
  feed_status: 'healthy',
  days_until_water: 5,
  days_until_feed: 14,
}

describe('Row', () => {
  it('renders nickname and species name', () => {
    renderRow(baseHealthy)
    expect(screen.getByText('Monty')).toBeInTheDocument()
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument()
  })

  it('links the row to the plant detail route', () => {
    renderRow(baseHealthy)
    expect(screen.getByRole('link', { name: /Monty/ })).toHaveAttribute('href', '/plants/1')
  })

  it('shows "In N days" when not due', () => {
    renderRow({ ...baseHealthy, days_until_water: 5, days_until_feed: 14 })
    expect(screen.getByText('In 5 days')).toBeInTheDocument()
  })

  it('shows "Due today" when zero days remain', () => {
    renderRow({ ...baseHealthy, days_until_water: 0, water_status: 'due_today' })
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('renders the overdue label as Fraunces italic em', () => {
    const overdue = {
      ...baseHealthy,
      water_status: 'overdue',
      days_until_water: -3,
    }
    renderRow(overdue)
    const label = screen.getByText('3 days overdue')
    expect(label.tagName.toLowerCase()).toBe('em')
  })

  it('applies the wilting mood class when the plant is overdue', () => {
    const { container } = renderRow({ ...baseHealthy, water_status: 'overdue', days_until_water: -2 })
    const moodDot = container.querySelector('.mood-pulse')
    expect(moodDot).toBeInTheDocument()
  })

  it('applies the thirsty mood class when due today', () => {
    const { container } = renderRow({ ...baseHealthy, water_status: 'due_today', days_until_water: 0 })
    const moodDot = container.querySelector('.ring-sunshine')
    expect(moodDot).toBeInTheDocument()
  })

  it('applies the thriving mood class when nothing is due', () => {
    const { container } = renderRow(baseHealthy)
    const moodDot = container.querySelector('.ring-leaf')
    expect(moodDot).toBeInTheDocument()
  })
})
