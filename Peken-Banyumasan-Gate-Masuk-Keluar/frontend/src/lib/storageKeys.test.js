import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEYS, STORAGE_PREFIXES, occupiedKey, notifKey, STORAGE_EVENTS,
  PER_USER_STORAGE_KEYS, PER_USER_STORAGE_PREFIXES,
} from './storageKeys.js'

describe('storageKeys', () => {
  it('builds prefixed dynamic keys', () => {
    expect(occupiedKey('e1')).toBe('peken_occupied_e1')
    expect(notifKey('admin')).toBe('peken_notif_admin')
  })

  it('all canonical keys use the peken_ prefix', () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(key).toMatch(/^peken_/)
    }
  })

  it('exposes frozen, immutable maps', () => {
    expect(Object.isFrozen(STORAGE_KEYS)).toBe(true)
    expect(Object.isFrozen(STORAGE_PREFIXES)).toBe(true)
    expect(Object.isFrozen(STORAGE_EVENTS)).toBe(true)
  })

  it('logout cleanup covers active-event + pending-artisan + the notif prefix', () => {
    expect(PER_USER_STORAGE_KEYS).toContain(STORAGE_KEYS.ACTIVE_EVENT)
    expect(PER_USER_STORAGE_KEYS).toContain(STORAGE_KEYS.PENDING_ARTISAN)
    expect(PER_USER_STORAGE_PREFIXES).toContain(STORAGE_PREFIXES.NOTIF)
  })
})
