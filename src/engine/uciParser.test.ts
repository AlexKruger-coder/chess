import { describe, expect, it } from 'vitest'
import {
  parseBestMove,
  parseInfoLine,
  normalizeScore,
} from './uciParser'

describe('UCI Parser', () => {
  describe('parseInfoLine', () => {
    it('парсит info строку с score cp', () => {
      const line =
        'info depth 20 seldepth 30 multipv 1 score cp 35 nodes 1234567 nps 500000 time 2469 pv e2e4 e7e5 g1f3'
      const result = parseInfoLine(line)

      expect(result).not.toBeNull()
      expect(result!.depth).toBe(20)
      expect(result!.score.cp).toBe(35)
      expect(result!.score.mate).toBeUndefined()
      expect(result!.pv).toEqual(['e2e4', 'e7e5', 'g1f3'])
    })

    it('парсит отрицательный score cp', () => {
      const line = 'info depth 15 score cp -120 pv d7d5'
      const result = parseInfoLine(line)

      expect(result).not.toBeNull()
      expect(result!.score.cp).toBe(-120)
    })

    it('парсит info строку с score mate', () => {
      const line = 'info depth 25 score mate 3 pv e1g1 a7a6 d1h5'
      const result = parseInfoLine(line)

      expect(result).not.toBeNull()
      expect(result!.score.mate).toBe(3)
      expect(result!.score.cp).toBeUndefined()
    })

    it('парсит отрицательный score mate (мат сопернику)', () => {
      const line = 'info depth 30 score mate -2 pv e8g8'
      const result = parseInfoLine(line)

      expect(result).not.toBeNull()
      expect(result!.score.mate).toBe(-2)
    })

    it('возвращает null для строк без info', () => {
      expect(parseInfoLine('bestmove e2e4')).toBeNull()
      expect(parseInfoLine('readyok')).toBeNull()
      expect(parseInfoLine('uciok')).toBeNull()
    })

    it('возвращает null для info строки без score', () => {
      expect(parseInfoLine('info depth 10 nodes 123')).toBeNull()
    })

    it('парсит info строку без pv', () => {
      const line = 'info depth 1 score cp 50'
      const result = parseInfoLine(line)
      expect(result).not.toBeNull()
      expect(result!.score.cp).toBe(50)
      expect(result!.pv).toBeUndefined()
    })

    it('игнорирует строки multipv > 1', () => {
      const line = 'info depth 10 multipv 2 score cp 150 pv e2e4'
      expect(parseInfoLine(line)).toBeNull()
    })
  })

  describe('parseBestMove', () => {
    it('парсит bestmove с ponder', () => {
      const result = parseBestMove('bestmove e2e4 ponder e7e5')
      expect(result).not.toBeNull()
      expect(result!.bestMove).toBe('e2e4')
      expect(result!.ponder).toBe('e7e5')
    })

    it('парсит bestmove без ponder', () => {
      const result = parseBestMove('bestmove d2d4')
      expect(result).not.toBeNull()
      expect(result!.bestMove).toBe('d2d4')
      expect(result!.ponder).toBeUndefined()
    })

    it('парсит bestmove (none) при мате/пате', () => {
      const result = parseBestMove('bestmove (none)')
      expect(result).not.toBeNull()
      expect(result!.bestMove).toBe('(none)')
    })

    it('возвращает null для не-bestmove строк', () => {
      expect(parseBestMove('info depth 10 score cp 50')).toBeNull()
      expect(parseBestMove('readyok')).toBeNull()
    })
  })

  describe('normalizeScore', () => {
    it('возвращает cp без изменений для хода белых', () => {
      expect(normalizeScore({ cp: 35 }, 'w')).toBe(35)
    })

    it('инвертирует cp для хода чёрных', () => {
      expect(normalizeScore({ cp: 35 }, 'b')).toBe(-35)
    })

    it('корректно обрабатывает отрицательный cp для белых', () => {
      expect(normalizeScore({ cp: -120 }, 'w')).toBe(-120)
    })

    it('инвертирует отрицательный cp для чёрных (делает положительным)', () => {
      expect(normalizeScore({ cp: -120 }, 'b')).toBe(120)
    })

    it('ограничивает cp диапазоном ±1000', () => {
      expect(normalizeScore({ cp: 1500 }, 'w')).toBe(1000)
      expect(normalizeScore({ cp: -1500 }, 'w')).toBe(-1000)
      expect(normalizeScore({ cp: 1500 }, 'b')).toBe(-1000)
    })

    it('мат за ходящего (mate > 0) = +1000 для белых', () => {
      expect(normalizeScore({ mate: 3 }, 'w')).toBe(1000)
    })

    it('мат за ходящего (mate > 0) = -1000 для чёрных (чёрные матуют)', () => {
      expect(normalizeScore({ mate: 3 }, 'b')).toBe(-1000)
    })

    it('получающий мат (mate < 0) = -1000 для белых', () => {
      expect(normalizeScore({ mate: -2 }, 'w')).toBe(-1000)
    })

    it('получающий мат (mate < 0) = +1000 для чёрных (белые матуют)', () => {
      expect(normalizeScore({ mate: -2 }, 'b')).toBe(1000)
    })

    it('возвращает 0 при отсутствии cp и mate', () => {
      expect(normalizeScore({}, 'w')).toBe(0)
    })
  })
})
