import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatClockTime, useClock, type UseClockOptions } from './useClock'

describe('useClock hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('инициализирует правильное время для каждого режима', () => {
    const { result: r5 } = renderHook(() =>
      useClock({
        initialMode: '5+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )
    expect(r5.current.whiteTime).toBe(300)
    expect(r5.current.blackTime).toBe(300)

    const { result: r3 } = renderHook(() =>
      useClock({
        initialMode: '3+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )
    expect(r3.current.whiteTime).toBe(180)
    expect(r3.current.blackTime).toBe(180)

    const { result: r10 } = renderHook(() =>
      useClock({
        initialMode: '10+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )
    expect(r10.current.whiteTime).toBe(600)
    expect(r10.current.blackTime).toBe(600)

    const { result: rNone } = renderHook(() =>
      useClock({
        initialMode: 'none',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )
    expect(rNone.current.whiteTime).toBe(Infinity)
    expect(rNone.current.blackTime).toBe(Infinity)
    expect(rNone.current.isRunning).toBe(false)
  })

  it('не запускает часы до первого хода белых (moveCount = 0)', () => {
    const { result } = renderHook(() =>
      useClock({
        initialMode: '5+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )

    expect(result.current.isRunning).toBe(false)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.whiteTime).toBe(300)
    expect(result.current.blackTime).toBe(300)
  })

  it('запускает часы после первого хода белых и тикает время у того, чей ход', () => {
    // После 1-го хода белых ход перешёл к чёрным (turn = 'b', moveCount = 1)
    const { result, rerender } = renderHook(
      (props) => useClock(props),
      {
        initialProps: {
          initialMode: '5+0',
          turn: 'b',
          isGameOver: false,
          moveCount: 1,
        } as UseClockOptions,
      }
    )

    expect(result.current.isRunning).toBe(true)

    // Чёрные думают 3 секунды
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.whiteTime).toBe(300)
    expect(result.current.blackTime).toBe(297)

    // Чёрные сделали ход, теперь ход белых (turn = 'w', moveCount = 2)
    rerender({
      initialMode: '5+0',
      turn: 'w',
      isGameOver: false,
      moveCount: 2,
    })

    // Белые думают 4 секунды
    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.whiteTime).toBe(296)
    expect(result.current.blackTime).toBe(297)
  })

  it('фиксирует проигрыш по времени, когда время белых падает до 0', () => {
    const onTimeout = vi.fn()
    const { result } = renderHook(() =>
      useClock({
        initialMode: '3+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 2,
        onTimeout,
      })
    )

    // 180 секунд истекают
    act(() => {
      vi.advanceTimersByTime(180000)
    })

    expect(result.current.whiteTime).toBe(0)
    expect(result.current.timeOutLoser).toBe('w')
    expect(result.current.timeOutWinner).toBe('b')
    expect(result.current.isRunning).toBe(false)
    expect(onTimeout).toHaveBeenCalledWith('w')
  })

  it('фиксирует проигрыш по времени, когда время чёрных падает до 0', () => {
    const onTimeout = vi.fn()
    const { result } = renderHook(() =>
      useClock({
        initialMode: '3+0',
        turn: 'b',
        isGameOver: false,
        moveCount: 1,
        onTimeout,
      })
    )

    // 180 секунд истекают
    act(() => {
      vi.advanceTimersByTime(180000)
    })

    expect(result.current.blackTime).toBe(0)
    expect(result.current.timeOutLoser).toBe('b')
    expect(result.current.timeOutWinner).toBe('w')
    expect(result.current.isRunning).toBe(false)
    expect(onTimeout).toHaveBeenCalledWith('b')
  })

  it('останавливает часы при завершении партии (isGameOver = true)', () => {
    const { result, rerender } = renderHook(
      (props) => useClock(props),
      {
        initialProps: {
          initialMode: '5+0' as const,
          turn: 'w' as const,
          isGameOver: false,
          moveCount: 2,
        },
      }
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.whiteTime).toBe(295)

    // Партия завершилась (мат, пат или ничья)
    rerender({
      initialMode: '5+0',
      turn: 'w',
      isGameOver: true,
      moveCount: 2,
    })

    expect(result.current.isRunning).toBe(false)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // Время не изменилось
    expect(result.current.whiteTime).toBe(295)
  })

  it('сбрасывает часы при вызове reset()', () => {
    const { result } = renderHook(() =>
      useClock({
        initialMode: '3+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 2,
      })
    )

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(result.current.whiteTime).toBe(170)

    act(() => {
      result.current.reset()
    })

    expect(result.current.whiteTime).toBe(180)
    expect(result.current.blackTime).toBe(180)
    expect(result.current.timeOutWinner).toBeNull()
  })

  it('переключает режим через setMode() и сбрасывает таймеры', () => {
    const { result } = renderHook(() =>
      useClock({
        initialMode: '5+0',
        turn: 'w',
        isGameOver: false,
        moveCount: 0,
      })
    )

    act(() => {
      result.current.setMode('10+0')
    })

    expect(result.current.mode).toBe('10+0')
    expect(result.current.whiteTime).toBe(600)
    expect(result.current.blackTime).toBe(600)
  })

  it('форматирует время в формат MM:SS или символ бесконечности', () => {
    expect(formatClockTime(300)).toBe('05:00')
    expect(formatClockTime(65)).toBe('01:05')
    expect(formatClockTime(9)).toBe('00:09')
    expect(formatClockTime(0)).toBe('00:00')
    expect(formatClockTime(Infinity)).toBe('∞')
  })
})
