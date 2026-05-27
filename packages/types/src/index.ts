// ============================================================================
// GTO Wizard Types - Comprehensive TypeScript Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// Core Card & Rank Types
// ----------------------------------------------------------------------------

export type Suit = 'h' | 'd' | 'c' | 's'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
export type ShortdeckRank = '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

export interface ShortdeckCard {
  rank: ShortdeckRank
  suit: Suit
}

// Card string format: "Kd", "7h", "Ac", "Ts"
export type CardString = string

// Board string format: "Kd7h2c" (flop) or "Kd7h2cAh" (turn) or "Kd7h2cAh4d" (river)
export type BoardString = string

// ----------------------------------------------------------------------------
// Game Variants
// ----------------------------------------------------------------------------

export type GameType =
  | 'nlh'           // No-Limit Hold'em
  | 'plo4'          // Pot-Limit Omaha 4-card
  | 'plo5'          // Pot-Limit Omaha 5-card
  | 'omaha_hi_lo'   // Omaha Hi/Lo
  | 'shortdeck'     // Shortdeck (6+ Hold'em)
  | 'double_board_plo' // Double Board PLO
  | 'bomb_pot'      // Bomb Pot (straddle games)

// ----------------------------------------------------------------------------
// Streets
// ----------------------------------------------------------------------------

export type Street = 'preflop' | 'flop' | 'turn' | 'river'

// ----------------------------------------------------------------------------
// Positions
// ----------------------------------------------------------------------------

export type Position =
  | 'utg'   // Under the gun
  | 'utg1'  // Under the gun + 1
  | 'utg2'  // Under the gun + 2
  | 'lj'    // Lojack
  | 'hj'    // Hijack
  | 'co'    // Cutoff
  | 'btn'   // Button
  | 'sb'    // Small Blind
  | 'bb'    // Big Blind
  | 'straddle' // Straddle position (when applicable)

export const POSITION_ORDER: Position[] = [
  'utg',
  'utg1',
  'utg2',
  'lj',
  'hj',
  'co',
  'btn',
  'sb',
  'bb',
  'straddle',
]

// ----------------------------------------------------------------------------
// Hole Cards
// ----------------------------------------------------------------------------

export interface HoleCards {
  cards: Card[]
  string: string // e.g., "AA", "AKs", "KQo"
}

export interface OmahaHoleCards {
  cards: Card[] // 4 cards for PLO4, 5 cards for PLO5
  string: string // e.g., "AAKK", "A234s"
}

export interface ShortdeckHoleCards {
  cards: ShortdeckCard[]
  string: string
}

// Generic hole cards type
export type HoleCards_ANY = HoleCards | OmahaHoleCards | ShortdeckHoleCards

// ----------------------------------------------------------------------------
// Board
// ----------------------------------------------------------------------------

export interface Board {
  cards: Card[]
  string: BoardString
  street: Street
}

export interface ShortdeckBoard {
  cards: ShortdeckCard[]
  string: BoardString
  street: Street
}

// ----------------------------------------------------------------------------
// Board Texture
// ----------------------------------------------------------------------------

export type BoardTexture =
  | 'dry'       // Low connectedness, rainbows
  | 'wet'       // High connectedness, mono/bicolor
  | 'paired'    // Contains pairs
  | 'trips'     // Contains trips
  | 'straight'  // Straight possible
  | 'flush'     // Flush possible
  | 'full_house' // Full house possible

export interface BoardTextureAnalysis {
  texture: BoardTexture[]
  connectedness: number // 0-1 scale
  dryness: number // 0-1 scale (1 = dry)
}

// ----------------------------------------------------------------------------
// Hand Range
// ----------------------------------------------------------------------------

// Standard notation: "JJ+, AQs+, KJs", "22+", "AKo", "AQs"
export type HandRange = string

// Composed range with specific combos
export interface ComposedRange {
  range: HandRange
  combos: number
}

// Range for a specific position
export interface PositionRange {
  position: Position
  range: HandRange
  combos: number
}

// ----------------------------------------------------------------------------
// Equity Results
// ----------------------------------------------------------------------------

export interface EquityResult {
  hand: string
  equity: number // Percentage (0-100)
  ev: number     // Expected value in big blinds
  wins: number
  ties: number
  samples: number
}

export interface MultiWayEquityResult {
  hand: string
  equities: number[]        // Equity vs each opponent
  ev: number
  wins: number
  ties: number
  samples: number
}

// Detailed equity breakdown by hand category
export interface EquityBreakdown {
  premiums: number    // AA, KK, QQ, JJ, TT
  strong_pairs: number // 99-77
  suited_connectors: number
  suited_gappers: number
  offsuit_connectors: number
  offsuit_gappers: number
  broadways: number
  wheel_aces: number
  small_pairs: number  // 66-22
}

// ----------------------------------------------------------------------------
// GTO Strategy
// ----------------------------------------------------------------------------

export type Action = 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'bet_big' | 'bet_small'

export interface GTOStrategy {
  action: Action
  frequency: number    // 0-1 scale
  ev: number           // Expected value in big blinds
  size?: number        // Pot fraction for raises/bets (e.g., 0.67 for 2/3 pot)
}

export interface GTOStrategyProfile {
  position: Position
  street: Street
  strategies: GTOStrategy[]
  hand?: string // When specific to a hand
}

// Mixed strategy with multiple actions
export interface MixedStrategy {
  primary: GTOStrategy
  alternatives: GTOStrategy[]
  mixing_freq?: number // How often to mix between alternatives
}

// ----------------------------------------------------------------------------
// Solve Job
// ----------------------------------------------------------------------------

export type SolveStatus =
  | 'queued'
  | 'running'
  | 'complete'
  | 'error'
  | 'cancelled'
  | 'timeout'

export interface SolveProgress {
  iterations: number
  convergence: number      // 0-1 scale
  ev_convergence: number   // EV change between iterations
  time_elapsed: number     // seconds
  estimated_time_remaining?: number // seconds
}

export interface SolveJob {
  id: string
  game_type: GameType
  status: SolveStatus
  progress: number // 0-100
  progress_detail?: SolveProgress
  result?: GTOStrategy[]
  result_url?: string
  error?: string
  created_at: string
  completed_at?: string
}

export interface SolveRequest {
  game_type: GameType
  hero_position: Position
  villain_position: Position[]
  hero_range: HandRange
  villain_range: HandRange[]
  board?: BoardString
  street: Street
  pot_size?: number
  effective_stack?: number
  rake?: number
  icm?: boolean
}

// ----------------------------------------------------------------------------
// Range Selection
// ----------------------------------------------------------------------------

export interface RangeSelection {
  hero: HandRange
  villain: HandRange
  board?: BoardString
}

export interface MultiWayRangeSelection {
  hero: HandRange
  opponents: { position: Position; range: HandRange }[]
  board?: BoardString
}

// ----------------------------------------------------------------------------
// Spot Category
// ----------------------------------------------------------------------------

export type SpotCategory =
  | 'open_raise'
  | 'vs_open_raise'
  | 'three_bet'
  | 'vs_three_bet'
  | 'four_bet'
  | 'vs_four_bet'
  | 'five_bet'
  | 'steal_attempt'
  | 'vs_steal_attempt'
  | 'squeeze'
  | 'vs_squeeze'
  | 'float'
  | 'vs_float'
  | 'turn_lead'
  | 'vs_turn_lead'
  | 'river_lead'
  | 'vs_river_lead'
  | 'donk'
  | 'vs_donk'
  | 'check_raise'
  | 'vs_check_raise'

export interface SpotInfo {
  category: SpotCategory
  description: string
  street: Street
  positions: Position[]
}

// ----------------------------------------------------------------------------
// Difficulty
// ----------------------------------------------------------------------------

export type Difficulty =
  | 'beginner'    // ~100 combinations, basic situations
  | 'intermediate' // ~500 combinations, common situations
  | 'advanced'    // ~1000 combinations, complex situations
  | 'expert'      // ~2000+ combinations, GTO solutions

export interface DifficultyInfo {
  difficulty: Difficulty
  combos_range: { min: number; max: number }
  description: string
}

// ----------------------------------------------------------------------------
// ICM (Independent Chip Model)
// ----------------------------------------------------------------------------

export interface ICMPlayer {
  name: string
  stack: number          // Chips
  prize_multiplier?: number // For tournament prize equivalent
  position?: Position
  is_in_hand: boolean
}

export interface ICMResult {
  players: ICMPlayer[]
  equities: number[]        // Each player's equity percentage
  equity_values: number[]   // Each player's expected value in dollars
  prize_structure?: number[] // Prize pool distribution
  chop_equities?: number[]  // Fractions for chop if applicable
}

// ----------------------------------------------------------------------------
// Bomb Pot
// ----------------------------------------------------------------------------

export interface BombPotState {
  initial_pot: number
  straddle_amount: number
  players: { name: string; stack: number; position: Position }[]
  cards_dealt: boolean
  board?: BoardString
  current_pot: number
}

export interface BombPotResult {
  winning_hand: string
  equity: number
  pot_distribution: number[]
}

// ----------------------------------------------------------------------------
// Double Board PLO
// ----------------------------------------------------------------------------

export interface DoubleBoardResult {
  hero_hand: string
  board1: BoardString
  board2: BoardString
  hand1_equity: number           // Equity on board 1
  hand2_equity: number           // Equity on board 2
  combined_equity: number        // Combined/multiplied equity
  wins_board1: number
  wins_board2: number
  ties: number
  winning_hands?: { board1?: string; board2?: string }
}

// ----------------------------------------------------------------------------
// API Response
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    request_id: string
    timestamp: string
    version: string
  }
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// ----------------------------------------------------------------------------
// Additional Types for Omaha Hi/Lo
// ----------------------------------------------------------------------------

export interface OmahaHiLoHoleCards {
  cards: Card[] // 4 cards
  string: string
  is_qualified: boolean // Whether hand qualifies for lo
}

export interface OmahaHiLoResult extends EquityResult {
  high_equity: number
  low_equity: number
  Scoops: number      // Times hand won both hi and lo
  high_wins: number
  low_wins: number
  hi_lo_wins: number
  tie_split: number
}

// ----------------------------------------------------------------------------
// Export all types
// ----------------------------------------------------------------------------

export type {
  Card,
  ShortdeckCard,
  CardString,
  BoardString,
  GameType,
  Street,
  Position,
  PositionRange,
  HoleCards,
  OmahaHoleCards,
  ShortdeckHoleCards,
  HoleCards_ANY,
  Board,
  ShortdeckBoard,
  BoardTexture,
  BoardTextureAnalysis,
  HandRange,
  ComposedRange,
  EquityResult,
  MultiWayEquityResult,
  EquityBreakdown,
  GTOStrategy,
  GTOStrategyProfile,
  MixedStrategy,
  SolveJob,
  SolveStatus,
  SolveProgress,
  SolveRequest,
  RangeSelection,
  MultiWayRangeSelection,
  SpotCategory,
  SpotInfo,
  Difficulty,
  DifficultyInfo,
  ICMPlayer,
  ICMResult,
  BombPotState,
  BombPotResult,
  DoubleBoardResult,
  ApiResponse,
  PaginatedResponse,
  OmahaHiLoHoleCards,
  OmahaHiLoResult,
}
