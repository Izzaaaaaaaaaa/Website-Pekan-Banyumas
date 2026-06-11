import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the axios instance so we can assert the exact path + verb each endpoint
// method hits. extractData (real) unwraps the { data: { data } } envelope.
vi.mock('./api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}))

import apiClient from './api.js'
import { profilApi, portofolioApi, storyApi, eventApi, notifikasiApi } from './realEndpoints.js'

beforeEach(() => {
  for (const m of ['get', 'post', 'patch', 'delete', 'put']) {
    apiClient[m].mockReset().mockResolvedValue({ data: { status: 'success', message: null, data: { ok: true } } })
  }
})

describe('profilApi', () => {
  it('get → GET /api/kolaborator/me (unwrapped)', async () => {
    await expect(profilApi.get()).resolves.toEqual({ ok: true })
    expect(apiClient.get).toHaveBeenCalledWith('/api/kolaborator/me')
  })
  it('update → PATCH /api/kolaborator/me with the payload', async () => {
    await profilApi.update({ bio: 'baru' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/kolaborator/me', { bio: 'baru' })
  })
})

describe('portofolioApi', () => {
  it('list → GET, create → POST, update → PATCH, delete → DELETE', async () => {
    await portofolioApi.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/kolaborator/me/portofolio')
    await portofolioApi.create({ judul: 'K' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/kolaborator/me/portofolio', { judul: 'K' })
    await portofolioApi.update('p1', { judul: 'X' })
    expect(apiClient.patch).toHaveBeenCalledWith('/api/kolaborator/me/portofolio/p1', { judul: 'X' })
    await portofolioApi.delete('p1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/kolaborator/me/portofolio/p1')
  })
})

describe('storyApi', () => {
  it('list → GET, create → POST, delete → DELETE', async () => {
    await storyApi.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/kolaborator/me/story')
    await storyApi.create({ judul: 'C', konten: 'x' })
    expect(apiClient.post).toHaveBeenCalledWith('/api/kolaborator/me/story', { judul: 'C', konten: 'x' })
    await storyApi.delete('s1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/kolaborator/me/story/s1')
  })
})

describe('eventApi', () => {
  it('list → GET /api/events', async () => {
    await eventApi.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/events', { params: undefined })
  })
  it('detail → GET /api/events/:id', async () => {
    await eventApi.detail('e1')
    expect(apiClient.get).toHaveBeenCalledWith('/api/events/e1')
  })
  it('requestJoin → POST /api/events/:id/kolaborator-requests with peran', async () => {
    await eventApi.requestJoin('e1', 'panitia')
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/e1/kolaborator-requests', { peran: 'panitia' })
  })
  it('myRequests → GET /api/events/my-requests', async () => {
    await eventApi.myRequests()
    expect(apiClient.get).toHaveBeenCalledWith('/api/events/my-requests')
  })
})

describe('notifikasiApi', () => {
  it('list → GET, baca → PATCH /:id/baca, bacaSemua → PATCH /baca-semua', async () => {
    await notifikasiApi.list()
    expect(apiClient.get).toHaveBeenCalledWith('/api/notifikasi')
    await notifikasiApi.baca('n1')
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifikasi/n1/baca')
    await notifikasiApi.bacaSemua()
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifikasi/baca-semua')
  })
})
