"use client";

import { useState, useCallback, useMemo } from "react";
import { cn, RANKS, getHand, getHandIndex } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type Street = "preflop" | "flop" | "turn" | "river";

export type ActionType = 
  | "push_fold"      // All-in or fold (short stack situations)
  | "bet_call_check" // Bet, call, or check (standard action)
  | "raise_call_fold" // Raise, call, or fold
  | "bet_raise_call_check"; // Full action spectrum

export interface StrategyCell {
  action: string;
  frequency: number;
  ev: number;
}

export interface StrategyHeatmapProps {
  /** Strategy data keyed by hand string (e.g., "AKs", "TT", "72o") */
  strategy: Record<string, StrategyCell>;
  /** Board cards as concatenated string (e.g., "AhKs2d") */
  boardCards?: string;
  /** Position label (e.g., "BTN", "SB", "BB") */
  position?: string;
  /** Current player identifier */
  currentPlayer?: string;
  /** Type of actions to display */
  actionType?: ActionType;
  /** Street indicator */
  street?: Street;
  /** Custom className */
  className?: string;
  /** Callback when a cell is clicked */
  onCellClick?: (hand: string, data: StrategyCell | undefined) => void;
  /** Whether to show EV values instead of frequencies */
  showEv?: boolean;
  /** Whether to show frequency percentages */
  showFrequency?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const ACTION_COLORS: Record<string, { bg: string; bgHover: string; text: string; border: string }> = {
  // Push/Fold actions
  push: {
    bg: "bg-emerald-500",
    bgHover: "hover:bg-emerald-600",
    text: "text-emerald-100",
    border: "border-emerald-600",
  },
  fold: {
    bg: "bg-red-600",
    bgHover: "hover:bg-red-700",
    text: "text-red-100",
    border: "border-red-700",
  },
  // Standard actions
  raise: {
    bg: "bg-green-500",
    bgHover: "hover:bg-green-600",
    text: "text-green-100",
    border: "border-green-600",
  },
  call: {
    bg: "bg-yellow-500",
    bgHover: "hover:bg-yellow-600",
    text: "text-yellow-100",
    border: "border-yellow-600",
  },
  check: {
    bg: "bg-blue-500",
    bgHover: "hover:bg-blue-600",
    text: "text-blue-100",
    border: "border-blue-600",
  },
  // Bet actions (sizing-dependent)
  bet_small: {
    bg: "bg-cyan-500",
    bgHover: "hover:bg-cyan-600",
    text: "text-cyan-100",
    border: "border-cyan-600",
  },
  bet_medium: {
    bg: "bg-teal-500",
    bgHover: "hover:bg-teal-600",
    text: "text-teal-100",
    border: "border-teal-600",
  },
  bet_large: {
    bg: "bg-emerald-600",
    bgHover: "hover:bg-emerald-700",
    text: "text-emerald-100",
    border: "border-emerald-700",
  },
  // Default
  default: {
    bg: "bg-gray-600",
    bgHover: "hover:bg-gray-500",
    text: "text-gray-200",
    border: "border-gray-500",
  },
};

const ACTION_TYPE_CONFIG: Record<ActionType, { actions: string[]; labels: Record<string, string> }> = {
  push_fold: {
    actions: ["push", "fold"],
    labels: { push: "Push", fold: "Fold" },
  },
  bet_call_check: {
    actions: ["bet", "call", "check"],
    labels: { bet: "Bet", call: "Call", check: "Check" },
  },
  raise_call_fold: {
    actions: ["raise", "call", "fold"],
    labels: { raise: "Raise", call: "Call", fold: "Fold" },
  },
  bet_raise_call_check: {
    actions: ["bet", "raise", "call", "check"],
    labels: { bet: "Bet", raise: "Raise", call: "Call", check: "Check" },
  },
};

const STREET_LABELS: Record<Street, string> = {
  preflop: "Preflop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};

// ============================================================================
// Helper Functions
// ============================================================================

function parseBoard(boardString: string): { flop: string[]; turn: string | null; river: string | null } {
  const cards: string[] = [];
  for (let i = 0; i < boardString.length - 1; i += 2) {
    cards.push(boardString.slice(i, i + 2));
  }
  return {
    flop: cards.slice(0, 3),
    turn: cards[3] || null,
    river: cards[4] || null,
  };
}

function getActionColor(action: string): typeof ACTION_COLORS["default"] {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("push") || lowerAction.includes("allin")) return ACTION_COLORS.push;
  if (lowerAction.includes("bet_small")) return ACTION_COLORS.bet_small;
  if (lowerAction.includes("bet_medium")) return ACTION_COLORS.bet_medium;
  if (lowerAction.includes("bet_large")) return ACTION_COLORS.bet_large;
  if (lowerAction.includes("bet")) return ACTION_COLORS.bet_medium;
  if (lowerAction.includes("raise")) return ACTION_COLORS.raise;
  if (lowerAction.includes("call")) return ACTION_COLORS.call;
  if (lowerAction.includes("check")) return ACTION_COLORS.check;
  if (lowerAction.includes("fold")) return ACTION_COLORS.fold;
  return ACTION_COLORS.default;
}

// ============================================================================
// Components
// ============================================================================

interface LegendProps {
  actionType: ActionType;
  showEv: boolean;
}

function Legend({ actionType, showEv }: LegendProps) {
  const config = ACTION_TYPE_CONFIG[actionType];
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
      <span className="text-muted-foreground font-medium mr-1">
        {showEv ? "EV" : "Action"}:
      </span>
      {config.actions.map((action) => {
        const color = getActionColor(action);
        return (
          <div key={action} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-4 h-4 rounded border shadow-sm",
                color.bg,
                color.border
              )}
            />
            <span className="text-muted-foreground">
              {config.labels[action]}
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
        <div className="w-4 h-4 rounded bg-gray-800 opacity-50" />
        <span className="text-muted-foreground">No data</span>
      </div>
    </div>
  );
}

interface StreetIndicatorProps {
  street: Street;
  boardCards?: string;
}

function StreetIndicator({ street, boardCards }: StreetIndicatorProps) {
  const board = boardCards ? parseBoard(boardCards) : null;
  
  return (
    <div className="flex items-center gap-3 mb-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Street:</span>
        <span className="font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded">
          {STREET_LABELS[street]}
        </span>
      </div>
      {boardCards && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Board:</span>
          <span className="font-mono">
            {board?.flop && (
              <span className="inline-flex gap-0.5">
                {board.flop.map((card, i) => (
                  <span key={i} className="inline-block px-1.5 py-0.5 bg-secondary rounded text-xs">
                    {card}
                  </span>
                ))}
                {board.turn && (
                  <span className="inline-block px-1.5 py-0.5 bg-secondary rounded text-xs ml-1">
                    {board.turn}
                  </span>
                )}
                {board.river && (
                  <span className="inline-block px-1.5 py-0.5 bg-secondary rounded text-xs ml-1">
                    {board.river}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

interface HeatmapCellProps {
  hand: string;
  data: StrategyCell | undefined;
  showEv: boolean;
  onCellClick?: (hand: string, data: StrategyCell | undefined) => void;
}

function HeatmapCell({ hand, data, showEv, onCellClick }: HeatmapCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const color = data ? getActionColor(data.action) : ACTION_COLORS.default;
  const opacity = data ? 0.3 + data.frequency * 0.7 : 0.3;
  
  const displayValue = useMemo(() => {
    if (!data) return "-";
    if (showEv) {
      return data.ev >= 0 ? `+${data.ev.toFixed(2)}` : data.ev.toFixed(2);
    }
    return `${(data.frequency * 100).toFixed(0)}`;
  }, [data, showEv]);
  
  return (
    <div
      className={cn(
        "w-8 h-8 rounded text-[10px] font-medium cursor-pointer transition-all flex items-center justify-center",
        color.bg,
        color.bgHover,
        data ? color.border : "border-gray-700",
        isHovered && data ? "ring-2 ring-white ring-offset-1 ring-offset-background z-10" : ""
      )}
      style={{ opacity }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCellClick?.(hand, data)}
      title={hand}
    >
      <span className={cn("truncate", color.text)}>
        {displayValue}
      </span>
    </div>
  );
}

interface TooltipData {
  hand: string;
  data: StrategyCell;
  x: number;
  y: number;
}

interface TooltipProps {
  tooltip: TooltipData | null;
  showEv: boolean;
  street: Street;
  position?: string;
}

function Tooltip({ tooltip, showEv, street, position }: TooltipProps) {
  if (!tooltip) return null;
  
  const { hand, data, x, y } = tooltip;
  
  // Parse hand to show rank info
  const handIndex = getHandIndex(hand);
  const isPair = handIndex?.row === handIndex?.col;
  const isSuited = hand.endsWith("s");
  const isOffsuit = hand.endsWith("o");
  const handType = isPair ? "Pocket Pair" : isSuited ? "Suited" : isOffsuit ? "Offsuit" : "Single";
  
  return (
    <div
      className="fixed z-50 px-3 py-2.5 text-xs bg-popover border border-border rounded-lg shadow-xl pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: x,
        top: y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="font-bold text-base">{hand}</span>
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
          {handType}
        </span>
      </div>
      <div className="space-y-1.5 text-muted-foreground">
        <div className="flex items-center justify-between gap-3">
          <span>Action:</span>
          <span className={cn("font-semibold", getActionColor(data.action).text)}>
            {data.action.charAt(0).toUpperCase() + data.action.slice(1)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Frequency:</span>
          <span className="font-medium">{(data.frequency * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>EV:</span>
          <span className={cn("font-medium", data.ev >= 0 ? "text-green-500" : "text-red-500")}>
            {data.ev >= 0 ? "+" : ""}{data.ev.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground flex gap-3">
        <span>{STREET_LABELS[street]}</span>
        {position && <span>• {position}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StrategyHeatmap({
  strategy,
  boardCards,
  position,
  currentPlayer,
  actionType = "raise_call_fold",
  street = "preflop",
  className,
  onCellClick,
  showEv = false,
  showFrequency = true,
}: StrategyHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  
  const handleCellMouseEnter = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    hand: string,
    data: StrategyCell | undefined
  ) => {
    if (data) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        hand,
        data,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, []);
  
  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);
  
  // Calculate summary stats
  const stats = useMemo(() => {
    const entries = Object.values(strategy);
    if (entries.length === 0) return null;
    
    const totalFrequency = entries.reduce((sum, e) => sum + e.frequency, 0) / entries.length;
    const avgEv = entries.reduce((sum, e) => sum + e.ev, 0) / entries.length;
    const actionCounts = entries.reduce((acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalFrequency, avgEv, actionCounts };
  }, [strategy]);
  
  return (
    <div className={cn("relative", className)}>
      {/* Header with stats */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex flex-col gap-2">
          <StreetIndicator street={street} boardCards={boardCards} />
          <Legend actionType={actionType} showEv={showEv} />
        </div>
        
        {/* Summary Stats */}
        {stats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Avg Freq:</span>
              <span className="font-medium">{(stats.totalFrequency * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Avg EV:</span>
              <span className={cn("font-medium", stats.avgEv >= 0 ? "text-green-500" : "text-red-500")}>
                {stats.avgEv >= 0 ? "+" : ""}{stats.avgEv.toFixed(3)}
              </span>
            </div>
            {position && (
              <div className="flex items-center gap-1.5">
                <span>Pos:</span>
                <span className="font-medium">{position}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Heatmap grid */}
      <div className="inline-grid gap-0.5 bg-gray-800/50 p-2 rounded-lg border border-border">
        {/* Top-left corner */}
        <div className="w-8 h-8 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">/</span>
        </div>
        
        {/* Column headers (opponent's cards / columns) */}
        {RANKS.map((rank) => (
          <div
            key={`col-${rank}`}
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground"
          >
            {rank}
          </div>
        ))}
        
        {/* Rows */}
        {RANKS.map((rank, row) => (
          <div key={`row-${rank}`} className="contents">
            {/* Row header (your cards) */}
            <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {rank}
            </div>
            
            {/* Hand cells */}
            {RANKS.map((_, col) => {
              const hand = getHand(row, col);
              const data = strategy[hand];
              
              return (
                <HeatmapCell
                  key={hand}
                  hand={hand}
                  data={data}
                  showEv={showEv}
                  onCellClick={onCellClick}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
        <span>Your Hand →</span>
        <span>← Opponent's Hand</span>
      </div>
      
      {/* Diagonal indicator (your cards vs opponent's) */}
      <div className="absolute top-0 left-0 text-[9px] text-muted-foreground/50 -rotate-45 origin-bottom-left ml-10 mt-2">
        (Diagonal = pocket pairs)
      </div>
      
      {/* Tooltip */}
      <Tooltip
        tooltip={tooltip}
        showEv={showEv}
        street={street}
        position={position}
      />
      
      {/* EV Legend Scale */}
      {showEv && (
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>EV Scale:</span>
          <div className="flex items-center gap-1">
            <div className="w-20 h-2 rounded bg-gradient-to-r from-red-600 via-yellow-500 to-green-600" />
            <span>Low</span>
            <span className="ml-1">High</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategyHeatmap;
