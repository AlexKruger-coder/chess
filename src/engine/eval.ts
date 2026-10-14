import type { AnalysisResult } from './stockfish'

export function evalToBarPercent(cp: number): number {
  const percent = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
  // Round to 4 decimal places, then clamp — avoids floating-point artifacts
  // like 99.999999 instead of 100 for large mate scores
  return Math.max(0, Math.min(100, Math.round(percent * 1e4) / 1e4))
}

export function formatEval(result: AnalysisResult | null): string {
  if (result === null) return '—'
  if (result.cp !== undefined) {
    const pawns = result.cp / 100
    if (pawns > 0) return `+${pawns.toFixed(2)}`
    return pawns.toFixed(2)
  }
  if (result.mate !== undefined) {
    const rawMoves = Math.abs(result.mate)
    const moves = rawMoves >= 1000 ? Math.round(rawMoves / 1000) : rawMoves
    const sign = result.mate < 0 ? '-' : ''
    return `M${sign}${moves}`
  }
  return '—'
}

export function evalFromResult(result: AnalysisResult | null | undefined): number {
  if (!result) return 0
  if (result.mate !== undefined) {
    return result.mate > 0 ? 1000 : result.mate < 0 ? -1000 : 0
  }
  if (result.cp !== undefined) {
    return Math.max(-1000, Math.min(1000, result.cp))
  }
  return 0
}

