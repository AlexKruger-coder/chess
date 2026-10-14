import { describe, expect, it } from 'vitest'
import { evalToBarPercent, formatEval } from './eval'
import type { AnalysisResult } from './stockfish'

describe('evalToBarPercent', () => {
  it('returns 50 for neutral eval (cp = 0)', () => {
    expect(evalToBarPercent(0)).toBe(50)
  })

  it('returns greater than 50 for positive cp', () => {
    expect(evalToBarPercent(58)).toBeGreaterThan(50)
  })

  it('returns less than 50 for negative cp', () => {
    expect(evalToBarPercent(-120)).toBeLessThan(50)
  })

  it('returns near 97.5 for mate (cp = 1000)', () => {
    expect(evalToBarPercent(1000)).toBeCloseTo(97.5, 1)
  })

  it('returns near 2.5 for negative mate (cp = -1000)', () => {
    expect(evalToBarPercent(-1000)).toBeCloseTo(2.5, 1)
  })

  it('clamps to 100 for very large positive cp', () => {
    expect(evalToBarPercent(5000)).toBe(100)
  })

  it('clamps to 0 for very large negative cp', () => {
    expect(evalToBarPercent(-5000)).toBe(0)
  })

  it('is symmetric: f(-x) = 100 - f(x)', () => {
    expect(evalToBarPercent(100)).toBeCloseTo(100 - evalToBarPercent(-100), 5)
  })
})

describe('formatEval', () => {
  it('returns "\u2014" for null', () => {
    expect(formatEval(null)).toBe('\u2014')
  })

  it('formats positive cp as "+0.58"', () => {
    const result: AnalysisResult = { cp: 58, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('+0.58')
  })

  it('formats negative cp as "-1.20"', () => {
    const result: AnalysisResult = { cp: -120, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('-1.20')
  })

  it('formats zero cp as "0.00"', () => {
    const result: AnalysisResult = { cp: 0, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('0.00')
  })

  it('formats extreme positive cp as "+10.00"', () => {
    const result: AnalysisResult = { cp: 1000, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('+10.00')
  })

  it('formats extreme negative cp as "-10.00"', () => {
    const result: AnalysisResult = { cp: -1000, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('-10.00')
  })

  it('formats positive mate as "M1"', () => {
    const result: AnalysisResult = { mate: 1000, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('M1')
  })

  it('formats negative mate as "M-1"', () => {
    const result: AnalysisResult = { mate: -1000, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('M-1')
  })

  it('returns "\u2014" when neither cp nor mate is present', () => {
    const result: AnalysisResult = { bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('\u2014')
  })

  it('formats small positive cp as "+0.07"', () => {
    const result: AnalysisResult = { cp: 7, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('+0.07')
  })

  it('formats small negative cp as "-0.01"', () => {
    const result: AnalysisResult = { cp: -1, bestMove: 'e2e4' }
    expect(formatEval(result)).toBe('-0.01')
  })
})
