import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chess } from 'chess.js'
import { GameAnalysisScreen } from './GameAnalysisScreen'
import type { UseGameReturn } from '../game'
import type { UseGameAnalysisResult } from '../engine'

function createMockGame(moves: string[]): UseGameReturn {
  const chess = new Chess()
  const history: string[] = []
  const verboseHistory: any[] = []
  const positions: string[] = [chess.fen()]

  for (const moveSan of moves) {
    const move = chess.move(moveSan)
    history.push(move.san)
    verboseHistory.push(move)
    positions.push(chess.fen())
  }

  return {
    fen: chess.fen(),
    turn: chess.turn(),
    history,
    verboseHistory,
    isGameOver: chess.isGameOver(),
    status: chess.isCheckmate() ? 'мат' : 'в процессе',
    winner: chess.isCheckmate() ? (chess.turn() === 'w' ? 'b' : 'w') : null,
    lastMove: verboseHistory[verboseHistory.length - 1] ?? null,
    makeMove: vi.fn(),
    newGame: vi.fn(),
    getPositionAtStep: (step: number) => ({
      fen: positions[step] ?? chess.fen(),
      lastMove: step > 0 ? verboseHistory[step - 1] : null,
      turn: step % 2 === 0 ? 'w' : 'b',
    }),
  } as unknown as UseGameReturn
}

describe('GameAnalysisScreen', () => {
  it('первый рендер экрана уже содержит слот прогресса, карточки с "—" и подпись "Анализ…"', () => {
    const game = createMockGame(['f4', 'e5', 'g4', 'Qh4#'])

    const analyzingState: UseGameAnalysisResult = {
      results: [],
      progress: { current: 0, total: 5 },
      loading: true,
      error: null,
      isAnalyzing: true,
    }

    render(
      <GameAnalysisScreen
        game={game}
        analysis={analyzingState}
        onBack={vi.fn()}
      />
    )

    // 1. Первый рендер экрана уже содержит слот прогресса
    const progressSlot = screen.getByTestId('progress-slot')
    expect(progressSlot).toBeInTheDocument()

    // 2. Внутри слота уже присутствует контейнер прогресса с русским текстом "Анализ партии…"
    expect(screen.getByText(/Анализ партии… 0 из 5/i)).toBeInTheDocument()

    // 3. Подпись под доской во время анализа — "Анализ…"
    expect(screen.getByText('Анализ…')).toBeInTheDocument()

    // 4. Карточки точности на первом рендере показывают "—"
    const dashElements = screen.getAllByText('—')
    expect(dashElements.length).toBeGreaterThanOrEqual(2)
  })
})
