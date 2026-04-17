import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import { getRoomIcon } from '../../src/utils/roomIcons'

describe('getRoomIcon', () => {
  it('maps every slug in Room::ICONS (couch/kitchen/bed/bath/desk) to a FA definition', () => {
    expect(getRoomIcon('couch')).toBe(faCouch)
    expect(getRoomIcon('kitchen')).toBe(faUtensils)
    expect(getRoomIcon('bed')).toBe(faBed)
    expect(getRoomIcon('bath')).toBe(faBath)
    expect(getRoomIcon('desk')).toBe(faBriefcase)
  })

  it('returns undefined for an unknown slug (consumers treat it as "no tile")', () => {
    expect(getRoomIcon('garage')).toBeUndefined()
    expect(getRoomIcon('')).toBeUndefined()
  })

  it('returns undefined for null/undefined input (safe on partial payloads)', () => {
    expect(getRoomIcon(null)).toBeUndefined()
    expect(getRoomIcon(undefined)).toBeUndefined()
  })
})
