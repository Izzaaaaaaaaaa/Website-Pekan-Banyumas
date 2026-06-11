import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast.jsx'

// A tiny consumer that drives the ToastProvider API from inside the tree.
function Harness() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Berhasil disimpan')}>fire-success</button>
      <button onClick={() => toast.error('Gagal menyimpan')}>fire-error</button>
    </>
  )
}

describe('Toast', () => {
  it('shows a success toast when the API is called', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire-success'))
    expect(screen.getByText('Berhasil disimpan')).toBeInTheDocument()
  })

  it('shows the message passed to the error variant', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire-error'))
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument()
  })

  it('auto-dismisses the toast after 4 seconds', () => {
    vi.useFakeTimers()
    try {
      render(
        <ToastProvider>
          <Harness />
        </ToastProvider>
      )
      fireEvent.click(screen.getByText('fire-success'))
      expect(screen.getByText('Berhasil disimpan')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(4000)
      })
      expect(screen.queryByText('Berhasil disimpan')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
