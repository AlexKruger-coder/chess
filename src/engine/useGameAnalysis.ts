import { useEffect, useRef, useState } from 'react'
import { StockfishEngine, type AnalysisResult } from './stockfish'
import { calculateLoss, classifyMove, type MoveAnalysis } from './classifyMove'
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
  const [results, setResults] = useState<MoveAnalysis[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const engineRef = useRef<StockfishEngine | null>(null)
  const abortRef = useRef<boolean>(false)

  const totalMoves = game.history.length

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!start || isAnalyzing) return

    abortRef.current = false
    setLoading(true)
    setError(null)
    setIsAnalyzing(true)
    setProgress({ current: 0, total: totalMoves + 1 })
    setResults([])

    const evals: { cp: number; bestMove: string | null }[] = []

    async function runAnalysis() {
      try {
        if (!engineRef.current) {
          engineRef.current = new StockfishEngine()
        }
        const engine = engineRef.current

        for (let i = 0; i <= totalMoves; i++) {
          if (abortRef.current) return

          const pos = game.getPositionAtStep(i)
          setProgress({ current: i, total: totalMoves + 1 })

          let evalCp: number
          let bestMoveResult: string | null = null

          if (i === totalMoves) {
            // Final position
            const chess = new Chess(pos.fen)
            const status = computeGameStatus(chess)

            if (status === 'мат') {
              evalCp = chess.turn() === 'w' ? -1000 : 1000
            } else if (status === 'пат' || status === 'ничья') {
              evalCp = 0
            } else {
              const analysis: AnalysisResult = await engine.analyze(pos.fen, depth)
              evalCp = analysis.mate !== undefined ? analysis.mate : (analysis.cp ?? 0)
              bestMoveResult = analysis.bestMove
            }
          } else {
            const analysis: AnalysisResult = await engine.analyze(pos.fen, depth)
            evalCp = analysis.mate !== undefined ? analysis.mate : (analysis.cp ?? 0)
            bestMoveResult = analysis.bestMove
          }

          evals.push({ cp: evalCp, bestMove: bestMoveResult })

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

            setResults((prev) => {
              const newResults = [...prev]
              // Fill gaps
              for (let j = newResults.length; j < i; j++) {
                newResults[j] = {} as MoveAnalysis
              }
              newResults[i] = {
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
              return newResults
            })
          }
        }

        if (typeof window !== 'undefined' && window.location.search.includes('debug=1')) {
          console.table(
            evals.map((ev, idx) => {
              const move = idx > 0 && game.verboseHistory[idx - 1]
              return {
                step: idx,
                cp: ev.cp,
                bestMove: ev.bestMove,
                loss: idx > 0 && move
                  ? calculateLoss(
                      evals[idx - 1].cp,
                      ev.cp,
                      move.color === 'w' ? 'w' : 'b',
                    )
                  : null,
                classification: results[idx]?.classification ?? null,
              }
            }),
          )
        }

        setProgress({ current: totalMoves + 1, total: totalMoves + 1 })
        setLoading(false)
        setIsAnalyzing(false)
      } catch (err) {
        console.error('Stockfish:', err)
        if (!abortRef.current) {
          setError(String(err))
        }
        setLoading(false)
        setIsAnalyzing(false)
      }
    }

    runAnalysis()
  }, [start, isAnalyzing, totalMoves, depth])

  return {
    results,
    progress,
    loading,
    error,
    isAnalyzing,
  }
}
