import { describe, expect, it } from 'vitest'
import { classifyMove, calculateLoss } from './classifyMove'

describe('classifyMove', () => {
  it('classifies loss at inaccuracy threshold as inaccuracy', () => {
    const result = classifyMove({
      prevEval: 50,
      postEval: 0,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('inaccuracy')
  })

  it('classifies normal move as good (no loss)', () => {
    const result = classifyMove({
      prevEval: 50,
      postEval: 50,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('good')
  })

  it('classifies blunder (loss >= 300)', () => {
    const result = classifyMove({
      prevEval: 100,
      postEval: -250,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('blunder')
  })

  it('classifies mistake (loss >= 100 but < 300)', () => {
    const result = classifyMove({
      prevEval: 100,
      postEval: -50,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('mistake')
  })

  it('improvement scenario returns good', () => {
    const result = classifyMove({
      prevEval: -100,
      postEval: 50,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('good')
  })

  it('big improvement returns brilliant', () => {
    const result = classifyMove({
      prevEval: -400,
      postEval: 100,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('brilliant')
  })

  it('mate scenario (large eval swing)', () => {
    const result = classifyMove({
      prevEval: 0,
      postEval: -1000,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('blunder')
  })

  it('calculates loss from black perspective', () => {
    const result = classifyMove({
      prevEval: 100,
      postEval: 200,
      color: 'b',
      playedUci: 'e7e5',
    })
    expect(result).toBe('mistake')
  })

  it('black move - inaccuracy', () => {
    const result = classifyMove({
      prevEval: 100,
      postEval: 180,
      color: 'b',
      playedUci: 'e7e5',
    })
    expect(result).toBe('inaccuracy')
  })

  it('best move when played equals engine best', () => {
    const result = classifyMove({
      prevEval: 50,
      postEval: 80,
      color: 'w',
      bestMoveUci: 'e2e4',
      playedUci: 'e2e4',
    })
    expect(result).toBe('best')
  })

  it('handles null prevEval', () => {
    const result = classifyMove({
      prevEval: null,
      postEval: 50,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('good')
  })

  it('handles null postEval', () => {
    const result = classifyMove({
      prevEval: 50,
      postEval: null,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('good')
  })

  it('threshold boundary: exactly 300 is blunder', () => {
    const result = classifyMove({
      prevEval: 300,
      postEval: 0,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('blunder')
  })

  it('threshold boundary: 299 is mistake', () => {
    const result = classifyMove({
      prevEval: 299,
      postEval: 0,
      color: 'w',
      playedUci: 'e2e4',
    })
    expect(result).toBe('mistake')
  })

  it('best move takes priority over good move', () => {
    const result = classifyMove({
      prevEval: 100,
      postEval: -300,
      color: 'w',
      bestMoveUci: 'e2e4',
      playedUci: 'e2e4',
    })
    expect(result).toBe('best')
  })
})

describe('calculateLoss', () => {
  it('returns 0 for null prevEval', () => {
    expect(calculateLoss(null, 50, 'w')).toBe(0)
  })

  it('returns 0 for null postEval', () => {
    expect(calculateLoss(50, null, 'w')).toBe(0)
  })

  it('calculates loss for white', () => {
    expect(calculateLoss(100, -50, 'w')).toBe(150)
  })

  it('calculates loss for black', () => {
    expect(calculateLoss(-50, 100, 'b')).toBe(150)
  })
})