import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getToken, setToken, getUser, setUser, clearAuth,
  isAuthenticated, getUserRole, hasRole,
} from './auth.js'
import { STORAGE_EVENTS, STORAGE_KEYS, notifKey } from './storageKeys.js'

// jsdom's localStorage shim lacks a working clear(); use a clean in-memory
// Storage per test so auth state never leaks between cases.
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

describe('token', () => {
  it('round-trips a token and reports authenticated', () => {
    setToken('jwt-abc')
    expect(getToken()).toBe('jwt-abc')
    expect(isAuthenticated()).toBe(true)
  })

  it('clears on null or empty and reports unauthenticated', () => {
    setToken('x'); setToken(null)
    expect(getToken()).toBeNull()
    setToken('y'); setToken('')
    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})

describe('user', () => {
  it('round-trips a parsed user object', () => {
    setUser({ id: '1', role: 'kolaborator', status: 'aktif' })
    expect(getUser()).toEqual({ id: '1', role: 'kolaborator', status: 'aktif' })
  })

  it('returns null when absent', () => {
    expect(getUser()).toBeNull()
  })

  it('returns null on corrupt JSON instead of throwing', () => {
    localStorage.setItem('user', '{not valid json')
    expect(getUser()).toBeNull()
  })

  it('setUser(null) removes the stored user', () => {
    setUser({ id: '1' })
    setUser(null)
    expect(getUser()).toBeNull()
  })

  it('dispatches USER_UPDATE on write', () => {
    const spy = vi.fn()
    window.addEventListener(STORAGE_EVENTS.USER_UPDATE, spy)
    setUser({ id: '1', role: 'kolaborator' })
    expect(spy).toHaveBeenCalledTimes(1)
    window.removeEventListener(STORAGE_EVENTS.USER_UPDATE, spy)
  })
})

describe('role helpers', () => {
  it('getUserRole reads the role', () => {
    setUser({ id: '1', role: 'kolaborator' })
    expect(getUserRole()).toBe('kolaborator')
  })

  it('getUserRole is null when no user', () => {
    expect(getUserRole()).toBeNull()
  })

  it('hasRole compares exactly', () => {
    setUser({ role: 'kolaborator' })
    expect(hasRole('kolaborator')).toBe(true)
    expect(hasRole('admin')).toBe(false)
  })
})

describe('clearAuth', () => {
  it('removes token, user, and per-user keys, and broadcasts null', () => {
    setToken('t')
    setUser({ id: '1', role: 'kolaborator' })
    localStorage.setItem(STORAGE_KEYS.REGISTER_STATUS, 'pending')
    localStorage.setItem(notifKey('kolaborator'), '[]')

    const spy = vi.fn()
    window.addEventListener(STORAGE_EVENTS.USER_UPDATE, spy)
    clearAuth()
    window.removeEventListener(STORAGE_EVENTS.USER_UPDATE, spy)

    expect(getToken()).toBeNull()
    expect(getUser()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.REGISTER_STATUS)).toBeNull()
    expect(localStorage.getItem(notifKey('kolaborator'))).toBeNull()
    expect(spy).toHaveBeenCalled()
  })
})
