import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useGame } from './useGame'

describe('useGame hook', () => {
  describe('Рокировка (обе стороны)', () => {
    it('выполняет короткую рокировку (O-O) за белых', () => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('e1', 'g1')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'e1', to: 'g1' })
      expect(result.current.history).toContain('O-O')
      expect(result.current.turn).toBe('b')
      expect(result.current.fen).toContain('R4RK1') // белая ладья на f1, король на g1
    })

    it('выполняет длинную рокировку (O-O-O) за белых', () => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('e1', 'c1')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'e1', to: 'c1' })
      expect(result.current.history).toContain('O-O-O')
      expect(result.current.turn).toBe('b')
      expect(result.current.fen).toContain('2KR3R') // белая ладья на d1, король на c1
    })

    it('выполняет короткую рокировку (O-O) за чёрных', () => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('e8', 'g8')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'e8', to: 'g8' })
      expect(result.current.history).toContain('O-O')
      expect(result.current.turn).toBe('w')
      expect(result.current.fen.startsWith('r4rk1')).toBe(true)
    })

    it('выполняет длинную рокировку (O-O-O) за чёрных', () => {
      const fen = 'r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('e8', 'c8')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'e8', to: 'c8' })
      expect(result.current.history).toContain('O-O-O')
      expect(result.current.turn).toBe('w')
      expect(result.current.fen.startsWith('2kr3r')).toBe(true)
    })
  })

  describe('Взятие на проходе (En passant)', () => {
    it('выполняет взятие на проходе и удаляет сбитую пешку', () => {
      // Белая пешка на f5, чёрная только что пошла e7-e5, поле прохода e6
      const fen = 'rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('f5', 'e6')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'f5', to: 'e6' })
      expect(result.current.history[0]).toBe('fxe6')
      // Пешка на e5 должна отсутствовать, на e6 должна быть белая пешка P
      const ranks = result.current.fen.split(' ')[0].split('/')
      // 4-я горизонталь (индекс 3) должна быть пустой ('8')
      expect(ranks[3]).toBe('8')
      // 3-я горизонталь (индекс 2) содержит пешку на e6
      expect(ranks[2]).toBe('4P3')
    })
  })

  describe('Превращение пешки (Pawn promotion)', () => {
    it('определяет ход как превращение и превращает в ферзя', () => {
      const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.isPromotionMove('e7', 'e8')).toBe(true)

      let success = false
      act(() => {
        success = result.current.makeMove('e7', 'e8', 'q')
      })

      expect(success).toBe(true)
      expect(result.current.lastMove).toEqual({ from: 'e7', to: 'e8' })
      expect(result.current.history[0]).toBe('e8=Q')
      // На 8-й горизонтали теперь белый ферзь Q
      const ranks = result.current.fen.split(' ')[0].split('/')
      expect(ranks[0]).toBe('4Q3')
    })

    it('превращает пешку в коня при указании n', () => {
      const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      let success = false
      act(() => {
        success = result.current.makeMove('e7', 'e8', 'n')
      })

      expect(success).toBe(true)
      expect(result.current.history[0]).toBe('e8=N')
      const ranks = result.current.fen.split(' ')[0].split('/')
      expect(ranks[0]).toBe('4N3')
    })
  })

  describe('Мат (Checkmate)', () => {
    it('фиксирует мат после завершающего хода ладьёй по 1-й горизонтали', () => {
      const fen = '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.status).toBe('играется')
      expect(result.current.isCheckmate).toBe(false)

      let success = false
      act(() => {
        success = result.current.makeMove('e1', 'e8')
      })

      expect(success).toBe(true)
      expect(result.current.status).toBe('мат')
      expect(result.current.isCheckmate).toBe(true)
      expect(result.current.isGameOver).toBe(true)
      expect(result.current.winner).toBe('w')
    })

    it('корректно определяет мат из начальной позиции мата дурака', () => {
      const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.status).toBe('мат')
      expect(result.current.isCheckmate).toBe(true)
      expect(result.current.isGameOver).toBe(true)
      expect(result.current.winner).toBe('b')
    })
  })

  describe('Пат (Stalemate)', () => {
    it('фиксирует пат после хода, оставляющего соперника без легальных ходов без шаха', () => {
      // Белый король на g6, ферзь на f5, чёрный король на h8.
      // Ход Qf7 лишает чёрного короля ходов, не объявляя шах.
      const fen = '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.status).toBe('играется')

      let success = false
      act(() => {
        success = result.current.makeMove('f5', 'f7')
      })

      expect(success).toBe(true)
      expect(result.current.status).toBe('пат')
      expect(result.current.isStalemate).toBe(true)
      expect(result.current.isGameOver).toBe(true)
      expect(result.current.isDraw).toBe(true)
      expect(result.current.winner).toBeNull()
    })

    it('корректно определяет пат в позиции, где у чёрных уже нет ходов', () => {
      const fen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.status).toBe('пат')
      expect(result.current.isStalemate).toBe(true)
      expect(result.current.isGameOver).toBe(true)
      expect(result.current.isDraw).toBe(true)
    })
  })

  describe('Вспомогательные методы и сброс партии', () => {
    it('возвращает короля под шахом при статусе шах', () => {
      // Белый король на e1 атакован чёрным ферзём на e4
      const fen = '4k3/8/8/8/4q3/8/8/4K3 w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      expect(result.current.status).toBe('шах')
      expect(result.current.isCheck).toBe(true)
      expect(result.current.getKingSquare('w')).toBe('e1')
    })

    it('newGame сбрасывает партию в начальное положение', () => {
      const fen = '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1'
      const { result } = renderHook(() => useGame(fen))

      act(() => {
        result.current.makeMove('e1', 'e8')
      })
      expect(result.current.isCheckmate).toBe(true)

      act(() => {
        result.current.newGame()
      })

      expect(result.current.status).toBe('играется')
      expect(result.current.turn).toBe('w')
      expect(result.current.history).toHaveLength(0)
      expect(result.current.lastMove).toBeNull()
      expect(result.current.isCheckmate).toBe(false)
    })

    it('предоставляет позиции на каждом шаге партии для навигации без изменения текущей партии', () => {
      const { result } = renderHook(() => useGame())

      act(() => {
        result.current.makeMove('e2', 'e4')
        result.current.makeMove('e7', 'e5')
      })

      expect(result.current.history).toEqual(['e4', 'e5'])
      expect(result.current.verboseHistory).toHaveLength(2)

      // Начальная позиция (шаг 0)
      const step0 = result.current.getPositionAtStep(0)
      expect(step0.lastMove).toBeNull()
      expect(step0.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

      // После хода e4 (шаг 1)
      const step1 = result.current.getPositionAtStep(1)
      expect(step1.lastMove).toEqual({ from: 'e2', to: 'e4' })
      expect(step1.san).toBe('e4')
      expect(step1.fen).toContain('4P3')

      // После хода e5 (шаг 2)
      const step2 = result.current.getPositionAtStep(2)
      expect(step2.lastMove).toEqual({ from: 'e7', to: 'e5' })
      expect(step2.san).toBe('e5')
      expect(step2.fen).toBe(result.current.fen)
    })
  })
})
