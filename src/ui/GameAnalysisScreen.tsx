import { useMemo, useState, type FC } from 'react'
import { Chessboard, type ChessboardOptions } from 'react-chessboard'
import type { UseGameReturn } from '../game'
import type { UseGameAnalysisResult, MoveAnalysis, MoveClassification } from '../engine'

interface GameAnalysisScreenProps {
  game: UseGameReturn
  analysis: UseGameAnalysisResult
  onBack: () => void
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  blunder: '#ef4444',
  mistake: '#f97316',
  inaccuracy: '#eab308',
  best: '#22c55e',
  brilliant: '#8b5cf6',
  good: '#3b82f6',
  interesting: '#a855f7',
  questionable: '#ec4899',
}

const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
  blunder: '??',
  mistake: '?',
  inaccuracy: '?!',
  best: '♟',
  brilliant: '!!',
  good: '⹂',
  interesting: '!',
  questionable: '⁇',
}

const MAX_EVAL = 1000

const CHART_W = 700
const CHART_H = 130
const CHART_PAD_LEFT = 48
const CHART_PAD_RIGHT = 12
const CHART_PAD_TOP = 10
const CHART_PAD_BOTTOM = 24
const CHART_PLOT_W = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT
const CHART_PLOT_H = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM
const Y_TICKS = [-1000, -500, 0, 500, 1000]

type PlayerStats = {
  accuracy: number
  blunders: number
  mistakes: number
  inaccuracies: number
  total: number
}

const ACCURATE_CLASS: ReadonlySet<MoveClassification> = new Set<MoveClassification>([
  'best',
  'brilliant',
  'good',
  'interesting',
])

function clampEval(value: number | null | undefined): number {
  if (value == null) return 0
  return Math.max(-MAX_EVAL, Math.min(MAX_EVAL, value))
}

function parseUci(uci: string | null | undefined): { from: string; to: string } | null {
  if (!uci || uci.length < 4) return null
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) }
}

function computePlayerStats(results: MoveAnalysis[], color: 'w' | 'b'): PlayerStats {
  let blunders = 0
  let mistakes = 0
  let inaccuracies = 0
  let accurate = 0

  for (const move of results) {
    if (!move || move.color !== color) continue
    if (move.classification === 'blunder') blunders++
    else if (move.classification === 'mistake') mistakes++
    else if (move.classification === 'inaccuracy') inaccuracies++
    else if (ACCURATE_CLASS.has(move.classification)) accurate++
  }

  const total = blunders + mistakes + inaccuracies + accurate
  return {
    accuracy: total > 0 ? Math.round((accurate / total) * 100) : 0,
    blunders,
    mistakes,
    inaccuracies,
    total,
  }
}

const MoveBadge: FC<{ classification: MoveClassification }> = ({ classification }) => {
  const color = CLASSIFICATION_COLORS[classification]
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
      style={{ backgroundColor: color, color: '#ffffff' }}
      title={classification}
    >
      {CLASSIFICATION_LABELS[classification]}
    </span>
  )
}

interface MoveButtonProps {
  move: MoveAnalysis
  selected: boolean
  onSelect: () => void
}

const MoveButton: FC<MoveButtonProps> = ({ move, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] sm:text-xs font-mono transition-all cursor-pointer ${
      selected
        ? 'ring-1 ring-amber-400 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100'
        : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60'
    }`}
    aria-label={`Ход ${move.san}`}
  >
    <span>{move.san}</span>
    <MoveBadge classification={move.classification} />
  </button>
)

interface MoveListProps {
  results: MoveAnalysis[]
  selectedStep: number
  onSelectStep: (step: number) => void
}

const MoveList: FC<MoveListProps> = ({ results, selectedStep, onSelectStep }) => {
  const validMoves = results.filter((r) => r && r.classification && r.from)

  if (validMoves.length === 0) {
    return (
      <p className="text-xs text-zinc-400 italic py-3 text-center">Ходов пока нет</p>
    )
  }

  const pairs: Array<{ number: number; white?: MoveAnalysis; black?: MoveAnalysis }> = []
  for (let i = 0; i < validMoves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: validMoves[i],
      black: validMoves[i + 1],
    })
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-1 text-sm">
      {pairs.map((pair) => {
        const whiteStep = pair.white ? pair.white.moveNumber : -1
        const blackStep = pair.black ? pair.black.moveNumber : -1
        return (
          <div key={pair.number} className="flex items-center gap-2 py-0.5">
            <span className="text-zinc-400 text-xs font-mono w-6 text-right">{pair.number}.</span>
            {pair.white && (
              <MoveButton
                move={pair.white}
                selected={selectedStep === whiteStep}
                onSelect={() => onSelectStep(whiteStep)}
              />
            )}
            {pair.black ? (
              <MoveButton
                move={pair.black}
                selected={selectedStep === blackStep}
                onSelect={() => onSelectStep(blackStep)}
              />
            ) : (
              <span className="w-20" />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface PlayerAccuracyProps {
  color: 'w' | 'b'
  stats: PlayerStats
}

const PlayerAccuracy: FC<PlayerAccuracyProps> = ({ color, stats }) => {
  const isWhite = color === 'w'
  return (
    <div className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span
          className={`h-3 w-3 rounded-full border ${
            isWhite ? 'bg-white border-zinc-400' : 'bg-zinc-900 border-zinc-600'
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {isWhite ? 'Белые' : 'Чёрные'}
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {stats.total > 0 ? `${stats.accuracy}%` : '--'}
      </div>
      <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-zinc-600 dark:text-zinc-400">
        <span>?? {stats.blunders}</span>
        <span>? {stats.mistakes}</span>
        <span>?! {stats.inaccuracies}</span>
      </div>
    </div>
  )
}

interface EvalChartProps {
  evals: number[]
  selectedStep: number
  onSelectStep: (step: number) => void
}

const EvalChart: FC<EvalChartProps> = ({ evals, selectedStep, onSelectStep }) => {
  const total = evals.length - 1

  const evalToY = (ev: number): number =>
    CHART_PAD_TOP + (MAX_EVAL - clampEval(ev)) / (MAX_EVAL * 2) * CHART_PLOT_H
  const stepToX = (step: number): number =>
    total > 0 ? CHART_PAD_LEFT + (step / total) * CHART_PLOT_W : CHART_PAD_LEFT + CHART_PLOT_W / 2

  const points = evals.map((ev, i) => ({ x: stepToX(i), y: evalToY(ev) }))

  const tickStep = total <= 16 ? 1 : Math.max(1, Math.ceil(total / 12))
  const centerY = evalToY(0)
  const POS_COLOR = '#22c55e'
  const NEG_COLOR = '#ef4444'

  return (
    <div className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2">
      <svg
        width="100%"
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto block"
      >
        {Y_TICKS.map((tick) => {
          const y = evalToY(tick)
          const isCenter = tick === 0
          return (
            <g key={tick}>
              <line
                x1={CHART_PAD_LEFT}
                y1={y}
                x2={CHART_PAD_LEFT + CHART_PLOT_W}
                y2={y}
                className={
                  isCenter
                    ? 'stroke-zinc-400 dark:stroke-zinc-600 stroke-1'
                    : 'stroke-zinc-200 dark:stroke-zinc-700 stroke-1'
                }
                strokeDasharray={isCenter ? '4 3' : undefined}
              />
              <text
                x={CHART_PAD_LEFT - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-500 dark:fill-zinc-400 text-[9px]"
              >
                {tick > 0 ? `+${tick}` : String(tick)}
              </text>
            </g>
          )
        })}
        <line
          x1={CHART_PAD_LEFT}
          y1={CHART_PAD_TOP}
          x2={CHART_PAD_LEFT}
          y2={CHART_PAD_TOP + CHART_PLOT_H}
          className="stroke-zinc-300 dark:stroke-zinc-600 stroke-1"
        />
        <line
          x1={CHART_PAD_LEFT}
          y1={CHART_PAD_TOP + CHART_PLOT_H}
          x2={CHART_PAD_LEFT + CHART_PLOT_W}
          y2={CHART_PAD_TOP + CHART_PLOT_H}
          className="stroke-zinc-300 dark:stroke-zinc-600 stroke-1"
        />
        {points.map((p, i) => {
          if (i === evals.length - 1) return null
          const next = points[i + 1]
          const avg = (evals[i] + evals[i + 1]) / 2
          const stroke = avg >= 0 ? POS_COLOR : NEG_COLOR
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke={stroke}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )
        })}
        {points.map((p, i) => {
          const selected = selectedStep === i
          const aboveZero = p.y <= centerY + 0.5
          const fill = aboveZero ? POS_COLOR : NEG_COLOR
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={selected ? 5.5 : 3.5}
                fill={fill}
                stroke="white"
                strokeWidth={1.5}
                className="cursor-pointer"
                onClick={() => onSelectStep(i)}
              />
              {selected && (
                <line
                  x1={p.x}
                  y1={CHART_PAD_TOP}
                  x2={p.x}
                  y2={CHART_PAD_TOP + CHART_PLOT_H}
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}
              {(i % tickStep === 0 || i === total) && (
                <text
                  x={p.x}
                  y={CHART_PAD_TOP + CHART_PLOT_H + 16}
                  textAnchor="middle"
                  className="fill-zinc-500 dark:fill-zinc-400 text-[9px]"
                >
                  {i === 0 ? 'нач' : String(i)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 text-center">
        Ось X: номера ходов · Ось Y: оценка (-1000..+1000)
      </div>
    </div>
  )
}

export const GameAnalysisScreen: FC<GameAnalysisScreenProps> = ({ game, analysis, onBack }) => {
  const { results, progress, loading, error, isAnalyzing } = analysis
  const { getPositionAtStep, history } = game
  const totalMoves = history.length

  const [selectedStep, setSelectedStep] = useState<number>(0)

  const evals = useMemo(() => {
    const pts = new Array(totalMoves + 1).fill(0)
    for (let p = 0; p <= totalMoves; p++) {
      if (p === 0) pts[p] = clampEval(results[1]?.prevEval)
      else pts[p] = clampEval(results[p]?.postEval)
    }
    return pts
  }, [results, totalMoves])

  const bestMoveInfo = useMemo(
    () => (selectedStep < totalMoves ? parseUci(results[selectedStep + 1]?.bestMove) : null),
    [results, selectedStep, totalMoves]
  )

  const lastMoveForStep = useMemo(() => {
    const move = selectedStep > 0 ? results[selectedStep] : undefined
    return move && move.from && move.to ? { from: move.from, to: move.to } : null
  }, [results, selectedStep])

  const handleSelectStep = (step: number) => setSelectedStep(Math.max(0, Math.min(totalMoves, step)))

  const arrows = useMemo<Array<{ startSquare: string; endSquare: string; color: string }>>(
    () => {
      if (!bestMoveInfo) return []
      return [
        {
          startSquare: bestMoveInfo.from,
          endSquare: bestMoveInfo.to,
          color: CLASSIFICATION_COLORS.best,
        },
      ]
    },
    [bestMoveInfo]
  )

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {}

    if (lastMoveForStep) {
      styles[lastMoveForStep.from] = {
        backgroundColor: 'rgba(255,230,0,0.45)',
        boxShadow: 'inset 0 0 0 2px rgba(255,230,0,0.9)',
      }
      styles[lastMoveForStep.to] = {
        backgroundColor: 'rgba(255,230,0,0.45)',
        boxShadow: 'inset 0 0 0 2px rgba(255,230,0,0.9)',
      }
    }

    if (bestMoveInfo) {
      styles[bestMoveInfo.from] = {
        ...(styles[bestMoveInfo.from] || {}),
        boxShadow: 'inset 0 0 0 3px rgba(34,197,94,0.9)',
      }
      styles[bestMoveInfo.to] = {
        ...(styles[bestMoveInfo.to] || {}),
        boxShadow: 'inset 0 0 0 3px rgba(34,197,94,0.9)',
      }
    }

    return styles
  }, [bestMoveInfo, lastMoveForStep])

  const chessboardOptions = useMemo<ChessboardOptions>(() => {
    return {
      position: getPositionAtStep(selectedStep).fen,
      boardOrientation: 'white',
      allowDragging: false,
      showAnimations: true,
      animationDurationInMs: 200,
      squareStyles,
      arrows,
      boardStyle: {
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
      darkSquareStyle: { backgroundColor: '#b58863' },
      lightSquareStyle: { backgroundColor: '#f0d9b5' },
    }
  }, [getPositionAtStep, selectedStep, squareStyles, arrows])

  const whiteStats = useMemo(() => computePlayerStats(results, 'w'), [results])
  const blackStats = useMemo(() => computePlayerStats(results, 'b'), [results])

  const fmtEval = (v: number | null | undefined) => {
    const n = clampEval(v)
    return `${n > 0 ? '+' : ''}${n}`
  }

  const moveInto = selectedStep > 0 ? results[selectedStep] : undefined

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-lg transition-all cursor-pointer"
          aria-label="Назад"
          title="Назад"
        >
          ←
        </button>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Анализ партии</h2>
        <div className="w-9" />
      </div>

      {(isAnalyzing || loading) && (
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
            Analyzing... {progress.current} из {progress.total}
          </span>
          <div className="flex-1 h-2 rounded bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full rounded bg-amber-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
          Ошибка анализа: {error}
        </div>
      )}

      {!isAnalyzing && !loading && results.length === 0 && !error && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
          {totalMoves === 0
            ? 'Партия не содержит ходов для анализа.'
            : 'Анализ не запущен.'}
        </div>
      )}

      {!error && results.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <PlayerAccuracy color="w" stats={whiteStats} />
          <PlayerAccuracy color="b" stats={blackStats} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 items-start">
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square touch-manipulation">
            <Chessboard options={chessboardOptions} />
          </div>

          <div className="mt-3 w-full rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 p-3 text-center">
            {selectedStep === 0 ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Начальная позиция
              </span>
            ) : moveInto?.san ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                    {moveInto.san}
                  </span>
                  {moveInto.classification && (
                    <MoveBadge classification={moveInto.classification} />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Оценка: {fmtEval(moveInto.prevEval)} → {fmtEval(moveInto.postEval)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Позиция {selectedStep}
              </span>
            )}

            {bestMoveInfo && (
              <span className="block mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                Лучший ход: <span className="font-mono">{bestMoveInfo.from}-{bestMoveInfo.to}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Ходы ({totalMoves})
            </h3>
            <MoveList
              results={results}
              selectedStep={selectedStep}
              onSelectStep={handleSelectStep}
            />
          </div>
          <EvalChart evals={evals} selectedStep={selectedStep} onSelectStep={handleSelectStep} />
        </div>
      </div>
    </section>
  )
}
