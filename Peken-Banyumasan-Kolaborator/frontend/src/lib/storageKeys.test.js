import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEYS, STORAGE_PREFIXES, notifKey, STORAGE_EVENTS,
  PER_USER_STORAGE_KEYS, PER_USER_STORAGE_PREFIXES,
} from './storageKeys.js'

describe('storageKeys', () => {
  it('notifKey builds a role-scoped, peken-prefixed key', () => {
    expect(notifKey('kolaborator')).toBe('peken_notif_kolaborator')
  })

  it('all canonical keys use the peken_ prefix', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key).toMatch(/^peken_/)
    }
  })

  it('exposes frozen, immutable key maps', () => {
    expect(Object.isFrozen(STORAGE_KEYS)).toBe(true)
    expect(Object.isFrozen(STORAGE_PREFIXES)).toBe(true)
    expect(Object.isFrozen(STORAGE_EVENTS)).toBe(true)
  })

  it('logout cleanup covers the register status key and the notif prefix', () => {
    expect(PER_USER_STORAGE_KEYS).toContain(STORAGE_KEYS.REGISTER_STATUS)
    expect(PER_USER_STORAGE_PREFIXES).toContain(STORAGE_PREFIXES.NOTIF)
  })
})
