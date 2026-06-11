import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getZoneStats,
  DEFAULT_GLOBAL_ZONES,
  ZONE_TEMPLATES,
  addZone,
  addStands,
  removeZone,
  getGlobalZones,
  getEventZones,
  syncOccupiedFromArtisans,
  resetToTemplate,
} from './eventZones.js'

describe('getZoneStats', () => {
  it('counts total / occupied / available across zones', () => {
    const zones = [
      { stands: [{ occupied: true }, { occupied: false }, { occupied: true }] },
      { stands: [{ occupied: false }] },
    ]
    expect(getZoneStats(zones)).toEqual({ total: 4, occupied: 2, available: 2 })
  })

  it('returns zeros for an empty layout', () => {
    expect(getZoneStats([])).toEqual({ total: 0, occupied: 0, available: 0 })
  })
})

describe('DEFAULT_GLOBAL_ZONES', () => {
  it('defines the four venue zones with the expected stand counts', () => {
    expect(DEFAULT_GLOBAL_ZONES.map((z) => z.zona)).toEqual(['A', 'B', 'C', 'P'])
    const counts = Object.fromEntries(DEFAULT_GLOBAL_ZONES.map((z) => [z.zona, z.stands.length]))
    expect(counts).toEqual({ A: 8, B: 10, C: 4, P: 2 })
  })
})

describe('ZONE_TEMPLATES', () => {
  it('exposes festival / workshop / bazaar presets', () => {
    expect(Object.keys(ZONE_TEMPLATES)).toEqual(['festival', 'workshop', 'bazaar'])
    expect(ZONE_TEMPLATES.workshop.map((z) => z.zona)).toEqual(['R', 'L'])
  })
})

describe('localStorage-backed operations', () => {
  // jsdom's localStorage shim lacks clear(); use a clean in-memory Storage.
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

  it('addZone rejects a duplicate zona code', () => {
    expect(() => addZone('A', 'Duplikat', '#000', 4)).toThrow(/sudah ada/)
  })

  it('addZone appends a new zone with sequential stand ids (uppercased)', () => {
    const updated = addZone('x', 'Zona X', '#111', 3)
    const x = updated.find((z) => z.zona === 'X')
    expect(x.stands.map((s) => s.id)).toEqual(['X-1', 'X-2', 'X-3'])
  })

  it('addStands continues the numbering on an existing zone', () => {
    const updated = addStands('C', 2) // default C has C-1..C-4
    const c = updated.find((z) => z.zona === 'C')
    expect(c.stands.map((s) => s.id)).toEqual(['C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6'])
  })

  it('removeZone drops the zone from the layout', () => {
    expect(removeZone('B').find((z) => z.zona === 'B')).toBeUndefined()
  })

  it('resetToTemplate swaps the global layout to the chosen preset', () => {
    const zones = resetToTemplate('workshop')
    expect(zones.map((z) => z.zona)).toEqual(['R', 'L'])
    // and it persists
    expect(getGlobalZones().map((z) => z.zona)).toEqual(['R', 'L'])
  })

  it('getEventZones starts with every stand unoccupied', () => {
    const zones = getEventZones('evt-1')
    expect(getZoneStats(zones)).toEqual({ total: 24, occupied: 0, available: 24 })
  })

  it('syncOccupiedFromArtisans marks the artisans\' stands occupied', () => {
    syncOccupiedFromArtisans('evt-1', [{ posisi_event: 'A-1' }, { posisi_event: 'B-2' }])
    const zones = getEventZones('evt-1')
    expect(getZoneStats(zones).occupied).toBe(2)
    const a1 = zones.find((z) => z.zona === 'A').stands.find((s) => s.id === 'A-1')
    expect(a1.occupied).toBe(true)
  })
})
