import { useEffect, useRef, useState } from 'react'
import { useClock, useGame, type ClockMode } from './game'
import { StockfishEngine, type AnalysisResult } from './engine'
import {
  ChessBoardView,
  ChessClock,
  GameNavigation,
  GameStatusBar,
  MoveHistory,
} from './ui'

function App() {
  const game = useGame()
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [viewStep, setViewStep] = useState<number | null>(null)

  const clock = useClock({
    initialMode: '5+0',
    turn: game.turn,
    isGameOver: game.isGameOver,
    moveCount: game.history.length,
  })

  const [engineResult, setEngineResult] = useState<AnalysisResult | null>(null)
  const [engineLoading, setEngineLoading] = useState(false)
  const engineRef = useRef<StockfishEngine | null>(null)

  // При новом ходе в партии возвращаемся к актуальной позиции
  useEffect(() => {
    setViewStep(null)
  }, [game.history.length])

  // Очистка движка при размонтировании
  useEffect(() => {
    return () => engineRef.current?.destroy()
  }, [])

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
  }

  const handleNewGame = () => {
    game.newGame()
    clock.reset()
    setViewStep(null)
  }

  const totalSteps = game.history.length
  const isBrowsing = viewStep !== null && viewStep < totalSteps
  const currentStep = viewStep ?? totalSteps

  const historicalPosition = game.getPositionAtStep(currentStep)
  const displayedFen = isBrowsing ? historicalPosition.fen : game.fen
  const displayedLastMove = isBrowsing ? historicalPosition.lastMove : game.lastMove

  // Навигация
  const handleFirst = () => setViewStep(0)
  const handlePrevious = () =>
    setViewStep((prev) => Math.max(0, (prev ?? totalSteps) - 1))
  const handleNext = () =>
    setViewStep((prev) => {
      const next = (prev ?? totalSteps) + 1
      return next >= totalSteps ? null : next
    })
  const handleLast = () => setViewStep(null)
  const handleReturnToLive = () => setViewStep(null)
  const handleSelectMove = (step: number) => {
    if (step >= totalSteps) {
      setViewStep(null)
    } else {
      setViewStep(step)
    }
  }

  // TODO: Remove temporary Stockfish test button
  const handleTestStockfish = async () => {
    let eng = engineRef.current
    if (!eng) {
      eng = new StockfishEngine()
      engineRef.current = eng
    }
    setEngineLoading(true)
    try {
      const result = await eng.analyze(game.fen, 15)
      setEngineResult(result)
    } catch (e) {
      console.error('Stockfish error:', e)
    } finally {
      setEngineLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col items-center p-3 sm:p-6 transition-colors">
      <header className="w-full max-w-xl flex items-center justify-between mb-3 px-1">
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

      <main className="w-full max-w-xl flex flex-col items-center gap-3">
        {/* Панель статуса партии */}
        <GameStatusBar
          turn={game.turn}
          status={game.status}
          winner={clock.timeOutWinner ?? game.winner}
          timeOutWinner={clock.timeOutWinner}
          onNewGame={handleNewGame}
          orientation={orientation}
          onToggleOrientation={toggleOrientation}
        />

        {/* Шахматные часы и выбор контроля времени */}
        <ChessClock
          whiteTime={clock.whiteTime}
          blackTime={clock.blackTime}
          turn={game.turn}
          isRunning={clock.isRunning}
          mode={clock.mode}
          onModeChange={(newMode: ClockMode) => clock.setMode(newMode)}
          timeOutWinner={clock.timeOutWinner}
          disabled={game.history.length > 0 && clock.isRunning}
        />

        {/* Шахматная доска */}
        <ChessBoardView
          game={game}
          orientation={orientation}
          isBrowsing={isBrowsing}
          displayedFen={displayedFen}
          displayedLastMove={displayedLastMove}
          isTimeout={Boolean(clock.timeOutWinner)}
        />

        {/* TODO: Remove temporary Stockfish test button */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 sm:px-4 py-2.5 shadow-xs">
            <button
              type="button"
              onClick={handleTestStockfish}
              disabled={engineLoading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{engineLoading ? '⏳' : '♟'}</span>
              <span>тест Stockfish</span>
            </button>
            {engineResult && (
              <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                {engineResult.cp !== undefined
                  ? `Оценка: ${engineResult.cp > 0 ? '+' : ''}${engineResult.cp} cp`
                  : engineResult.mate !== undefined
                    ? `Оценка: Мат ${engineResult.mate > 0 ? '+' : ''}${engineResult.mate / 1000}`
                    : 'Оценка: —'}
                {engineResult.bestMove && ` · Лучший ход: ${engineResult.bestMove}`}
              </span>
            )}
          </div>
        </div>

        {/* Навигация по истории партии */}
        <GameNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          isBrowsing={isBrowsing}
          onFirst={handleFirst}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onLast={handleLast}
          onReturnToLive={handleReturnToLive}
        />

        {/* Список ходов */}
        <MoveHistory
          history={game.history}
          currentStep={currentStep}
          onSelectMove={handleSelectMove}
        />
      </main>
    </div>
  )
}

export default App
