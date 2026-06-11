import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PillButton from './PillButton.jsx'

describe('PillButton', () => {
  it('renders its children as the label', () => {
    render(<PillButton>Daftar</PillButton>)
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<PillButton onClick={onClick}>Go</PillButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses ariaLabel as the accessible name when provided', () => {
    render(<PillButton ariaLabel="Buka login">Login</PillButton>)
    expect(screen.getByRole('button', { name: 'Buka login' })).toBeInTheDocument()
  })

  it('defaults the type attribute to "button"', () => {
    render(<PillButton>X</PillButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
