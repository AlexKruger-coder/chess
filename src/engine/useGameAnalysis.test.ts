import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Chess } from 'chess.js'
import type { UseGameReturn } from '../game'
import { computePlayerStats } from '../ui/GameAnalysisScreen'

const { mockEngineInstance } = vi.hoisted(() => ({
  mockEngineInstance: {
    analyze: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
  },
}))

vi.mock('./stockfish', () => {
  class MockStockfishEngine {
    analyze = mockEngineInstance.analyze
    stop = mockEngineInstance.stop
    destroy = mockEngineInstance.destroy
  }
  return { StockfishEngine: MockStockfishEngine }
})

import { useGameAnalysis } from './useGameAnalysis'

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

describe('useGameAnalysis', () => {
  beforeEach(() => {
    mockEngineInstance.analyze.mockReset()
    mockEngineInstance.stop.mockReset()
    mockEngineInstance.destroy.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('оценивает позицию с mate: -1 как -1000, классифицирует 2.g4 как blunder и отмечает ?? в сводке белых', async () => {
    // Партия: 1.f4 e5 2.g4 Qh4#
    const game = createMockGame(['f4', 'e5', 'g4', 'Qh4#'])

    // Мок возвращает { mate: -1 } для позиции после 1.f4 e5 2.g4 (ходят чёрные)
    const fenAfterG4 = game.getPositionAtStep(3).fen
    expect(fenAfterG4).toContain('b KQkq')

    mockEngineInstance.analyze.mockImplementation(async (fen: string) => {
      if (fen === fenAfterG4) {
        return { mate: -1, bestMove: 'd8h4' }
      }
      return { cp: 0, bestMove: 'e2e4' }
    })

    let hookResult: any
    await act(async () => {
      hookResult = renderHook(() => useGameAnalysis(game, true, 12))
    })

    await vi.waitFor(
      () => {
        expect(hookResult.result.current.isAnalyzing).toBe(false)
        expect(hookResult.result.current.results.length).toBeGreaterThan(0)
      },
      { timeout: 3000 }
    )

    const result = hookResult.result

    // Шаг 3 — это ход 2.g4 белых
    const moveG4 = result.current.results[3]
    expect(moveG4).toBeDefined()
    expect(moveG4.san).toBe('g4')
    expect(moveG4.color).toBe('w')

    // eval шага = -1000
    expect(moveG4.postEval).toBe(-1000)

    // classifyMove для 2.g4 = blunder
    expect(moveG4.classification).toBe('blunder')

    // В сводке белых "??" = 1
    const whiteStats = computePlayerStats(result.current.results, 'w')
    expect(whiteStats.blunders).toBe(1)
  })
})
