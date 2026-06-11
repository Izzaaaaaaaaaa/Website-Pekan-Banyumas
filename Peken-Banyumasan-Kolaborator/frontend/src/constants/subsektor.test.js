import { describe, it, expect } from 'vitest'
import { SUBSEKTOR } from './subsektor.js'

describe('SUBSEKTOR (BEKRAF 17)', () => {
  it('lists the 17 canonical creative subsektor', () => {
    expect(SUBSEKTOR).toHaveLength(17)
  })

  it('includes representative entries', () => {
    for (const s of ['Kuliner', 'Kriya', 'Fashion', 'Seni Rupa', 'Game']) {
      expect(SUBSEKTOR).toContain(s)
    }
  })

  it('ends with the "Lainnya" escape option', () => {
    expect(SUBSEKTOR.at(-1)).toBe('Lainnya')
  })

  it('has no duplicate entries', () => {
    expect(new Set(SUBSEKTOR).size).toBe(SUBSEKTOR.length)
  })
})
