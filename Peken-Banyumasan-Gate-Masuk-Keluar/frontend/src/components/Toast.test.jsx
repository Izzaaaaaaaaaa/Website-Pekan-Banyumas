import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast.jsx'

function Harness() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Tersimpan')}>fire-success</button>
      <button onClick={() => toast.error('Gagal')}>fire-error</button>
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
    expect(screen.getByText('Tersimpan')).toBeInTheDocument()
  })

  it('shows the message passed to the error variant', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('fire-error'))
    expect(screen.getByText('Gagal')).toBeInTheDocument()
  })

  it('auto-dismisses a success toast after its 3.5s duration', () => {
    vi.useFakeTimers()
    try {
      render(
        <ToastProvider>
          <Harness />
        </ToastProvider>
      )
      fireEvent.click(screen.getByText('fire-success'))
      expect(screen.getByText('Tersimpan')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3500)
      })
      expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
