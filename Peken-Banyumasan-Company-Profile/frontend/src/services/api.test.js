import { describe, it, expect, vi, afterEach } from 'vitest'
import apiFetch from './api.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(impl) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

describe('apiFetch', () => {
  it('unwraps the { status, message, data } envelope', async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ status: 'success', message: null, data: { id: 1 } }) }))
    await expect(apiFetch('/api/public/stats')).resolves.toEqual({ id: 1 })
  })

  it('returns a top-level array unchanged (no envelope)', async () => {
    mockFetch(async () => ({ ok: true, json: async () => [1, 2, 3] }))
    await expect(apiFetch('/x')).resolves.toEqual([1, 2, 3])
  })

  it('returns an object without a `data` key unchanged', async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ foo: 'bar' }) }))
    await expect(apiFetch('/x')).resolves.toEqual({ foo: 'bar' })
  })

  it('throws the backend message on a non-OK response', async () => {
    mockFetch(async () => ({ ok: false, status: 404, json: async () => ({ message: 'Tidak ditemukan' }) }))
    await expect(apiFetch('/x')).rejects.toThrow('Tidak ditemukan')
  })

  it('throws "HTTP <status>" when the error body has no message', async () => {
    mockFetch(async () => ({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json')
      },
    }))
    await expect(apiFetch('/x')).rejects.toThrow('HTTP 500')
  })

  it('sends a JSON content-type and calls the given path', async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ data: {} }) }))
    vi.stubGlobal('fetch', f)
    await apiFetch('/api/public/stats')
    expect(f).toHaveBeenCalledTimes(1)
    // BASE_URL may be prefixed from VITE_API_URL, so assert the path is present
    // rather than an exact full URL.
    const [url, options] = f.mock.calls[0]
    expect(url).toContain('/api/public/stats')
    expect(options.headers['Content-Type']).toBe('application/json')
  })
})
