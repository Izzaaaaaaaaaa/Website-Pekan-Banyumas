import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the fetch wrapper so we can assert exactly which URL each endpoint hits.
vi.mock('./api.js', () => ({ default: vi.fn(() => Promise.resolve(null)) }))

import apiFetch from './api.js'
import { companyProfileApi, programsApi, karyaApi, profileApi, eventsApi, statsApi } from './endpoints.js'

beforeEach(() => {
  apiFetch.mockClear()
})

describe('public endpoints build the correct /api/public paths', () => {
  it('companyProfileApi.get encodes the section', () => {
    companyProfileApi.get('home')
    expect(apiFetch).toHaveBeenCalledWith('/api/public/company-profile?section=home')
  })

  it('programsApi.list and .detail', () => {
    programsApi.list()
    expect(apiFetch).toHaveBeenCalledWith('/api/public/programs')
    programsApi.detail('batik-2026')
    expect(apiFetch).toHaveBeenCalledWith('/api/public/programs/batik-2026')
  })

  it('karyaApi.list with and without query params', () => {
    karyaApi.list()
    expect(apiFetch).toHaveBeenCalledWith('/api/public/karya')
    karyaApi.list({ subsektor: 'Kriya' })
    expect(apiFetch).toHaveBeenCalledWith('/api/public/karya?subsektor=Kriya')
  })

  it('eventsApi.list and .upcoming', () => {
    eventsApi.list()
    expect(apiFetch).toHaveBeenCalledWith('/api/public/events')
    eventsApi.upcoming({ limit: 3 })
    expect(apiFetch).toHaveBeenCalledWith('/api/public/events/upcoming?limit=3')
  })

  it('profileApi.bySlug encodes the slug', () => {
    profileApi.bySlug('sari-dewi')
    expect(apiFetch).toHaveBeenCalledWith('/api/public/profiles/sari-dewi')
  })

  it('statsApi.public', () => {
    statsApi.public()
    expect(apiFetch).toHaveBeenCalledWith('/api/public/stats')
  })
})
