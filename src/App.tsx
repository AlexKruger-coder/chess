import { useState } from 'react'
import { useGame } from './game'
import { ChessBoardView, GameStatusBar, MoveHistory } from './ui'

function App() {
  const game = useGame()
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col items-center p-3 sm:p-6 transition-colors">
      <header className="w-full max-w-xl flex items-center justify-between mb-3 sm:mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl" role="img" aria-label="Шахматный конь">
            ♞
          </span>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none">
              Шахматы на двоих
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Игра на одном устройстве
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Хакатон
          </span>
        </div>
      </header>

      <main className="w-full max-w-xl flex flex-col items-center gap-3 sm:gap-4">
        {/* Панель статуса и действий над доской */}
        <GameStatusBar
          turn={game.turn}
          status={game.status}
          winner={game.winner}
          onNewGame={() => game.newGame()}
          orientation={orientation}
          onToggleOrientation={toggleOrientation}
        />

        {/* Доска */}
        <ChessBoardView game={game} orientation={orientation} />

        {/* История ходов */}
        <MoveHistory history={game.history} />
      </main>
    </div>
  )
}

export default App
