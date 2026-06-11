import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal.jsx'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false} onClose={() => {}}>hidden</Modal>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a labelled dialog with its children when open', () => {
    render(
      <Modal open onClose={() => {}} labelledBy="title">
        <h2 id="title">Judul Modal</h2>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby', 'title')
    expect(screen.getByText('Judul Modal')).toBeInTheDocument()
  })

  it('closes on the Escape key', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}><button>ok</button></Modal>)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on a backdrop click but not on an inner click', () => {
    const onClose = vi.fn()
    const { container } = render(<Modal open onClose={onClose}><button>inner</button></Modal>)
    fireEvent.click(screen.getByText('inner'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(container.querySelector('.peken-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
