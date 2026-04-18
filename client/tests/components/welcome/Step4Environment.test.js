import { describe, expect, it } from 'vitest'
import { environmentFromSpecies } from '../../../src/components/welcome/Step4Environment'

// Pure mapping function from the Species payload we get off the API
// to the three-way environment levels Step 4 seeds into state. The
// mapping is intentionally loose — Species has more granular values
// than the user-facing controls (e.g. bright_direct vs bright_indirect
// both collapse to "bright") — so these tests double as living
// documentation of which species values land where.
describe('environmentFromSpecies', () => {
  describe('light', () => {
    it('collapses both direct and indirect bright species into "bright"', () => {
      expect(environmentFromSpecies({ light_requirement: 'bright_direct' }).light_level).toBe('bright')
      expect(environmentFromSpecies({ light_requirement: 'bright_indirect' }).light_level).toBe('bright')
    })

    it('maps low-light species to "low"', () => {
      expect(environmentFromSpecies({ light_requirement: 'low' }).light_level).toBe('low')
    })

    it('maps tolerant ranges ("low_to_bright") to "medium" so the user gets a neutral start', () => {
      expect(environmentFromSpecies({ light_requirement: 'low_to_bright' }).light_level).toBe('medium')
      expect(environmentFromSpecies({ light_requirement: 'low_to_bright_indirect' }).light_level).toBe('medium')
    })

    it('falls back to "medium" for unknown or missing light values', () => {
      expect(environmentFromSpecies({ light_requirement: 'wat' }).light_level).toBe('medium')
      expect(environmentFromSpecies({}).light_level).toBe('medium')
      expect(environmentFromSpecies(null).light_level).toBe('medium')
      expect(environmentFromSpecies(undefined).light_level).toBe('medium')
    })
  })

  describe('humidity', () => {
    it('maps high/low/average preferences to humid/dry/average levels', () => {
      expect(environmentFromSpecies({ humidity_preference: 'high' }).humidity_level).toBe('humid')
      expect(environmentFromSpecies({ humidity_preference: 'low' }).humidity_level).toBe('dry')
      expect(environmentFromSpecies({ humidity_preference: 'average' }).humidity_level).toBe('average')
    })

    it('falls back to "average" for unknown or missing humidity values', () => {
      expect(environmentFromSpecies({ humidity_preference: 'wat' }).humidity_level).toBe('average')
      expect(environmentFromSpecies({}).humidity_level).toBe('average')
      expect(environmentFromSpecies(null).humidity_level).toBe('average')
    })
  })

  describe('temperature', () => {
    it('always defaults to "average" regardless of species', () => {
      // Species.temperature_min/max are hardiness ranges (what the
      // plant tolerates), not ideal spot temperatures — they don't
      // map onto the user's cool/average/warm scale. Neutral default
      // is the honest answer.
      expect(environmentFromSpecies({ temperature_min: 5, temperature_max: 35 }).temperature_level).toBe('average')
      expect(environmentFromSpecies(null).temperature_level).toBe('average')
    })
  })

  describe('combined payload', () => {
    it('returns all three fields in a single object ready for useState initialisation', () => {
      const env = environmentFromSpecies({
        light_requirement: 'bright_indirect',
        humidity_preference: 'high',
        temperature_min: 15,
        temperature_max: 25,
      })
      expect(env).toEqual({
        light_level: 'bright',
        temperature_level: 'average',
        humidity_level: 'humid',
      })
    })
  })
})
