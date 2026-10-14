export type MoveClassification = 'best' | 'brilliant' | 'good' | 'interesting' | 'questionable' | 'blunder' | 'mistake' | 'inaccuracy'

export interface ClassificationThresholds {
  blunder: number
  mistake: number
  inaccuracy: number
}

export const DEFAULT_THRESHOLDS: ClassificationThresholds = {
  blunder: 300,
  mistake: 100,
  inaccuracy: 50,
}

export interface MoveAnalysis {
  moveNumber: number
  san: string
  from: string
  to: string
  promotion?: string
  color: 'w' | 'b'
  prevEval: number | null
  postEval: number | null
  bestMove?: string
  isBestMove: boolean
  classification: MoveClassification
}

interface ClassifyOpts {
  prevEval: number | null
  postEval: number | null
  color: 'w' | 'b'
  bestMoveUci?: string
  playedUci: string
  thresholds?: ClassificationThresholds
}

export function classifyMove(opts: ClassifyOpts): MoveClassification {
  const { prevEval, postEval, color, bestMoveUci, playedUci, thresholds = DEFAULT_THRESHOLDS } = opts

  if (bestMoveUci && playedUci.startsWith(bestMoveUci)) {
    return 'best'
  }

  if (prevEval === null || postEval === null) {
    return 'good'
  }

  let loss: number
  if (color === 'w') {
    loss = prevEval - postEval
  } else {
    loss = postEval - prevEval
  }

  if (loss < 0) {
    return Math.abs(loss) >= thresholds.blunder ? 'brilliant' : 'good'
  }

  if (loss >= thresholds.blunder) return 'blunder'
  if (loss >= thresholds.mistake) return 'mistake'
  if (loss >= thresholds.inaccuracy) return 'inaccuracy'
  return 'good'
}

export function calculateLoss(prevEval: number | null, postEval: number | null, color: 'w' | 'b'): number {
  if (prevEval === null || postEval === null) return 0
  if (color === 'w') {
    return Math.max(0, prevEval - postEval)
  } else {
    return Math.max(0, postEval - prevEval)
  }
}