import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RoomCard from '../../../../src/components/spaces/rooms/RoomCard'

const baseProps = {
  icon: '🛋️',
  name: 'Living Room',
  count: '3 plants · indoor',
}

describe('RoomCard', () => {
  it('renders the icon, name, and count', () => {
    render(<RoomCard {...baseProps} />)
    expect(screen.getByText('🛋️')).toBeInTheDocument()
    expect(screen.getByText('Living Room')).toBeInTheDocument()
    expect(screen.getByText('3 plants · indoor')).toBeInTheDocument()
  })

  it('renders the peek strip up to 3 plants and a +N more chip beyond', () => {
    const peek = [
      { id: 1, species: { common_name: 'A' }, urgent: false },
      { id: 2, species: { common_name: 'B' }, urgent: false },
      { id: 3, species: { common_name: 'C' }, urgent: false },
      { id: 4, species: { common_name: 'D' }, urgent: false },
      { id: 5, species: { common_name: 'E' }, urgent: false },
    ]
    render(<RoomCard {...baseProps} peek={peek} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('omits the +N more chip when peek length is at or below the limit', () => {
    const peek = [
      { id: 1, species: { common_name: 'A' } },
      { id: 2, species: { common_name: 'B' } },
      { id: 3, species: { common_name: 'C' } },
    ]
    render(<RoomCard {...baseProps} peek={peek} />)
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument()
  })

  it('renders the next-care label as overdue (Fraunces italic) when overdue is true', () => {
    render(<RoomCard {...baseProps} nextCare={{ icon: '💧', label: 'Monty · 3 days overdue', overdue: true }} />)
    const overdue = screen.getByText('Monty · 3 days overdue')
    expect(overdue.tagName.toLowerCase()).toBe('em')
  })

  it('renders the next-care label as plain text when not overdue', () => {
    render(<RoomCard {...baseProps} nextCare={{ icon: '💧', label: 'Basil · in 5d', overdue: false }} />)
    const label = screen.getByText('Basil · in 5d')
    expect(label.tagName.toLowerCase()).not.toBe('em')
  })

  it('renders the env hint row when envHint is provided', () => {
    render(<RoomCard {...baseProps} envHint="Bright · average humidity" />)
    expect(screen.getByText('Bright · average humidity')).toBeInTheDocument()
  })

  it('omits both summary rows when neither nextCare nor envHint is provided', () => {
    render(<RoomCard {...baseProps} />)
    expect(screen.queryByText(/humidity/i)).not.toBeInTheDocument()
  })

  it('renders as display-only — no button role on the card itself', () => {
    render(<RoomCard {...baseProps} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the weather pill instead of the env hint when weatherPill is provided', () => {
    render(
      <RoomCard
        {...baseProps}
        envHint="Bright · average humidity"
        weatherPill={{ icon: '🌧', label: 'Rain Sun · skip water', scheme: 'rain' }}
      />,
    )
    expect(screen.getByText('Rain Sun · skip water')).toBeInTheDocument()
    expect(screen.queryByText('Bright · average humidity')).not.toBeInTheDocument()
  })
})
