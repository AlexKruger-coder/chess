import {
  parseBestMove,
  parseInfoLine,
  normalizeScore,
  type UciInfoLine,
} from './uciParser'

export interface AnalysisResult {
  cp?: number
  mate?: number
  bestMove: string
}

interface AnalyzeRequest {
  fen: string
  depth: number
  resolve: (value: AnalysisResult) => void
  reject: (reason?: unknown) => void
}

export class StockfishEngine {
  private worker: Worker
  private ready = false
  private queue: AnalyzeRequest[] = []
  private current: AnalyzeRequest | null = null
  private lastInfo: UciInfoLine | null = null

  constructor() {
    this.worker = new Worker(
      new URL('/stockfish/' + 'stockfish-19-lite-single.js', import.meta.url),
      { type: 'classic' }
    )
    this.worker.onmessage = (e: MessageEvent) => this.onMessage(e.data as string)
    this.send('uci')
  }

  private send(command: string): void {
    this.worker.postMessage(command)
  }

  private onMessage(data: string): void {
    const line = data.trim()
    if (line === 'uciok') {
      this.send('isready')
      return
    }
    if (line === 'readyok') {
      this.ready = true
      this.processQueue()
      return
    }
    if (line.startsWith('info ')) {
      const info = parseInfoLine(line)
      if (info) this.lastInfo = info
      return
    }
    const best = parseBestMove(line)
    if (best) {
      this.resolveCurrent(best.bestMove)
    }
  }

  private processQueue(): void {
    if (!this.ready) return
    if (this.current) return
    const req = this.queue.shift()
    if (!req) return
    this.current = req
    this.lastInfo = null
    this.send('isready')
    this.send(`position fen ${req.fen}`)
    this.send(`go depth ${req.depth}`)
  }

  private resolveCurrent(bestMove: string): void {
    const req = this.current
    if (!req) return
    this.current = null
    req.resolve(this.buildResult(bestMove, req.fen))
    this.processQueue()
  }

  private turnFromFen(fen: string): 'w' | 'b' {
    const parts = fen.trim().split(/\s+/)
    return parts[1] === 'b' ? 'b' : 'w'
  }

  private buildResult(bestMove: string, fen: string): AnalysisResult {
    const result: AnalysisResult = { bestMove }
    if (this.lastInfo && this.lastInfo.score) {
      const turn = this.turnFromFen(fen)
      const score = this.lastInfo.score
      if (score.mate !== undefined) {
        result.mate = normalizeScore(score, turn)
      } else if (score.cp !== undefined) {
        result.cp = normalizeScore(score, turn)
      }
    }
    return result
  }

  analyze(fen: string, depth: number): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fen, depth, resolve, reject })
      this.processQueue()
    })
  }

  stop(): void {
    this.send('stop')
  }

  destroy(): void {
    this.worker.terminate()
  }
}


