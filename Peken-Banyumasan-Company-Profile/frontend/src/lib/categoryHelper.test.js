import { describe, it, expect } from 'vitest'
import { getCategory } from './categoryHelper.js'

describe('getCategory', () => {
  it('resolves an artisan (by role) to kategori_usaha', () => {
    expect(getCategory({ role: 'artisan', kategori_usaha: ['Kuliner', 'Kriya'] })).toEqual({
      key: 'kategori_usaha',
      label: 'Kategori Usaha',
      values: ['Kuliner', 'Kriya'],
    })
  })

  it('resolves an artisan (by owner_type) to kategori_usaha', () => {
    expect(getCategory({ owner_type: 'artisan', kategori_usaha: ['F&B'] }).key).toBe('kategori_usaha')
  })

  it('resolves a kolaborator to subsektor', () => {
    const r = getCategory({ role: 'kolaborator', subsektor: ['Musik'] })
    expect(r.key).toBe('subsektor')
    expect(r.label).toBe('Subsektor')
    expect(r.values).toEqual(['Musik'])
  })

  it('normalises a single string to an array (karya carries a string)', () => {
    expect(getCategory({ owner_type: 'kolaborator', subsektor: 'Fashion' }).values).toEqual(['Fashion'])
  })

  it('returns empty values when the field is absent or entity is null', () => {
    expect(getCategory({ role: 'kolaborator' }).values).toEqual([])
    expect(getCategory(null).values).toEqual([])
  })

  it('falls back to the other field when the primary one is missing', () => {
    expect(getCategory({ role: 'artisan', subsektor: ['X'] }).values).toEqual(['X'])
  })
})
