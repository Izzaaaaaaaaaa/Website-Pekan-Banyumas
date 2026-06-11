import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from './ConfirmDialog.jsx'

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog isOpen={false} message="anything" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the title, message, and default labels when open', () => {
    render(<ConfirmDialog isOpen message="Hapus item ini?" />)
    expect(screen.getByText('Konfirmasi')).toBeInTheDocument()
    expect(screen.getByText('Hapus item ini?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya, Lanjutkan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog isOpen message="x" confirmLabel="Hapus" onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog isOpen message="x" onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders a custom title', () => {
    render(<ConfirmDialog isOpen title="Nonaktifkan akun" message="x" />)
    expect(screen.getByText('Nonaktifkan akun')).toBeInTheDocument()
  })
})
