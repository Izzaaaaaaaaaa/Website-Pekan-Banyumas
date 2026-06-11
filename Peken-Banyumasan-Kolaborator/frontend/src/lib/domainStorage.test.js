import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readRaw, readJSON, writeRaw, writeJSON, removeKey } from './domainStorage.js'

function makeStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
}

beforeEach(() => { vi.stubGlobal('localStorage', makeStorage()) })
afterEach(() => { vi.unstubAllGlobals() })

describe('domainStorage', () => {
  it('writeRaw / readRaw round-trip', () => {
    writeRaw('peken_k_x', 'hello')
    expect(readRaw('peken_k_x')).toBe('hello')
  })

  it('readRaw returns null when the key is missing', () => {
    expect(readRaw('peken_k_missing')).toBeNull()
  })

  it('writeJSON / readJSON round-trip', () => {
    writeJSON('peken_k_obj', { a: 1, b: ['x'] })
    expect(readJSON('peken_k_obj')).toEqual({ a: 1, b: ['x'] })
  })

  it('readJSON returns null on corrupt JSON', () => {
    writeRaw('peken_k_bad', '{not json')
    expect(readJSON('peken_k_bad')).toBeNull()
  })

  it('readRaw migrates a legacy key into the canonical key, then scrubs it', () => {
    localStorage.setItem('legacy_k', 'value-from-legacy')
    expect(readRaw('peken_k_canon', 'legacy_k')).toBe('value-from-legacy')
    // migrated to canonical
    expect(localStorage.getItem('peken_k_canon')).toBe('value-from-legacy')
    // legacy removed
    expect(localStorage.getItem('legacy_k')).toBeNull()
  })

  it('removeKey deletes the canonical key', () => {
    writeRaw('peken_k_del', 'x')
    removeKey('peken_k_del')
    expect(readRaw('peken_k_del')).toBeNull()
  })
})
