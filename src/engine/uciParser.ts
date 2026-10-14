/**
 * UCI line parsing utilities for Stockfish output.
 * Pure functions — easily testable without a Worker.
 */

export interface UciScore {
  /** Centipawn evaluation from white's perspective, clamped to ±1000 */
  cp?: number
  /** Mate in N moves from white's perspective (positive = white mates, negative = black mates) */
  mate?: number
}

export interface UciInfoLine {
  score: UciScore
  depth?: number
  pv?: string[]
}

export interface BestMoveLine {
  bestMove: string
  ponder?: string
}

/**
 * Parse a UCI "info" line and extract score and principal variation.
 * Returns null if the line is not an info line with a score.
 */
export function parseInfoLine(line: string): UciInfoLine | null {
  if (!line.startsWith('info ') || !line.includes(' score ')) {
    return null
  }

  const result: UciInfoLine = { score: {} }

  // Parse depth
  const depthMatch = line.match(/\bdepth (\d+)/)
  if (depthMatch) {
    result.depth = parseInt(depthMatch[1], 10)
  }

  // Parse score cp or score mate
  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  const mateMatch = line.match(/\bscore mate (-?\d+)/)

  if (cpMatch) {
    result.score.cp = parseInt(cpMatch[1], 10)
  } else if (mateMatch) {
    result.score.mate = parseInt(mateMatch[1], 10)
  }

  // Parse PV (principal variation)
  const pvMatch = line.match(/\bpv (.+)$/)
  if (pvMatch) {
    result.pv = pvMatch[1].trim().split(/\s+/)
  }

  return result
}

/**
 * Parse a UCI "bestmove" line.
 * Returns null if the line is not a bestmove line.
 */
export function parseBestMove(line: string): BestMoveLine | null {
  const match = line.match(/^bestmove (\S+)(?:\s+ponder (\S+))?/)
  if (!match) {
    return null
  }
  return {
    bestMove: match[1],
    ponder: match[2] ?? undefined,
  }
}

/**
 * Normalize a UCI score to white's perspective.
 * If it's black's turn, the engine reports scores from black's POV,
 * so we flip the sign.
 *
 * Mate scores are converted to ±1000.
 * All cp values are clamped to ±1000.
 */
export function normalizeScore(
  score: UciScore,
  turn: 'w' | 'b'
): number {
  const flipSign = turn === 'b' ? -1 : 1

  if (score.mate !== undefined) {
    // Mate in N: positive means the side to move mates.
    // From white's perspective: flip if black to move.
    const mateValue = score.mate > 0 ? 1000 : -1000
    return mateValue * flipSign
  }

  if (score.cp !== undefined) {
    const cpFromWhite = score.cp * flipSign
    return Math.max(-1000, Math.min(1000, cpFromWhite))
  }

  return 0
}
