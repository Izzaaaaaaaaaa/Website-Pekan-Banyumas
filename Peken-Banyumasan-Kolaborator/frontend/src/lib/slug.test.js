import { describe, it, expect } from 'vitest'
import { toSlug, profileUrl } from './slug.js'

describe('toSlug', () => {
  it('lowercases and hyphenates whitespace', () => {
    expect(toSlug('Sari Dewi Rahayu')).toBe('sari-dewi-rahayu')
  })

  it('strips diacritics', () => {
    expect(toSlug('Café René')).toBe('cafe-rene')
  })

  it('collapses repeated whitespace into a single hyphen', () => {
    expect(toSlug('  Multiple   Spaces  ')).toBe('multiple-spaces')
  })

  it('removes characters outside [a-z0-9-]', () => {
    expect(toSlug('Hello@#World!')).toBe('helloworld')
  })

  it('collapses consecutive hyphens', () => {
    expect(toSlug('a--b')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(toSlug('-Leading-')).toBe('leading')
  })

  it('returns an empty string for falsy input', () => {
    expect(toSlug('')).toBe('')
    expect(toSlug(null)).toBe('')
    expect(toSlug(undefined)).toBe('')
  })
})

describe('profileUrl', () => {
  it('builds a hash route with no base', () => {
    expect(profileUrl('Sari Dewi')).toBe('/#/@sari-dewi')
  })

  it('prefixes the provided base URL', () => {
    expect(profileUrl('Sari Dewi', 'https://peken.example')).toBe('https://peken.example/#/@sari-dewi')
  })
})
