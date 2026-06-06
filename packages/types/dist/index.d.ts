export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type ShortdeckRank = '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export interface Card {
    rank: Rank;
    suit: Suit;
}
export interface ShortdeckCard {
    rank: ShortdeckRank;
    suit: Suit;
}
export type CardString = string;
export type BoardString = string;
export type GameType = 'nlh' | 'plo4' | 'plo5' | 'omaha_hi_lo' | 'shortdeck' | 'double_board_plo' | 'bomb_pot';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type Position = 'utg' | 'utg1' | 'utg2' | 'lj' | 'hj' | 'co' | 'btn' | 'sb' | 'bb' | 'straddle';
export declare const POSITION_ORDER: Position[];
export interface HoleCards {
    cards: Card[];
    string: string;
}
export interface OmahaHoleCards {
    cards: Card[];
    string: string;
}
export interface ShortdeckHoleCards {
    cards: ShortdeckCard[];
    string: string;
}
export type HoleCards_ANY = HoleCards | OmahaHoleCards | ShortdeckHoleCards;
export interface Board {
    cards: Card[];
    string: BoardString;
    street: Street;
}
export interface ShortdeckBoard {
    cards: ShortdeckCard[];
    string: BoardString;
    street: Street;
}
export type BoardTexture = 'dry' | 'wet' | 'paired' | 'trips' | 'straight' | 'flush' | 'full_house';
export interface BoardTextureAnalysis {
    texture: BoardTexture[];
    connectedness: number;
    dryness: number;
}
export type HandRange = string;
export interface ComposedRange {
    range: HandRange;
    combos: number;
}
export interface PositionRange {
    position: Position;
    range: HandRange;
    combos: number;
}
export interface EquityResult {
    hand: string;
    equity: number;
    ev: number;
    wins: number;
    ties: number;
    samples: number;
}
export interface MultiWayEquityResult {
    hand: string;
    equities: number[];
    ev: number;
    wins: number;
    ties: number;
    samples: number;
}
export interface EquityBreakdown {
    premiums: number;
    strong_pairs: number;
    suited_connectors: number;
    suited_gappers: number;
    offsuit_connectors: number;
    offsuit_gappers: number;
    broadways: number;
    wheel_aces: number;
    small_pairs: number;
}
export type Action = 'raise' | 'call' | 'fold' | 'check' | 'bet' | 'bet_big' | 'bet_small';
export interface GTOStrategy {
    action: Action;
    frequency: number;
    ev: number;
    size?: number;
}
export interface GTOStrategyProfile {
    position: Position;
    street: Street;
    strategies: GTOStrategy[];
    hand?: string;
}
export interface MixedStrategy {
    primary: GTOStrategy;
    alternatives: GTOStrategy[];
    mixing_freq?: number;
}
export type SolveStatus = 'queued' | 'running' | 'complete' | 'error' | 'cancelled' | 'timeout';
export interface SolveProgress {
    iterations: number;
    convergence: number;
    ev_convergence: number;
    time_elapsed: number;
    estimated_time_remaining?: number;
}
export interface SolveJob {
    id: string;
    game_type: GameType;
    status: SolveStatus;
    progress: number;
    progress_detail?: SolveProgress;
    result?: GTOStrategy[];
    result_url?: string;
    error?: string;
    created_at: string;
    completed_at?: string;
}
export interface SolveRequest {
    game_type: GameType;
    hero_position: Position;
    villain_position: Position[];
    hero_range: HandRange;
    villain_range: HandRange[];
    board?: BoardString;
    street: Street;
    pot_size?: number;
    effective_stack?: number;
    rake?: number;
    icm?: boolean;
}
export interface RangeSelection {
    hero: HandRange;
    villain: HandRange;
    board?: BoardString;
}
export interface MultiWayRangeSelection {
    hero: HandRange;
    opponents: {
        position: Position;
        range: HandRange;
    }[];
    board?: BoardString;
}
export type SpotCategory = 'open_raise' | 'vs_open_raise' | 'three_bet' | 'vs_three_bet' | 'four_bet' | 'vs_four_bet' | 'five_bet' | 'steal_attempt' | 'vs_steal_attempt' | 'squeeze' | 'vs_squeeze' | 'float' | 'vs_float' | 'turn_lead' | 'vs_turn_lead' | 'river_lead' | 'vs_river_lead' | 'donk' | 'vs_donk' | 'check_raise' | 'vs_check_raise';
export interface SpotInfo {
    category: SpotCategory;
    description: string;
    street: Street;
    positions: Position[];
}
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface DifficultyInfo {
    difficulty: Difficulty;
    combos_range: {
        min: number;
        max: number;
    };
    description: string;
}
export interface ICMPlayer {
    name: string;
    stack: number;
    prize_multiplier?: number;
    position?: Position;
    is_in_hand: boolean;
}
export interface ICMResult {
    players: ICMPlayer[];
    equities: number[];
    equity_values: number[];
    prize_structure?: number[];
    chop_equities?: number[];
}
export interface BombPotState {
    initial_pot: number;
    straddle_amount: number;
    players: {
        name: string;
        stack: number;
        position: Position;
    }[];
    cards_dealt: boolean;
    board?: BoardString;
    current_pot: number;
}
export interface BombPotResult {
    winning_hand: string;
    equity: number;
    pot_distribution: number[];
}
export interface DoubleBoardResult {
    hero_hand: string;
    board1: BoardString;
    board2: BoardString;
    hand1_equity: number;
    hand2_equity: number;
    combined_equity: number;
    wins_board1: number;
    wins_board2: number;
    ties: number;
    winning_hands?: {
        board1?: string;
        board2?: string;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        request_id: string;
        timestamp: string;
        version: string;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}
export interface OmahaHiLoHoleCards {
    cards: Card[];
    string: string;
    is_qualified: boolean;
}
export interface OmahaHiLoResult extends EquityResult {
    high_equity: number;
    low_equity: number;
    Scoops: number;
    high_wins: number;
    low_wins: number;
    hi_lo_wins: number;
    tie_split: number;
}
