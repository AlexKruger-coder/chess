import { useEffect, useRef, useState } from 'react'
import { StockfishEngine, type AnalysisResult } from './stockfish'
import { calculateLoss, classifyMove, type MoveAnalysis } from './classifyMove'
import { evalFromResult } from './eval'
import { type UseGameReturn } from '../game'
import { computeGameStatus } from '../game/useGame'
import { Chess } from 'chess.js'

export interface UseGameAnalysisResult {
  results: MoveAnalysis[]
  progress: { current: number; total: number }
  loading: boolean
  error: string | null
  isAnalyzing: boolean
}

export function useGameAnalysis(
  game: UseGameReturn,
  start: boolean = false,
  depth: number = 12,
): UseGameAnalysisResult {
  const totalMoves = game.history.length

  const [results, setResults] = useState<MoveAnalysis[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: start ? totalMoves + 1 : 0,
  })
  const [loading, setLoading] = useState<boolean>(start)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(start)

  const [prevStart, setPrevStart] = useState<boolean>(start)
  if (start !== prevStart) {
    setPrevStart(start)
    if (start) {
      setIsAnalyzing(true)
      setLoading(true)
      setProgress({ current: 0, total: totalMoves + 1 })
      setResults([])
      setError(null)
    } else {
      setIsAnalyzing(false)
      setLoading(false)
    }
  }

  const engineRef = useRef<StockfishEngine | null>(null)
  const abortRef = useRef<boolean>(false)
  const analyzingRef = useRef<boolean>(false)
  // Ключ последней проанализированной партии — чтобы не перезапускать анализ той же партии
  const analyzedKeyRef = useRef<string | null>(null)

  // useGame() возвращает новый объект на каждый рендер, поэтому НЕ кладём game в зависимости
  // эффекта (иначе анализ перезапускается бесконечно). Берём актуальный game из ref.
  const gameRef = useRef(game)
  gameRef.current = game
  const historyKey = game.history.join(' ')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
      analyzingRef.current = false
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!start) {
      analyzingRef.current = false
      abortRef.current = true
      analyzedKeyRef.current = null
      return
    }
    const runKey = `${depth}|${historyKey}`
    if (analyzingRef.current) return
    if (analyzedKeyRef.current === runKey) return

    analyzedKeyRef.current = runKey
    analyzingRef.current = true
    abortRef.current = false
    const game = gameRef.current
    setLoading(true)
    setError(null)
    setIsAnalyzing(true)
    setProgress({ current: 0, total: totalMoves + 1 })
    setResults([])

    const evals: {
      fen: string
      rawCp: number | null
      rawMate: number | null
      cp: number
      bestMove: string | null
    }[] = []

    async function runAnalysis() {
      const startTime = Date.now()
      let lastProgressTime = 0
      const allResults: MoveAnalysis[] = []

      try {
        if (!engineRef.current) {
          engineRef.current = new StockfishEngine()
        }
        const engine = engineRef.current

        for (let i = 0; i <= totalMoves; i++) {
          if (abortRef.current) return

          const pos = game.getPositionAtStep(i)
          const now = Date.now()
          if (now - lastProgressTime >= 100 || i === totalMoves) {
            lastProgressTime = now
            setProgress({ current: i, total: totalMoves + 1 })
          }

          let evalCp: number
          let rawCp: number | null = null
          let rawMate: number | null = null
          let bestMoveResult: string | null = null

          if (i === totalMoves) {
            // Final position
            const chess = new Chess(pos.fen)
            const status = computeGameStatus(chess)

            if (status === 'мат') {
              evalCp = chess.turn() === 'w' ? -1000 : 1000
              rawMate = chess.turn() === 'w' ? -1 : 1
            } else if (status === 'пат' || status === 'ничья') {
              evalCp = 0
              rawCp = 0
            } else {
              const analysis: AnalysisResult = await engine.analyze(pos.fen, depth)
              rawCp = analysis.cp ?? null
              rawMate = analysis.mate ?? null
              evalCp = evalFromResult(analysis)
              bestMoveResult = analysis.bestMove
            }
          } else {
            const analysis: AnalysisResult = await engine.analyze(pos.fen, depth)
            rawCp = analysis.cp ?? null
            rawMate = analysis.mate ?? null
            evalCp = evalFromResult(analysis)
            bestMoveResult = analysis.bestMove
          }

          evals.push({
            fen: pos.fen,
            rawCp,
            rawMate,
            cp: evalCp,
            bestMove: bestMoveResult,
          })

          // Classify move i (which led to position i)
          if (i > 0 && game.verboseHistory[i - 1]) {
            const moveHistory = game.verboseHistory[i - 1]
            const prevEval = evals[i - 1].cp
            const postEval = evals[i].cp
            const bestMoveUci = evals[i - 1].bestMove
            const playedUci = moveHistory.from + moveHistory.to + (moveHistory.promotion ?? '')
            const color = moveHistory.color === 'w' ? 'w' : 'b'

            const classification = classifyMove({
              prevEval: prevEval,
              postEval: postEval,
              color: color,
              bestMoveUci: bestMoveUci ?? undefined,
              playedUci: playedUci,
            })

            allResults[i] = {
              moveNumber: i,
              san: moveHistory.san,
              from: moveHistory.from,
              to: moveHistory.to,
              promotion: moveHistory.promotion,
              color: color,
              prevEval: prevEval,
              postEval: postEval,
              bestMove: bestMoveUci ?? undefined,
              isBestMove: classification === 'best',
              classification,
            }
          }
        }

        const elapsed = Date.now() - startTime
        if (elapsed >= 400 && elapsed < 600) {
          await new Promise((resolve) => setTimeout(resolve, 600 - elapsed))
        }

        if (abortRef.current) return

        if (typeof window !== 'undefined' && window.location.search.includes('debug=1')) {
          console.table(
            evals.map((ev, idx) => {
              const move = idx > 0 && game.verboseHistory[idx - 1]
              return {
                step: idx,
                fen: ev.fen,
                cp: ev.rawCp,
                mate: ev.rawMate,
                finalEval: ev.cp,
                loss:
                  idx > 0 && move
                    ? calculateLoss(
                        evals[idx - 1].cp,
                        ev.cp,
                        move.color === 'w' ? 'w' : 'b',
                      )
                    : null,
                class: allResults[idx]?.classification ?? (idx === 0 ? '-' : null),
              }
            }),
          )
        }

        setProgress({ current: totalMoves + 1, total: totalMoves + 1 })
        setResults(allResults)
        setLoading(false)
        setIsAnalyzing(false)
        analyzingRef.current = false
      } catch (err) {
        console.error('Stockfish:', err)
        if (!abortRef.current) {
          setError(String(err))
        }
        setLoading(false)
        setIsAnalyzing(false)
        analyzingRef.current = false
      }
    }

    runAnalysis()
  }, [start, totalMoves, depth, historyKey])

  return {
    results,
    progress,
    loading,
    error,
    isAnalyzing,
  }
}
