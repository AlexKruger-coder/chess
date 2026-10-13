import { useCallback, useMemo, useRef, useState, type FC } from 'react'
import { Chessboard, type ChessboardOptions } from 'react-chessboard'
import type { UseGameReturn } from '../game'
import { PromotionDialog } from './PromotionDialog'

interface ChessBoardViewProps {
  game: UseGameReturn
  orientation: 'white' | 'black'
  isBrowsing?: boolean
  displayedFen?: string
  displayedLastMove?: { from: string; to: string } | null
  isTimeout?: boolean
}

export const ChessBoardView: FC<ChessBoardViewProps> = ({
  game,
  orientation,
  isBrowsing = false,
  displayedFen,
  displayedLastMove,
  isTimeout = false,
}) => {
  const {
    fen,
    turn,
    lastMove,
    isCheck,
    isGameOver,
    makeMove,
    getLegalMoves,
    isPromotionMove,
    getKingSquare,
  } = game

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([])
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string
    to: string
  } | null>(null)

  // Guard against duplicate click events within same gesture
  const lastClickTimeRef = useRef<number>(0)
  const lastClickSquareRef = useRef<string>('')

  const effectiveIsGameOver = isGameOver || isTimeout
  const effectiveFen = isBrowsing && displayedFen ? displayedFen : fen
  const effectiveLastMove = isBrowsing ? (displayedLastMove ?? null) : lastMove

  const clearSelection = useCallback(() => {
    setSelectedSquare(null)
    setLegalMoveSquares([])
  }, [])

  const handleSquareSelection = useCallback(
    (square: string) => {
      // В режиме просмотра или завершения партии ходить нельзя
      if (isBrowsing || effectiveIsGameOver || pendingPromotion) {
        return
      }

      const now = Date.now()
      if (
        lastClickSquareRef.current === square &&
        now - lastClickTimeRef.current < 200
      ) {
        return
      }
      lastClickTimeRef.current = now
      lastClickSquareRef.current = square

      // 1. Если фигура ещё не выбрана
      if (!selectedSquare) {
        const moves = getLegalMoves(square)
        if (moves.length > 0) {
          setSelectedSquare(square)
          setLegalMoveSquares(moves.map((m) => m.to))
        }
        return
      }

      // 2. Если кликнули по той же самой клетке — снимаем выделение
      if (square === selectedSquare) {
        clearSelection()
        return
      }

      // 3. Если кликнули по одной из допустимых клеток хода
      if (legalMoveSquares.includes(square)) {
        if (isPromotionMove(selectedSquare, square)) {
          setPendingPromotion({ from: selectedSquare, to: square })
          clearSelection()
          return
        }

        const success = makeMove(selectedSquare, square)
        if (success) {
          clearSelection()
        }
        return
      }

      // 4. Кликнули по другой фигуре своего цвета
      const nextMoves = getLegalMoves(square)
      if (nextMoves.length > 0) {
        setSelectedSquare(square)
        setLegalMoveSquares(nextMoves.map((m) => m.to))
      } else {
        clearSelection()
      }
    },
    [
      isBrowsing,
      effectiveIsGameOver,
      pendingPromotion,
      selectedSquare,
      getLegalMoves,
      clearSelection,
      legalMoveSquares,
      isPromotionMove,
      makeMove,
    ]
  )

  const handlePieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      piece: { pieceType: string }
      sourceSquare: string
      targetSquare: string | null
    }): boolean => {
      if (isBrowsing || effectiveIsGameOver || !targetSquare || sourceSquare === targetSquare) {
        return false
      }

      // Проверка на превращение
      if (isPromotionMove(sourceSquare, targetSquare)) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare })
        clearSelection()
        return false
      }

      const success = makeMove(sourceSquare, targetSquare)
      if (success) {
        clearSelection()
      }
      return success
    },
    [isBrowsing, effectiveIsGameOver, isPromotionMove, makeMove, clearSelection]
  )

  const handlePromotionSelect = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return
      makeMove(pendingPromotion.from, pendingPromotion.to, piece)
      setPendingPromotion(null)
      clearSelection()
    },
    [pendingPromotion, makeMove, clearSelection]
  )

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null)
  }, [])

  // Стили подсветки клеток
  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {}

    // Подсветка последнего хода (текущего или исторического)
    if (effectiveLastMove) {
      styles[effectiveLastMove.from] = {
        backgroundColor: 'rgba(255, 230, 0, 0.4)',
      }
      styles[effectiveLastMove.to] = {
        backgroundColor: 'rgba(255, 230, 0, 0.4)',
      }
    }

    // Подсветка короля под шахом (только в активной игре)
    if (!isBrowsing && isCheck) {
      const kingSquare = getKingSquare(turn)
      if (kingSquare) {
        styles[kingSquare] = {
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          boxShadow: 'inset 0 0 10px 3px rgba(185, 28, 28, 0.9)',
        }
      }
    }

    // Подсветка выбранной фигуры и легальных ходов (только в активной игре)
    if (!isBrowsing && selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(245, 158, 11, 0.65)',
      }

      if (legalMoveSquares.length > 0) {
        const moves = getLegalMoves(selectedSquare)
        for (const target of legalMoveSquares) {
          const move = moves.find((m) => m.to === target)
          const isCapture = move ? Boolean(move.captured) : false

          if (isCapture) {
            styles[target] = {
              ...(styles[target] || {}),
              boxShadow: 'inset 0 0 0 4px rgba(239, 68, 68, 0.85)',
              cursor: 'pointer',
            }
          } else {
            styles[target] = {
              ...(styles[target] || {}),
              background:
                'radial-gradient(circle, rgba(16, 185, 129, 0.8) 25%, transparent 27%)',
              cursor: 'pointer',
            }
          }
        }
      }
    }

    return styles
  }, [
    effectiveLastMove,
    isBrowsing,
    isCheck,
    getKingSquare,
    turn,
    selectedSquare,
    legalMoveSquares,
    getLegalMoves,
  ])

  // Конфигурация для react-chessboard v5
  const chessboardOptions = useMemo<ChessboardOptions>(() => {
    return {
      position: effectiveFen,
      boardOrientation: orientation,
      allowDragging: !effectiveIsGameOver && !isBrowsing,
      canDragPiece: ({ piece }) =>
        !effectiveIsGameOver && !isBrowsing && piece.pieceType.startsWith(turn),
      onPieceDrop: handlePieceDrop,
      onSquareClick: ({ square }) => handleSquareSelection(square),
      onPieceClick: ({ square }) => {
        if (square) handleSquareSelection(square)
      },
      squareStyles,
      boardStyle: {
        borderRadius: '12px',
        boxShadow:
          '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      darkSquareStyle: { backgroundColor: '#b58863' },
      lightSquareStyle: { backgroundColor: '#f0d9b5' },
      animationDurationInMs: 200,
      showAnimations: true,
    }
  }, [
    effectiveFen,
    orientation,
    effectiveIsGameOver,
    isBrowsing,
    turn,
    handlePieceDrop,
    handleSquareSelection,
    squareStyles,
  ])

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      <div className="w-full max-w-[min(100vw-2rem,540px)] aspect-square touch-manipulation">
        <Chessboard options={chessboardOptions} />
      </div>

      {!isBrowsing && pendingPromotion && (
        <PromotionDialog
          color={turn}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
        />
      )}
    </div>
  )
}
