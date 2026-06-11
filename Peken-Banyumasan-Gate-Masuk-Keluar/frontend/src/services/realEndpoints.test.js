import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the axios instance so we can assert the exact path + verb each endpoint
// method hits. extractData (real) unwraps the { data: { data } } envelope.
vi.mock('./api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}))

import apiClient from './api.js'
import {
  dashboardApi, reportsApi, eventApi, kolaboratorApi, artisanApi,
  petugasApi, companyProfileApi, zonesApi, aktivitasApi, notifikasiApi,
} from './realEndpoints.js'

beforeEach(() => {
  for (const m of ['get', 'post', 'patch', 'delete', 'put']) {
    apiClient[m].mockReset().mockResolvedValue({ data: { status: 'success', message: null, data: { ok: true } } })
  }
})

describe('dashboardApi', () => {
  it('hits the dashboard + visitor endpoints', async () => {
    await expect(dashboardApi.stats()).resolves.toEqual({ ok: true })
    expect(apiClient.get).toHaveBeenCalledWith('/api/dashboard/stats')
    await dashboardApi.visitors({ tanggal: '2026-07-01' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/visitors', { params: { tanggal: '2026-07-01' } })
    await dashboardApi.manualEntry({ aksi: 'masuk', event_id: 'e1' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/visitors/manual', { aksi: 'masuk', event_id: 'e1' })
    await dashboardApi.visitorTap({ uid: 'CARD1', timestamp: 1 })
    expect(apiClient.post).toHaveBeenCalledWith('/api/visitors/tap', { uid: 'CARD1', timestamp: 1 })
  })
})

describe('reportsApi', () => {
  it('lists, exports as a blob, and reads sub-reports', async () => {
    await reportsApi.list({ event_id: 'e1' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/reports', { params: { event_id: 'e1' } })
    await reportsApi.export({ format: 'excel' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/reports/export', { params: { format: 'excel' }, responseType: 'blob' })
    await reportsApi.artisan({ event_id: 'e1' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/reports/artisan', { params: { event_id: 'e1' } })
    await reportsApi.accumulation()
    expect(apiClient.get).toHaveBeenCalledWith('/api/reports/accumulation', { params: undefined })
  })
})

describe('eventApi', () => {
  it('covers CRUD + status', async () => {
    await eventApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/events', { params: undefined })
    await eventApi.detail('e1'); expect(apiClient.get).toHaveBeenCalledWith('/api/events/e1')
    await eventApi.create({ nama: 'X' }); expect(apiClient.post).toHaveBeenCalledWith('/api/events', { nama: 'X' })
    await eventApi.update('e1', { nama: 'Y' }); expect(apiClient.put).toHaveBeenCalledWith('/api/events/e1', { nama: 'Y' })
    await eventApi.delete('e1'); expect(apiClient.delete).toHaveBeenCalledWith('/api/events/e1')
    await eventApi.status('e1', 'published'); expect(apiClient.patch).toHaveBeenCalledWith('/api/events/e1/status', { status: 'published' })
  })

  it('covers kolaborator + artisan relations and request approvals', async () => {
    await eventApi.assignKolaborator('e1', { kolaborator_id: 'k1' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/e1/kolaborator', { kolaborator_id: 'k1' })
    await eventApi.removeKolaborator('e1', 'j1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/events/e1/kolaborator/j1')
    await eventApi.kolaboratorRequests('e1')
    expect(apiClient.get).toHaveBeenCalledWith('/api/events/e1/kolaborator-requests')
    await eventApi.respondKolaboratorRequest('e1', 'r1', { action: 'approve' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/events/e1/kolaborator-requests/r1', { action: 'approve' })
    await eventApi.assignArtisan('e1', { artisan_id: 'a1' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/e1/artisan', { artisan_id: 'a1' })
    await eventApi.respondArtisanRequest('e1', 'r2', { action: 'reject' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/events/e1/artisan-requests/r2', { action: 'reject' })
  })
})

describe('kolaboratorApi', () => {
  it('covers list / detail / status / delete', async () => {
    await kolaboratorApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/kolaborator', { params: undefined })
    await kolaboratorApi.detail('k1'); expect(apiClient.get).toHaveBeenCalledWith('/api/kolaborator/k1')
    await kolaboratorApi.status('k1', 'aktif'); expect(apiClient.patch).toHaveBeenCalledWith('/api/kolaborator/k1/status', { status: 'aktif' })
    await kolaboratorApi.delete('k1'); expect(apiClient.delete).toHaveBeenCalledWith('/api/kolaborator/k1')
  })
})

describe('artisanApi', () => {
  it('covers list / detail / status / finance read', async () => {
    await artisanApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/artisan', { params: undefined })
    await artisanApi.detail('a1'); expect(apiClient.get).toHaveBeenCalledWith('/api/artisan/a1')
    await artisanApi.status('a1', 'suspended'); expect(apiClient.patch).toHaveBeenCalledWith('/api/artisan/a1/status', { status: 'suspended' })
    await artisanApi.kas('a1', { bulan: '2026-07' }); expect(apiClient.get).toHaveBeenCalledWith('/api/artisan/a1/kas', { params: { bulan: '2026-07' } })
  })
})

describe('petugasApi', () => {
  it('covers CRUD + status + reset-password', async () => {
    await petugasApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/petugas', { params: undefined })
    await petugasApi.create({ nama: 'P' }); expect(apiClient.post).toHaveBeenCalledWith('/api/petugas', { nama: 'P' })
    await petugasApi.status('p1', 'nonaktif'); expect(apiClient.patch).toHaveBeenCalledWith('/api/petugas/p1/status', { status: 'nonaktif' })
    await petugasApi.resetPassword('p1', 'auto'); expect(apiClient.post).toHaveBeenCalledWith('/api/petugas/p1/reset-password', { mode: 'auto' })
  })
})

describe('companyProfileApi', () => {
  it('reads a section and saves content', async () => {
    await companyProfileApi.get('home')
    expect(apiClient.get).toHaveBeenCalledWith('/api/company-profile', { params: { section: 'home' } })
    await companyProfileApi.save('home', { hero: 'x' })
    expect(apiClient.put).toHaveBeenCalledWith('/api/company-profile', { section: 'home', content: { hero: 'x' } })
  })
})

describe('zonesApi', () => {
  it('manages global + per-event zones and stand assignment', async () => {
    await zonesApi.listGlobal(); expect(apiClient.get).toHaveBeenCalledWith('/api/zones')
    await zonesApi.saveGlobal([{ zona: 'A' }]); expect(apiClient.put).toHaveBeenCalledWith('/api/zones', { zones: [{ zona: 'A' }] })
    await zonesApi.listForEvent('e1'); expect(apiClient.get).toHaveBeenCalledWith('/api/events/e1/zones')
    await zonesApi.assignStand('e1', 'a1', 'A-1'); expect(apiClient.post).toHaveBeenCalledWith('/api/events/e1/artisan/a1/stand', { stand_id: 'A-1' })
  })
})

describe('aktivitasApi + notifikasiApi', () => {
  it('aktivitas list/delete', async () => {
    await aktivitasApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/aktivitas', { params: undefined })
    await aktivitasApi.delete('s1'); expect(apiClient.delete).toHaveBeenCalledWith('/api/aktivitas/s1')
  })
  it('notifikasi list/baca/bacaSemua', async () => {
    await notifikasiApi.list(); expect(apiClient.get).toHaveBeenCalledWith('/api/notifikasi')
    await notifikasiApi.baca('n1'); expect(apiClient.patch).toHaveBeenCalledWith('/api/notifikasi/n1/baca')
    await notifikasiApi.bacaSemua(); expect(apiClient.patch).toHaveBeenCalledWith('/api/notifikasi/baca-semua')
  })
})
