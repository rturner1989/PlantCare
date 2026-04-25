import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'
import { describe, expect, it } from 'vitest'
import { getSpaceIcon } from '../../src/utils/spaceIcons'

describe('getSpaceIcon', () => {
  it('maps every slug in Space::ICONS (couch/kitchen/bed/bath/desk) to a FA definition', () => {
    expect(getSpaceIcon('couch')).toBe(faCouch)
    expect(getSpaceIcon('kitchen')).toBe(faUtensils)
    expect(getSpaceIcon('bed')).toBe(faBed)
    expect(getSpaceIcon('bath')).toBe(faBath)
    expect(getSpaceIcon('desk')).toBe(faBriefcase)
  })

  it('returns undefined for an unknown slug (consumers treat it as "no tile")', () => {
    expect(getSpaceIcon('garage')).toBeUndefined()
    expect(getSpaceIcon('')).toBeUndefined()
  })

  it('returns undefined for null/undefined input (safe on partial payloads)', () => {
    expect(getSpaceIcon(null)).toBeUndefined()
    expect(getSpaceIcon(undefined)).toBeUndefined()
  })
})
