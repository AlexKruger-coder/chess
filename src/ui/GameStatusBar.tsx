import type { FC } from 'react'
import type { Color } from 'chess.js'
import type { GameStatus } from '../game'

interface GameStatusBarProps {
  turn: Color
  status: GameStatus
  winner: Color | null
  onNewGame: () => void
  orientation: 'white' | 'black'
  onToggleOrientation: () => void
}

export const GameStatusBar: FC<GameStatusBarProps> = ({
  turn,
  status,
  winner,
  onNewGame,
  orientation,
  onToggleOrientation,
}) => {
  const isCheck = status === 'шах'
  const isMate = status === 'мат'
  const isDraw = status === 'ничья' || status === 'пат'

  const getStatusBadge = () => {
    if (isMate) {
      const winnerName = winner === 'w' ? 'Белые' : 'Чёрные'
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 animate-pulse">
          🏆 Мат! Победили {winnerName}
        </span>
      )
    }

    if (isCheck) {
      const kingColor = turn === 'w' ? 'белому' : 'чёрному'
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 animate-bounce">
          ⚠️ Шах {kingColor} королю!
        </span>
      )
    }

    if (status === 'пат') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
          🤝 Пат (Ничья)
        </span>
      )
    }

    if (isDraw) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
          🤝 Ничья
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
        ● Идёт игра
      </span>
    )
  }

  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-zinc-900/5 dark:bg-zinc-800/80 p-3 sm:p-4 border border-zinc-200 dark:border-zinc-700 shadow-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Чей ход */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Ход:
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <span
              className={`h-3.5 w-3.5 rounded-full border shadow-xs transition-colors ${
                turn === 'w'
                  ? 'bg-white border-zinc-400'
                  : 'bg-zinc-900 border-zinc-600'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {turn === 'w' ? 'Белые' : 'Чёрные'}
            </span>
          </div>
        </div>

        {/* Статус */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            Статус:
          </span>
          {getStatusBadge()}
        </div>

        {/* Действия: Перевернуть и Новая игра */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onToggleOrientation}
            title={`Повернуть доску (сейчас ${orientation === 'white' ? 'белые снизу' : 'чёрные снизу'})`}
            className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all text-zinc-700 dark:text-zinc-300"
            aria-label="Повернуть доску"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={onNewGame}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <span>🔄</span>
            <span>Новая игра</span>
          </button>
        </div>
      </div>
    </div>
  )
}
