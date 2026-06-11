import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionHeader from './SectionHeader.jsx'

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Tentang Kami" />)
    expect(screen.getByText('Tentang Kami')).toBeInTheDocument()
  })

  it('renders the eyebrow when provided', () => {
    render(<SectionHeader eyebrow="SIAPA KAMI" title="Tentang Kami" />)
    expect(screen.getByText('SIAPA KAMI')).toBeInTheDocument()
  })

  it('renders the right-hand slot', () => {
    render(<SectionHeader title="Karya" right={<button>Lihat semua</button>} />)
    expect(screen.getByRole('button', { name: 'Lihat semua' })).toBeInTheDocument()
  })
})
