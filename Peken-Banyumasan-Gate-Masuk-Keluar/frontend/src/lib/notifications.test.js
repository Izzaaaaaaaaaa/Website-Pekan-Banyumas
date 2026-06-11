import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getNotifs, addNotif, markRead, markAllRead, unreadCount, NotifType,
} from './notifications.js'
import { STORAGE_EVENTS } from './storageKeys.js'

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

describe('notification queue', () => {
  it('starts empty', () => {
    expect(getNotifs('admin')).toEqual([])
    expect(unreadCount('admin')).toBe(0)
  })

  it('addNotif prepends an unread notification + dispatches an update', () => {
    const spy = vi.fn()
    window.addEventListener(STORAGE_EVENTS.NOTIF_UPDATE, spy)
    addNotif('admin', { type: NotifType.NEW_ARTISAN_REQUEST, title: 'T', message: 'M' })
    window.removeEventListener(STORAGE_EVENTS.NOTIF_UPDATE, spy)
    expect(getNotifs('admin')).toHaveLength(1)
    expect(unreadCount('admin')).toBe(1)
    expect(spy).toHaveBeenCalled()
  })

  it('markRead + markAllRead flip read state', () => {
    const n = addNotif('admin', { type: NotifType.NEW_ARTISAN_REQUEST, title: 'A', message: 'A' })
    addNotif('admin', { type: NotifType.EVENT_REGISTER, title: 'B', message: 'B' })
    markRead('admin', n.id)
    expect(unreadCount('admin')).toBe(1)
    markAllRead('admin')
    expect(unreadCount('admin')).toBe(0)
  })

  it('isolates queues per role', () => {
    addNotif('admin', { type: NotifType.NEW_ARTISAN_REQUEST, title: 'X', message: 'X' })
    expect(getNotifs('admin')).toHaveLength(1)
    expect(getNotifs('petugas')).toHaveLength(0)
  })
})
