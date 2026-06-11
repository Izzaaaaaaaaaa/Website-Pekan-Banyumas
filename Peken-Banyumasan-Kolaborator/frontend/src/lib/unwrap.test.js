import { describe, it, expect } from 'vitest'
import { extractData, extractMessage, extractError } from './unwrap.js'

describe('extractData', () => {
  it('unwraps the { status, message, data } envelope', () => {
    const res = { data: { status: 'success', message: null, data: { id: 1, nama: 'Sari' } } }
    expect(extractData(res)).toEqual({ id: 1, nama: 'Sari' })
  })

  it('returns a top-level array unchanged (no envelope)', () => {
    expect(extractData({ data: [1, 2, 3] })).toEqual([1, 2, 3])
  })

  it('returns a plain object without a `data` key unchanged', () => {
    expect(extractData({ data: { foo: 'bar' } })).toEqual({ foo: 'bar' })
  })

  it('returns primitive bodies unchanged', () => {
    expect(extractData({ data: 'hello' })).toBe('hello')
  })

  it('passes Blob bodies through untouched', () => {
    const blob = new Blob(['file-content'])
    expect(extractData({ data: blob })).toBe(blob)
  })

  it('returns null when the response is missing', () => {
    expect(extractData(null)).toBeNull()
    expect(extractData(undefined)).toBeNull()
  })
})

describe('extractMessage', () => {
  it('returns the envelope message when present', () => {
    expect(extractMessage({ data: { message: 'Berhasil disimpan' } })).toBe('Berhasil disimpan')
  })

  it('falls back when the message is empty or whitespace', () => {
    expect(extractMessage({ data: { message: '   ' } }, 'fallback')).toBe('fallback')
  })

  it('falls back when the response is missing', () => {
    expect(extractMessage(null, 'fallback')).toBe('fallback')
  })
})

describe('extractError', () => {
  it('prefers the backend envelope message', () => {
    const err = { response: { data: { message: 'Email atau password salah' } } }
    expect(extractError(err)).toBe('Email atau password salah')
  })

  it('detects a network error via err.request (no response)', () => {
    expect(extractError({ request: {} })).toBe(
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    )
  })

  it('detects a network error via an axios error code', () => {
    expect(extractError({ code: 'ERR_NETWORK' })).toBe(
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    )
  })

  it("skips axios's 'Request failed with status code N' boilerplate", () => {
    const err = { message: 'Request failed with status code 404' }
    expect(extractError(err)).toBe('Terjadi kesalahan. Silakan coba lagi.')
  })

  it('returns a real error message as-is', () => {
    expect(extractError({ message: 'Kuota habis' })).toBe('Kuota habis')
  })

  it('uses the caller-supplied fallback when nothing usable is present', () => {
    expect(extractError({}, 'Coba lagi nanti')).toBe('Coba lagi nanti')
  })
})
