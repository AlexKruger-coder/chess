import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChessClock } from './ChessClock'

describe('ChessClock', () => {
  it('отображает кнопки режимов и текущее время', () => {
    const handleModeChange = vi.fn()
    render(
      <ChessClock
        whiteTime={300}
        blackTime={300}
        turn="w"
        isRunning={false}
        mode="5+0"
        onModeChange={handleModeChange}
        timeOutWinner={null}
      />
    )

    expect(screen.getByText('3+0')).toBeInTheDocument()
    expect(screen.getByText('5+0')).toBeInTheDocument()
    expect(screen.getByText('10+0')).toBeInTheDocument()
    expect(screen.getByText('Без времени')).toBeInTheDocument()

    // Два таймера 05:00
    const timeElements = screen.getAllByText('05:00')
    expect(timeElements).toHaveLength(2)

    fireEvent.click(screen.getByText('3+0'))
    expect(handleModeChange).toHaveBeenCalledWith('3+0')
  })

  it('скрывает часы в режиме Без времени', () => {
    render(
      <ChessClock
        whiteTime={Infinity}
        blackTime={Infinity}
        turn="w"
        isRunning={false}
        mode="none"
        onModeChange={vi.fn()}
        timeOutWinner={null}
      />
    )

    expect(screen.queryByText('Белые')).not.toBeInTheDocument()
    expect(screen.queryByText('Чёрные')).not.toBeInTheDocument()
  })
})
