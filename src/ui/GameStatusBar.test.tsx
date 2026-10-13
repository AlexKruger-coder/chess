import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameStatusBar } from './GameStatusBar'

describe('GameStatusBar', () => {
  it('отображает ход белых и статус Идёт игра', () => {
    render(
      <GameStatusBar
        turn="w"
        status="играется"
        winner={null}
        onNewGame={vi.fn()}
        orientation="white"
        onToggleOrientation={vi.fn()}
      />
    )

    expect(screen.getByText('Белые')).toBeInTheDocument()
    expect(screen.getByText(/Идёт игра/i)).toBeInTheDocument()
  })

  it('отображает статус шах', () => {
    render(
      <GameStatusBar
        turn="w"
        status="шах"
        winner={null}
        onNewGame={vi.fn()}
        orientation="white"
        onToggleOrientation={vi.fn()}
      />
    )

    expect(screen.getByText(/Шах белому королю/i)).toBeInTheDocument()
  })

  it('отображает победу при мате', () => {
    render(
      <GameStatusBar
        turn="b"
        status="мат"
        winner="w"
        onNewGame={vi.fn()}
        orientation="white"
        onToggleOrientation={vi.fn()}
      />
    )

    expect(screen.getByText(/Мат! Победили Белые/i)).toBeInTheDocument()
  })

  it('вызывает onNewGame и onToggleOrientation при клике на кнопки', () => {
    const handleNewGame = vi.fn()
    const handleToggle = vi.fn()

    render(
      <GameStatusBar
        turn="w"
        status="играется"
        winner={null}
        onNewGame={handleNewGame}
        orientation="white"
        onToggleOrientation={handleToggle}
      />
    )

    fireEvent.click(screen.getByText('Новая игра'))
    expect(handleNewGame).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Повернуть доску'))
    expect(handleToggle).toHaveBeenCalledTimes(1)
  })
})
