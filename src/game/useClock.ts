import { useCallback, useEffect, useState } from 'react'

export type ClockMode = '3+0' | '5+0' | '10+0' | 'none'

export const MODE_SECONDS: Record<ClockMode, number> = {
  '3+0': 180,
  '5+0': 300,
  '10+0': 600,
  none: Infinity,
}

export interface UseClockOptions {
  initialMode?: ClockMode
  turn: 'w' | 'b'
  isGameOver: boolean
  moveCount: number
  onTimeout?: (loser: 'w' | 'b') => void
}

export interface UseClockReturn {
  mode: ClockMode
  setMode: (mode: ClockMode) => void
  whiteTime: number
  blackTime: number
  isRunning: boolean
  timeOutWinner: 'w' | 'b' | null
  timeOutLoser: 'w' | 'b' | null
  reset: (customMode?: ClockMode) => void
  formatTime: (seconds: number) => string
}

export function formatClockTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return '∞'
  }
  const clamped = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(clamped / 60)
  const remainingSeconds = clamped % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function useClock({
  initialMode = '5+0',
  turn,
  isGameOver,
  moveCount,
  onTimeout,
}: UseClockOptions): UseClockReturn {
  const [mode, setModeState] = useState<ClockMode>(initialMode)
  const [whiteTime, setWhiteTime] = useState<number>(MODE_SECONDS[initialMode])
  const [blackTime, setBlackTime] = useState<number>(MODE_SECONDS[initialMode])
  const [timeOutWinner, setTimeOutWinner] = useState<'w' | 'b' | null>(null)
  const [timeOutLoser, setTimeOutLoser] = useState<'w' | 'b' | null>(null)

  const isRunning =
    mode !== 'none' && !isGameOver && !timeOutWinner && moveCount >= 1

  const reset = useCallback(
    (customMode?: ClockMode) => {
      const targetMode = customMode ?? mode
      setWhiteTime(MODE_SECONDS[targetMode])
      setBlackTime(MODE_SECONDS[targetMode])
      setTimeOutWinner(null)
      setTimeOutLoser(null)
    },
    [mode]
  )

  const setMode = useCallback(
    (newMode: ClockMode) => {
      setModeState(newMode)
      setWhiteTime(MODE_SECONDS[newMode])
      setBlackTime(MODE_SECONDS[newMode])
      setTimeOutWinner(null)
      setTimeOutLoser(null)
    },
    []
  )

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const timer = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setTimeOutWinner('b')
            setTimeOutLoser('w')
            onTimeout?.('w')
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setTimeOutWinner('w')
            setTimeOutLoser('b')
            onTimeout?.('b')
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, turn, onTimeout])

  return {
    mode,
    setMode,
    whiteTime,
    blackTime,
    isRunning,
    timeOutWinner,
    timeOutLoser,
    reset,
    formatTime: formatClockTime,
  }
}
