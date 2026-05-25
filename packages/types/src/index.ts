export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
export type Card = { rank: Rank; suit: Suit }
export type HandRange = string  // e.g., "JJ+, AQs+, KJs"
export type Board = string       // e.g., "Kd7h2c"
export interface EquityResult {
  hand: string
  equity: number
  ev: number
  wins: number
  ties: number
}
export interface GTOStrategy {
  action: 'raise' | 'call' | 'fold'
  frequency: number
  ev: number
}
export interface SolveJob {
  id: string
  status: 'queued' | 'running' | 'complete' | 'error'
  progress: number
  result?: GTOStrategy[]
}
export interface RangeSelection {
  hero: HandRange
  villain: HandRange
  board?: Board
}