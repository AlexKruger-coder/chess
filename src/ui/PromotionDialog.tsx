import type { FC } from 'react'
import type { Color } from 'chess.js'

interface PromotionDialogProps {
  color: Color
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void
  onCancel: () => void
}

const PROMOTION_PIECES: Array<{
  type: 'q' | 'r' | 'b' | 'n'
  nameRu: string
  whiteSymbol: string
  blackSymbol: string
}> = [
  { type: 'q', nameRu: 'Ферзь', whiteSymbol: '♕', blackSymbol: '♛' },
  { type: 'n', nameRu: 'Конь', whiteSymbol: '♘', blackSymbol: '♞' },
  { type: 'r', nameRu: 'Ладья', whiteSymbol: '♖', blackSymbol: '♜' },
  { type: 'b', nameRu: 'Слон', whiteSymbol: '♗', blackSymbol: '♝' },
]

export const PromotionDialog: FC<PromotionDialogProps> = ({
  color,
  onSelect,
  onCancel,
}) => {
  return (
    <div
      role="dialog"
      aria-label="Выбор фигуры для превращения пешки"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
        <h3 className="mb-2 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Превращение пешки
        </h3>
        <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Выберите фигуру для превращения:
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {PROMOTION_PIECES.map(({ type, nameRu, whiteSymbol, blackSymbol }) => {
            const symbol = color === 'w' ? whiteSymbol : blackSymbol
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className="flex flex-col items-center justify-center rounded-xl p-3 bg-zinc-100 hover:bg-amber-100 active:scale-95 transition-all dark:bg-zinc-700 dark:hover:bg-amber-900/40 border border-zinc-200 dark:border-zinc-600 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <span className="text-4xl leading-none select-none mb-1">
                  {symbol}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {nameRu}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
