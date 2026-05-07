import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Tooltip from '../../../src/components/ui/Tooltip'

describe('Tooltip', () => {
  it('renders the label inside a tooltip-role span', () => {
    render(<Tooltip>Organiser</Tooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Organiser')
  })

  it('uses the bottom placement by default', () => {
    render(<Tooltip>Bell</Tooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toMatch(/top-full/)
  })

  it('honours an alternate placement prop', () => {
    render(<Tooltip placement="right">Today</Tooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toMatch(/left-full/)
  })

  it('starts hidden via opacity-0 + reveals on group hover/focus', () => {
    render(<Tooltip>Plants</Tooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toMatch(/opacity-0/)
    expect(tooltip.className).toMatch(/group-hover:opacity-100/)
    expect(tooltip.className).toMatch(/group-focus-visible:opacity-100/)
  })

  it('disables pointer-events so it never blocks the trigger', () => {
    render(<Tooltip>Notifications</Tooltip>)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.className).toMatch(/pointer-events-none/)
  })
})
