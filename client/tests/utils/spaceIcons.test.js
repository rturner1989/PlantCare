import { describe, expect, it } from 'vitest'
import { getSpaceEmoji } from '../../src/utils/spaceIcons'

describe('getSpaceEmoji', () => {
  it('maps every slug in Space::ICONS to an emoji glyph', () => {
    expect(getSpaceEmoji('couch')).toBe('🛋️')
    expect(getSpaceEmoji('kitchen')).toBe('🍽️')
    expect(getSpaceEmoji('bed')).toBe('🛏️')
    expect(getSpaceEmoji('bath')).toBe('🛁')
    expect(getSpaceEmoji('desk')).toBe('🪑')
  })

  it('returns undefined for an unknown slug (consumers treat it as "no tile")', () => {
    expect(getSpaceEmoji('garage')).toBeUndefined()
    expect(getSpaceEmoji('')).toBeUndefined()
  })

  it('returns undefined for null/undefined input (safe on partial payloads)', () => {
    expect(getSpaceEmoji(null)).toBeUndefined()
    expect(getSpaceEmoji(undefined)).toBeUndefined()
  })
})
