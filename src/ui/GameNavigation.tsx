import type { FC } from 'react'

interface GameNavigationProps {
  currentStep: number
  totalSteps: number
  isBrowsing: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  onLast: () => void
  onReturnToLive: () => void
}

export const GameNavigation: FC<GameNavigationProps> = ({
  currentStep,
  totalSteps,
  isBrowsing,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onReturnToLive,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 rounded-2xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 p-3 sm:p-4 shadow-xs">
      {/* Пометка "просмотр" и кнопка возврата к текущей позиции */}
      {isBrowsing && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              Просмотр
            </span>
            <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              Позиция после {currentStep === 0 ? 'начала партии' : `хода ${currentStep} из ${totalSteps}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onReturnToLive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <span>↷</span>
            <span>К текущей позиции</span>
          </button>
        </div>
      )}

      {/* Кнопки навигации по ходам */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onFirst}
          disabled={currentStep === 0}
          title="В начало партии"
          aria-label="В начало"
          className="flex-1 max-w-16 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-100 font-bold text-sm transition-colors cursor-pointer"
        >
          |◀
        </button>

        <button
          type="button"
          onClick={onPrevious}
          disabled={currentStep === 0}
          title="Предыдущий ход"
          aria-label="Назад"
          className="flex-1 max-w-20 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-100 font-bold text-sm transition-colors cursor-pointer"
        >
          ◀
        </button>

        <div className="px-3 text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 min-w-20 text-center">
          {currentStep} / {totalSteps}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={currentStep === totalSteps}
          title="Следующий ход"
          aria-label="Вперёд"
          className="flex-1 max-w-20 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-100 font-bold text-sm transition-colors cursor-pointer"
        >
          ▶
        </button>

        <button
          type="button"
          onClick={onLast}
          disabled={currentStep === totalSteps}
          title="К текущей позиции"
          aria-label="В конец"
          className="flex-1 max-w-16 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-100 font-bold text-sm transition-colors cursor-pointer"
        >
          ▶|
        </button>
      </div>
    </div>
  )
}
