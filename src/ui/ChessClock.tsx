import type { FC } from 'react'
import type { Color } from 'chess.js'
import { formatClockTime, type ClockMode } from '../game'

interface ChessClockProps {
  whiteTime: number
  blackTime: number
  turn: Color
  isRunning: boolean
  mode: ClockMode
  onModeChange: (mode: ClockMode) => void
  timeOutWinner: Color | null
  disabled?: boolean
}

const MODES: Array<{ id: ClockMode; label: string }> = [
  { id: '3+0', label: '3+0' },
  { id: '5+0', label: '5+0' },
  { id: '10+0', label: '10+0' },
  { id: 'none', label: 'Без времени' },
]

export const ChessClock: FC<ChessClockProps> = ({
  whiteTime,
  blackTime,
  turn,
  isRunning,
  mode,
  onModeChange,
  timeOutWinner,
  disabled = false,
}) => {
  const isWhiteActive = isRunning && turn === 'w'
  const isBlackActive = isRunning && turn === 'b'
  const isWhiteLow = mode !== 'none' && whiteTime > 0 && whiteTime <= 20
  const isBlackLow = mode !== 'none' && blackTime > 0 && blackTime <= 20
  const isWhiteTimeout = timeOutWinner === 'b'
  const isBlackTimeout = timeOutWinner === 'w'

  return (
    <div className="w-full flex flex-col gap-2.5 rounded-2xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 p-3 sm:p-4 shadow-xs">
      {/* Выбор режима контроля времени */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Контроль времени:
        </span>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          {MODES.map((m) => {
            const isSelected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange(m.id)}
                disabled={disabled}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Часы белых и чёрных */}
      {mode !== 'none' && (
        <div className="grid grid-cols-2 gap-3">
          {/* Часы белых */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              isWhiteActive
                ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-2 ring-amber-500/30'
                : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
            } ${isWhiteTimeout ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500/40' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full bg-white border border-zinc-400 shadow-xs"
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Белые
              </span>
            </div>
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                isWhiteTimeout
                  ? 'text-red-600 dark:text-red-400'
                  : isWhiteLow
                    ? 'text-red-600 dark:text-red-400 animate-pulse'
                    : isWhiteActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {formatClockTime(whiteTime)}
            </span>
          </div>

          {/* Часы чёрных */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              isBlackActive
                ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-2 ring-amber-500/30'
                : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
            } ${isBlackTimeout ? 'bg-red-500/15 border-red-500 ring-2 ring-red-500/40' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full bg-zinc-900 border border-zinc-600 shadow-xs"
                aria-hidden="true"
              />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Чёрные
              </span>
            </div>
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                isBlackTimeout
                  ? 'text-red-600 dark:text-red-400'
                  : isBlackLow
                    ? 'text-red-600 dark:text-red-400 animate-pulse'
                    : isBlackActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {formatClockTime(blackTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
