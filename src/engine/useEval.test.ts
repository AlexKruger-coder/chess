import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalysisResult } from './stockfish'

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

import { useEval } from './useEval'

describe('useEval hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockEngineInstance.analyze.mockReset()
    mockEngineInstance.stop.mockReset()
    mockEngineInstance.destroy.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('makes a new analyze request when fen changes', async () => {
    mockEngineInstance.analyze.mockResolvedValue({ cp: 50, bestMove: 'e2e4' })

    const { rerender } = renderHook(({ fen }) => useEval(fen, 10, true), {
      initialProps: { fen: 'fen1' },
    })

    await act(async () => {
      vi.advanceTimersByTime(151)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockEngineInstance.analyze).toHaveBeenCalledWith('fen1', 10)

    await act(async () => {
      rerender({ fen: 'fen2' })
    })

    await act(async () => {
      vi.advanceTimersByTime(151)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mockEngineInstance.analyze).toHaveBeenCalledWith('fen2', 10)
    expect(mockEngineInstance.analyze).toHaveBeenCalledTimes(2)
  })

  it('ignores stale results from previous fen', async () => {
    let resolveStale: (value: AnalysisResult) => void = () => {}
    let resolveCurrent: (value: AnalysisResult) => void = () => {}

    mockEngineInstance.analyze.mockReturnValueOnce(
      new Promise<AnalysisResult>((resolve) => {
        resolveStale = resolve
      })
    )
    mockEngineInstance.analyze.mockReturnValueOnce(
      new Promise<AnalysisResult>((resolve) => {
        resolveCurrent = resolve
      })
    )

    const { result, rerender } = renderHook(({ fen }) => useEval(fen, 10, true), {
      initialProps: { fen: 'fen1' },
    })

    // Trigger first analysis (returns pending promise)
    await act(async () => {
      vi.advanceTimersByTime(151)
      await Promise.resolve()
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.result).toBe(null)

    // Change fen before first result resolves
    await act(async () => {
      rerender({ fen: 'fen2' })
    })

    // Trigger second analysis (returns pending promise)
    await act(async () => {
      vi.advanceTimersByTime(151)
      await Promise.resolve()
    })

    // Resolve stale (first) result — should be ignored
    await act(async () => {
      resolveStale({ cp: 100, bestMove: 'a2a4' })
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.result).toBe(null)
    expect(result.current.loading).toBe(true)

    // Resolve current (second) result — should update
    await act(async () => {
      resolveCurrent({ cp: 200, bestMove: 'b2b4' })
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.result).toEqual({ cp: 200, bestMove: 'b2b4' })
    expect(result.current.loading).toBe(false)
  })

  it('does not call analyze when enabled is false', () => {
    renderHook(() => useEval('fen', 10, false))

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(mockEngineInstance.analyze).not.toHaveBeenCalled()
  })
})
