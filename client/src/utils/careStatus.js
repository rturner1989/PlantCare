import { pluralize } from './pluralize'

export function getDaysDisplay(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) return null

  if (daysUntil < 0) {
    return `${pluralize(Math.abs(daysUntil), 'day')} overdue`
  }
  if (daysUntil === 0) return 'Due today'
  return `In ${pluralize(daysUntil, 'day')}`
}
