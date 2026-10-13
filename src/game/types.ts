import type { Color, Move, Square } from 'chess.js'

export type GameStatus = 'играется' | 'шах' | 'мат' | 'пат' | 'ничья'

export type MoveInput = {
  from: string
  to: string
  promotion?: string
}

export type UseGameReturn = {
  fen: string
  history: string[]
  turn: Color
  status: GameStatus
  lastMove: { from: string; to: string } | null
  isGameOver: boolean
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
  winner: Color | null
  makeMove: (
    fromOrMove: string | MoveInput,
    toSquare?: string,
    promotionPiece?: string
  ) => boolean
  newGame: (startingFen?: string) => void
  getLegalMoves: (square: string) => Move[]
  isPromotionMove: (from: string, to: string) => boolean
  getKingSquare: (color?: Color) => Square | null
}
