import { describe, it, expect } from 'vitest'
import { KOTA_LIST } from './kotaList.js'

describe('KOTA_LIST', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(KOTA_LIST)).toBe(true)
    expect(KOTA_LIST.length).toBeGreaterThan(0)
    expect(KOTA_LIST.every((k) => typeof k === 'string' && k.length > 0)).toBe(true)
  })

  it('covers the eks-Karesidenan Banyumas regencies', () => {
    for (const kota of ['Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara']) {
      expect(KOTA_LIST).toContain(kota)
    }
  })

  it('offers an "Lainnya" escape option as the last entry', () => {
    expect(KOTA_LIST).toContain('Lainnya')
    expect(KOTA_LIST[KOTA_LIST.length - 1]).toBe('Lainnya')
  })

  it('has no duplicate entries', () => {
    expect(new Set(KOTA_LIST).size).toBe(KOTA_LIST.length)
  })
})
