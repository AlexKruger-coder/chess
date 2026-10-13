import { useCallback, useRef, useState } from 'react'
import { Chess, type Color, type Move, type Square } from 'chess.js'
import type { GameStatus, MoveInput, UseGameReturn } from './types'

export function computeGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return 'мат'
  }
  if (chess.isStalemate()) {
    return 'пат'
  }
  if (chess.isDraw()) {
    return 'ничья'
  }
  if (chess.inCheck()) {
    return 'шах'
  }
  return 'играется'
}

export function useGame(initialFen?: string): UseGameReturn {
  const chessRef = useRef<Chess>(new Chess(initialFen))

  const [fen, setFen] = useState<string>(() => chessRef.current.fen())
  const [history, setHistory] = useState<string[]>(() => [...chessRef.current.history()])
  const [turn, setTurn] = useState<Color>(() => chessRef.current.turn())
  const [status, setStatus] = useState<GameStatus>(() => computeGameStatus(chessRef.current))
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)

  const makeMove = useCallback(
    (
      fromOrMove: string | MoveInput,
      toSquare?: string,
      promotionPiece?: string
    ): boolean => {
      const chess = chessRef.current

      let moveConfig: MoveInput
      if (typeof fromOrMove === 'string') {
        if (!toSquare) {
          return false
        }
        moveConfig = {
          from: fromOrMove,
          to: toSquare,
          promotion: promotionPiece,
        }
      } else {
        moveConfig = fromOrMove
      }

      try {
        const moveResult = chess.move({
          from: moveConfig.from,
          to: moveConfig.to,
          promotion: moveConfig.promotion,
        })

        if (!moveResult) {
          return false
        }

        const nextStatus = computeGameStatus(chess)
        setFen(chess.fen())
        setHistory([...chess.history()])
        setTurn(chess.turn())
        setStatus(nextStatus)
        setLastMove({ from: moveResult.from, to: moveResult.to })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const newGame = useCallback((startingFen?: string) => {
    const chess = chessRef.current
    if (startingFen) {
      chess.load(startingFen)
    } else {
      chess.reset()
    }

    setFen(chess.fen())
    setHistory([...chess.history()])
    setTurn(chess.turn())
    setStatus(computeGameStatus(chess))
    setLastMove(null)
  }, [])

  const getLegalMoves = useCallback((square: string): Move[] => {
    const chess = chessRef.current
    try {
      return chess.moves({ square: square as Square, verbose: true })
    } catch {
      return []
    }
  }, [])

  const isPromotionMove = useCallback((from: string, to: string): boolean => {
    const chess = chessRef.current
    try {
      const moves = chess.moves({ square: from as Square, verbose: true })
      return moves.some((m) => m.to === to && Boolean(m.promotion))
    } catch {
      return false
    }
  }, [])

  const getKingSquare = useCallback(
    (color?: Color): Square | null => {
      const chess = chessRef.current
      const targetColor = color ?? chess.turn()
      try {
        const squares = chess.findPiece({ type: 'k', color: targetColor })
        return (squares[0] as Square) ?? null
      } catch {
        return null
      }
    },
    []
  )

  const isCheck = status === 'шах' || status === 'мат'
  const isCheckmate = status === 'мат'
  const isStalemate = status === 'пат'
  const isDraw = status === 'ничья' || status === 'пат'
  const isGameOver = isCheckmate || isStalemate || status === 'ничья'
  const winner = isCheckmate ? (turn === 'w' ? 'b' : 'w') : null

  return {
    fen,
    history,
    turn,
    status,
    lastMove,
    isGameOver,
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    winner,
    makeMove,
    newGame,
    getLegalMoves,
    isPromotionMove,
    getKingSquare,
  }
}
