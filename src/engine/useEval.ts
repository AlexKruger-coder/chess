import { useEffect, useRef, useState } from 'react'
import { StockfishEngine, type AnalysisResult } from './stockfish'

export interface UseEvalResult {
  result: AnalysisResult | null
  loading: boolean
  error: string | null
}

export function useEval(
  fen: string,
  depth: number = 10,
  enabled: boolean = true,
): UseEvalResult {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const engineRef = useRef<StockfishEngine | null>(null)
  const mountedRef = useRef<boolean>(true)
  const currentFenRef = useRef<string>('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    currentFenRef.current = fen
    setError(null)

    let engine = engineRef.current
    if (engine === null) {
      try {
        engine = new StockfishEngine()
        engineRef.current = engine
      } catch (err) {
        console.error('Stockfish:', err)
        setError(String(err))
        return
      }
    }

    engine.stop()

    const timer = setTimeout(() => {
      if (!mountedRef.current) return
      const requestFen = currentFenRef.current
      setLoading(true)
      engine
        .analyze(requestFen, depth)
        .then((analysis) => {
          if (!mountedRef.current) return
          if (currentFenRef.current !== requestFen) return
          setResult(analysis)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Stockfish:', err)
          if (!mountedRef.current) return
          if (currentFenRef.current === requestFen) {
            setError(String(err))
            setLoading(false)
          }
        })
    }, 150)

    timeoutRef.current = timer

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [fen, depth, enabled])

  return { result, loading, error }
}
