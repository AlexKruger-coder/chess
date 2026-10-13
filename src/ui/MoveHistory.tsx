import type { FC } from 'react'

interface MoveHistoryProps {
  history: string[]
  currentStep?: number | null
  onSelectMove?: (step: number) => void
}

export const MoveHistory: FC<MoveHistoryProps> = ({
  history,
  currentStep,
  onSelectMove,
}) => {
  // Сгруппировать ходы парами: 1. Белые Чёрные
  const movePairs: Array<{ number: number; white: string; black?: string }> = []
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    })
  }

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 p-3 sm:p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          История ходов ({history.length})
        </h3>
      </div>

      <div className="max-h-36 overflow-y-auto pr-1 text-sm font-mono scrollbar-thin">
        {movePairs.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2 text-center">
            Ходов пока нет
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            {movePairs.map((pair) => {
              const whiteStep = (pair.number - 1) * 2 + 1
              const blackStep = (pair.number - 1) * 2 + 2
              const isWhiteSelected = currentStep === whiteStep
              const isBlackSelected = currentStep === blackStep

              return (
                <div
                  key={pair.number}
                  className="flex items-center gap-1.5 py-0.5 text-xs sm:text-sm"
                >
                  <span className="text-zinc-400 w-6 text-right font-medium">
                    {pair.number}.
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectMove?.(whiteStep)}
                    disabled={!onSelectMove}
                    className={`font-semibold rounded px-1 min-w-8 text-left transition-colors ${
                      isWhiteSelected
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 ring-1 ring-amber-400'
                        : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
                    } ${onSelectMove ? 'cursor-pointer' : ''}`}
                  >
                    {pair.white}
                  </button>
                  {pair.black && (
                    <button
                      type="button"
                      onClick={() => onSelectMove?.(blackStep)}
                      disabled={!onSelectMove}
                      className={`font-semibold rounded px-1 min-w-8 text-left transition-colors ${
                        isBlackSelected
                          ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 ring-1 ring-amber-400'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
                      } ${onSelectMove ? 'cursor-pointer' : ''}`}
                    >
                      {pair.black}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
