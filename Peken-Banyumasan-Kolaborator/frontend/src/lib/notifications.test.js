import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getNotifs, addNotif, markRead, markAllRead, unreadCount,
  triggerKolaboratorApproved, NotifType,
} from './notifications.js'
import { STORAGE_EVENTS, notifKey } from './storageKeys.js'

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
  it('starts empty for a role', () => {
    expect(getNotifs('kolaborator')).toEqual([])
    expect(unreadCount('kolaborator')).toBe(0)
  })

  it('addNotif prepends an unread notification and dispatches an update', () => {
    const spy = vi.fn()
    window.addEventListener(STORAGE_EVENTS.NOTIF_UPDATE, spy)
    const n = addNotif('kolaborator', { type: NotifType.EVENT_ASSIGNED, title: 'T', message: 'M' })
    window.removeEventListener(STORAGE_EVENTS.NOTIF_UPDATE, spy)

    const list = getNotifs('kolaborator')
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(n.id)
    expect(list[0].read).toBe(false)
    expect(list[0].icon).toBeTruthy()
    expect(unreadCount('kolaborator')).toBe(1)
    expect(spy).toHaveBeenCalled()
  })

  it('markRead flips a single notification', () => {
    const n = addNotif('kolaborator', { type: NotifType.EVENT_ASSIGNED, title: 'T', message: 'M' })
    markRead('kolaborator', n.id)
    expect(unreadCount('kolaborator')).toBe(0)
    expect(getNotifs('kolaborator')[0].read).toBe(true)
  })

  it('markAllRead flips every notification', () => {
    addNotif('kolaborator', { type: NotifType.EVENT_ASSIGNED, title: 'A', message: 'A' })
    addNotif('kolaborator', { type: NotifType.EVENT_STATUS_CHANGE, title: 'B', message: 'B' })
    expect(unreadCount('kolaborator')).toBe(2)
    markAllRead('kolaborator')
    expect(unreadCount('kolaborator')).toBe(0)
  })

  it('queues are isolated per role', () => {
    addNotif('admin', { type: NotifType.NEW_ARTISAN_REQUEST, title: 'X', message: 'X' })
    expect(getNotifs('admin')).toHaveLength(1)
    expect(getNotifs('kolaborator')).toHaveLength(0)
  })

  it('a trigger helper writes to the kolaborator queue', () => {
    triggerKolaboratorApproved('Sari')
    const list = JSON.parse(localStorage.getItem(notifKey('kolaborator')))
    expect(list[0].type).toBe(NotifType.KOLABORATOR_APPROVED)
  })
})
