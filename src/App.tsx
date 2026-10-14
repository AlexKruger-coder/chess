import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { useClock, useGame, computeGameStatus, type ClockMode } from './game'
import { useEval, evalToBarPercent, formatEval } from './engine'
import {
  ChessBoardView,
  ChessClock,
  EvalBar,
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

  // При новом ходе в партии возвращаемся к актуальной позиции
  useEffect(() => {
    setViewStep(null)
  }, [game.history.length])

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

  const positionStatus = useMemo(() => {
    const chess = new Chess(displayedFen)
    return computeGameStatus(chess)
  }, [displayedFen])

  const evalAnalysis = useEval(displayedFen, 10, !isBrowsing)

  const evalPercent = evalToBarPercent(evalAnalysis.result?.cp ?? 0)
  const evalLabel =
    positionStatus === 'играется' ? formatEval(evalAnalysis.result) : positionStatus

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

        {/* Шахматная доска и оценка позиции */}
        <div className="flex gap-3 items-start w-full">
          <div className="flex-1 min-w-0">
            <ChessBoardView
              game={game}
              orientation={orientation}
              isBrowsing={isBrowsing}
              displayedFen={displayedFen}
              displayedLastMove={displayedLastMove}
              isTimeout={Boolean(clock.timeOutWinner)}
            />
          </div>
          <EvalBar
            percent={evalPercent}
            label={evalLabel}
            orientation={orientation}
          />
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
