import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MoveHistory } from './MoveHistory'

describe('MoveHistory', () => {
  it('отображает сообщение при пустой истории', () => {
    render(<MoveHistory history={[]} />)
    expect(screen.getByText('Ходов пока нет')).toBeInTheDocument()
  })

  it('отображает список пар ходов', () => {
    render(<MoveHistory history={['e4', 'e5', 'Nf3', 'Nc6']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
    expect(screen.getByText('e5')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
    expect(screen.getByText('Nc6')).toBeInTheDocument()
  })
})
