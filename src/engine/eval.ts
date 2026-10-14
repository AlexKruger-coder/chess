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
    const moves = Math.abs(result.mate / 1000)
    const sign = result.mate < 0 ? '-' : ''
    return `M${sign}${moves}`
  }
  return '—'
}
