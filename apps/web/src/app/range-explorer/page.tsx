"use client";

import { useState, useMemo, useCallback } from "react";
import { RangeGrid, type CellData } from "@/components/equity/RangeGrid";
import { RANKS, getHand, getHandIndex } from "@/lib/utils";
import {
  useStrategyLookup,
  parseBoardToStreet,
  getCommonPositions,
  getCommonStackDepths,
  getCommonBoards,
} from "@/hooks/useStrategyLookup";
import { cn } from "@/lib/utils";

// ============================================================================
// Range String Parser
// ============================================================================

/**
 * Parse a range string like "AA, AKs, KQs-TQs, 77+" into a Set of hand strings.
 * Supports:
 * - Individual hands: AA, AKs, KQo
 * - Plus ranges: 77+, AQs+, KJs+
 * - Dash ranges: AQs-AKs, T9s-T7s
 * - Comma-separated lists
 */
function parseRangeString(rangeStr: string): Set<string> {
  const selected = new Set<string>();
  const tokens = rangeStr.split(",").map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    // Handle "+" ranges: e.g. "77+" means 77 through AA
    if (token.endsWith("+")) {
      const base = token.slice(0, -1);
      const baseIdx = RANKS.indexOf(base[0] as typeof RANKS[number]);
      if (base.length === 2 && base[0] === base[1] && baseIdx >= 0) {
        // Pocket pair range: 77+
        for (let i = baseIdx; i < RANKS.length; i++) {
          selected.add(`${RANKS[i]}${RANKS[i]}`);
        }
      } else if (base.length === 3 && base[2] === "s" && baseIdx >= 0) {
        // Suited range: AQs+
        const secondRank = base[1];
        const secondIdx = RANKS.indexOf(secondRank as typeof RANKS[number]);
        for (let i = baseIdx; i < RANKS.length; i++) {
          for (let j = secondIdx; j < RANKS.length; j++) {
            if (i !== j) {
              selected.add(`${RANKS[i]}${RANKS[j]}s`);
            }
          }
        }
      } else if (base.length === 3 && base[2] === "o" && baseIdx >= 0) {
        // Offsuit range: AQo+
        const secondRank = base[1];
        const secondIdx = RANKS.indexOf(secondRank as typeof RANKS[number]);
        for (let i = baseIdx; i < RANKS.length; i++) {
          for (let j = secondIdx; j < RANKS.length; j++) {
            if (i !== j) {
              selected.add(`${RANKS[i]}${RANKS[j]}o`);
            }
          }
        }
      }
      continue;
    }

    // Handle dash ranges: e.g. "T9s-T7s"
    if (token.includes("-")) {
      const [start, end] = token.split("-").map((t) => t.trim());
      const startIdx = RANKS.indexOf(start[0] as typeof RANKS[number]);
      const endIdx = RANKS.indexOf(end[0] as typeof RANKS[number]);
      if (startIdx >= 0 && endIdx >= 0 && start.length >= 2 && end.length >= 2) {
        const isSuited = start.endsWith("s");
        const isOffsuit = start.endsWith("o");
        const step = startIdx <= endIdx ? 1 : -1;
        for (let i = startIdx; step > 0 ? i <= endIdx : i >= endIdx; i += step) {
          const secondRank = start[1];
          const secondIdx = RANKS.indexOf(secondRank as typeof RANKS[number]);
          if (secondIdx >= 0 && i !== secondIdx) {
            if (isSuited) selected.add(`${RANKS[i]}${RANKS[secondIdx]}s`);
            else if (isOffsuit) selected.add(`${RANKS[i]}${RANKS[secondIdx]}o`);
          }
        }
      }
      continue;
    }

    // Individual hand
    const hand = token.toUpperCase();
    if (hand.length === 2 || hand.length === 3) {
      selected.add(hand);
    }
  }

  return selected;
}

/**
 * Convert a Set of selected hands to a compact range string.
 * E.g. {AA, KK, QQ, AKs, AQs} -> "QQ+, AKs+"
 */
function handsToRangeString(hands: Set<string>): string {
  if (hands.size === 0) return "";

  const pairs: number[] = [];
  const suited: [number, number][] = [];
  const offsuit: [number, number][] = [];

  for (const hand of hands) {
    const idx = getHandIndex(hand);
    if (!idx) continue;
    if (hand.length === 2) {
      pairs.push(idx.row);
    } else if (hand.endsWith("s")) {
      suited.push([idx.row, idx.col]);
    } else if (hand.endsWith("o")) {
      offsuit.push([idx.row, idx.col]);
    }
  }

  const parts: string[] = [];

  // Pairs: find consecutive ranges
  if (pairs.length > 0) {
    const sorted = [...new Set(pairs)].sort((a, b) => a - b);
    let start = 0;
    for (let i = 1; i <= sorted.length; i++) {
      if (i === sorted.length || sorted[i] !== sorted[i - 1] + 1) {
        const range = sorted.slice(start, i);
        if (range.length >= 3) {
          parts.push(`${RANKS[range[range.length - 1]]}${RANKS[range[range.length - 1]]}+`);
        } else {
          for (const r of range) {
            parts.push(`${RANKS[r]}${RANKS[r]}`);
          }
        }
        start = i;
      }
    }
  }

  // Suited and offsuit: just list them
  for (const [r, c] of suited.sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    parts.push(`${RANKS[r]}${RANKS[c]}s`);
  }
  for (const [r, c] of offsuit.sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    parts.push(`${RANKS[r]}${RANKS[c]}o`);
  }

  return parts.join(", ");
}

// ============================================================================
// Types
// ============================================================================

type Position = "BTN" | "CO" | "HJ" | "LJ" | "SB" | "BB";

// ============================================================================
// Constants
// ============================================================================

const POSITIONS: Position[] = ["BTN", "CO", "HJ", "LJ", "SB", "BB"];

const STACK_DEPTHS = [50, 75, 100, 125, 150, 200];

const BOARD_PRESETS = [
  { label: "Preflop", board: "preflop" },
  { label: "QJ4r", board: "QhJd4c" },
  { label: "AK2r", board: "AhKd2c" },
  { label: "AK2 Two-Tone", board: "AhKh2c" },
  { label: "QJ9r", board: "QdJd9c" },
  { label: "T95r", board: "Td9d5c" },
  { label: "KQ8r", board: "KcQh8c" },
];

// ============================================================================
// Demo Data Generators
// ============================================================================

/**
 * Generate realistic-looking strategy data for a given board/position/stack.
 * Produces equity values that vary by hand strength — pairs are stronger,
 * suited connectors moderately strong, offsuit broadways mixed.
 */
function generateDemoData(
  _position: Position,
  _stackDepth: number,
  board: string
): Record<string, CellData> {
  const data: Record<string, CellData> = {};
  const isPreflop = !board || board.toLowerCase() === "preflop";

  for (let row = 0; row < RANKS.length; row++) {
    for (let col = 0; col < RANKS.length; col++) {
      const hand = getHand(row, col);
      const isPair = row === col;

      // Base equity from hand strength (higher row = stronger)
      let equity: number;
      let action: string;
      let frequency: number;

      if (isPair) {
        // Pairs: AA (row 0) = strongest, 22 (row 12) = ~45% preflop
        equity = isPreflop ? Math.max(42, 88 - row * 3.8) : 50 + Math.random() * 30;
        action = equity > 70 ? "raise" : equity > 50 ? "call" : "fold";
        frequency = Math.max(0.3, Math.min(1.0, equity / 100));
      } else if (row < col) {
        // Suited: stronger when ranks are close (connectors) or high
        const gap = col - row;
        const highCardBonus = Math.max(0, 12 - row) * 2;
        const connectorBonus = gap <= 2 ? 8 : 0;
        equity = isPreflop
          ? Math.max(35, 55 + highCardBonus * 0.5 + connectorBonus - gap * 1.5)
          : 35 + Math.random() * 35;
        action = equity > 60 ? "raise" : equity > 40 ? "call" : "fold";
        frequency = Math.max(0.2, Math.min(0.9, equity / 100));
      } else {
        // Offsuit: weaker overall
        const gap = row - col;
        const highCardBonus = Math.max(0, 12 - row) * 1.5;
        equity = isPreflop
          ? Math.max(28, 45 + highCardBonus * 0.4 - gap * 2.5)
          : 25 + Math.random() * 30;
        action = equity > 55 ? "raise" : equity > 35 ? "call" : "fold";
        frequency = Math.max(0.1, Math.min(0.8, equity / 120));
      }

      data[hand] = {
        hand,
        equity: Math.round(equity * 10) / 10,
        action,
        frequency: Math.round(frequency * 100) / 100,
        betSize: action === "raise" ? Math.round((_stackDepth / 4) * 10) / 10 : 0,
      };
    }
  }

  return data;
}

// ============================================================================
// Stats helpers
// ============================================================================

interface RangeStats {
  totalHands: number;
  totalCombos: number;
  percentage: string;
  pairs: number;
  suited: number;
  offsuit: number;
  avgEquity: number;
}

function computeRangeStats(data: Record<string, CellData>): RangeStats {
  let pairs = 0,
    suited = 0,
    offsuit = 0;
  let totalEquity = 0;
  let equityCount = 0;

  for (const [hand, cell] of Object.entries(data)) {
    if (hand.length === 2) pairs++;
    else if (hand.endsWith("s")) suited++;
    else if (hand.endsWith("o")) offsuit++;
    if (cell.equity !== undefined) {
      totalEquity += cell.equity;
      equityCount++;
    }
  }

  const total = pairs + suited + offsuit;
  const totalCombos = pairs * 6 + suited * 4 + offsuit * 12;
  const percentage = ((totalCombos / 1326) * 100).toFixed(1);
  const avgEquity = equityCount > 0 ? totalEquity / equityCount : 0;

  return {
    totalHands: total,
    totalCombos,
    percentage,
    pairs,
    suited,
    offsuit,
    avgEquity: Math.round(avgEquity * 10) / 10,
  };
}

// ============================================================================
// Sub-components
// ============================================================================

function RangeStatsCard({ stats }: { stats: RangeStats }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
        Range Breakdown
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Total combos</span>
          <span className="text-white font-semibold">{stats.totalCombos}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">% of hands</span>
          <span className="text-poker-gold font-semibold">{stats.percentage}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg equity</span>
          <span className="text-blue-400 font-semibold">{stats.avgEquity}%</span>
        </div>
        <div className="border-t border-gray-800 my-2" />
        <div className="flex justify-between">
          <span className="text-gray-400">Pocket pairs</span>
          <span className="text-amber-400 font-semibold">{stats.pairs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Suited</span>
          <span className="text-green-400 font-semibold">{stats.suited}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Offsuit</span>
          <span className="text-blue-400 font-semibold">{stats.offsuit}</span>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "strength" | "action";
  onChange: (m: "strength" | "action") => void;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
        Display Mode
      </h3>
      <div className="flex gap-2">
        <button
          onClick={() => onChange("strength")}
          className={cn(
            "flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors",
            mode === "strength"
              ? "bg-poker-gold text-black"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
          )}
        >
          Equity
        </button>
        <button
          onClick={() => onChange("action")}
          className={cn(
            "flex-1 px-3 py-2 rounded text-xs font-semibold transition-colors",
            mode === "action"
              ? "bg-poker-gold text-black"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
          )}
        >
          Action
        </button>
      </div>
      <p className="mt-2 text-[10px] text-gray-500">
        {mode === "strength"
          ? "Shades of green show hand equity percentage"
          : "Colors show action type (raise/call/fold) with frequency opacity"}
      </p>
    </div>
  );
}

function BoardPresetSelector({
  presets,
  activeBoard,
  onSelect,
}: {
  presets: typeof BOARD_PRESETS;
  activeBoard: string;
  onSelect: (board: string) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
        Board Presets
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.board}
            onClick={() => onSelect(preset.board)}
            className={cn(
              "px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors",
              activeBoard === preset.board
                ? "bg-poker-gold text-black"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium block mb-1">
          Custom Board
        </label>
        <input
          type="text"
          value={activeBoard === "preflop" ? "" : activeBoard}
          onChange={(e) => {
            const val = e.target.value.trim();
            onSelect(val || "preflop");
          }}
          placeholder="e.g. AhKd2c (preflop = empty)"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-poker-gold"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function RangeExplorerPage() {
  // Selection state
  const [selectedPosition, setSelectedPosition] = useState<Position>("BTN");
  const [selectedStack, setSelectedStack] = useState(100);
  const [board, setBoard] = useState("preflop");

  // Display mode
  const [displayMode, setDisplayMode] = useState<"strength" | "action">("strength");

  // Data source mode
  const [dataSource, setDataSource] = useState<"demo" | "api">("demo");

  // Interactive range builder state
  const [selectedHands, setSelectedHands] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [rangeInputError, setRangeInputError] = useState<string | null>(null);
  const [equityResult, setEquityResult] = useState<{
    hands: string[];
    equities: number[];
    board: string;
  } | null>(null);
  const [equityLoading, setEquityLoading] = useState(false);

  // API hook
  const { lookupStrategy, loading, error, lastResult } = useStrategyLookup();

  // Fetch from API
  const [apiData, setApiData] = useState<Record<string, CellData> | null>(null);

  const handleApiLookup = useCallback(async () => {
    setDataSource("api");
    const street = parseBoardToStreet(board);
    const result = await lookupStrategy({
      board: board === "preflop" ? "preflop" : board,
      stackDepth: selectedStack,
      position: selectedPosition,
      street,
    });

    if (result) {
      // Map API StrategyCell to CellData
      const mapped: Record<string, CellData> = {};
      for (const [hand, cell] of Object.entries(result)) {
        mapped[hand] = {
          hand,
          equity: cell.ev ? Math.max(0, Math.min(100, (cell.ev + 5) * 10)) : 50,
          action: cell.action,
          frequency: cell.frequency,
          betSize: cell.action.includes("bet") || cell.action.includes("raise")
            ? selectedStack * 0.33
            : 0,
        };
      }
      setApiData(mapped);
    }
  }, [board, selectedStack, selectedPosition, lookupStrategy]);

  // Compute grid data
  const gridData = useMemo(() => {
    if (dataSource === "api" && apiData && Object.keys(apiData).length > 0) {
      return apiData;
    }
    return generateDemoData(selectedPosition, selectedStack, board);
  }, [dataSource, apiData, selectedPosition, selectedStack, board]);

  // Compute range stats from selected hands
  const rangeStats = useMemo(() => {
    let pairs = 0, suited = 0, offsuit = 0;
    for (const hand of selectedHands) {
      if (hand.length === 2) pairs++;
      else if (hand.endsWith("s")) suited++;
      else if (hand.endsWith("o")) offsuit++;
    }
    const totalHands = pairs + suited + offsuit;
    const totalCombos = pairs * 6 + suited * 4 + offsuit * 12;
    const percentage = totalCombos > 0 ? ((totalCombos / 1326) * 100).toFixed(1) : "0.0";
    return { totalHands, totalCombos, percentage, pairs, suited, offsuit };
  }, [selectedHands]);

  const stats = useMemo(() => computeRangeStats(gridData), [gridData]);

  const streetLabel = useMemo(() => {
    const s = parseBoardToStreet(board);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [board]);

  // Handle grid cell click for range building
  const handleCellClick = useCallback((hand: string) => {
    setSelectedHands((prev) => {
      const next = new Set(prev);
      if (next.has(hand)) {
        next.delete(hand);
      } else {
        next.add(hand);
      }
      return next;
    });
    // Update range input to match selection
    setRangeInput((prev) => {
      const current = handsToRangeString(selectedHands);
      return current;
    });
  }, [selectedHands]);

  // Handle range input change
  const handleRangeInputChange = useCallback(
    (value: string) => {
      setRangeInput(value);
      setRangeInputError(null);

      if (!value.trim()) {
        setSelectedHands(new Set());
        return;
      }

      try {
        const parsed = parseRangeString(value);
        if (parsed.size === 0 && value.trim().length > 0) {
          setRangeInputError("No valid hands found. Use format: AA, AKs, KQs-TQs, 77+");
        }
        setSelectedHands(parsed);
      } catch {
        setRangeInputError("Invalid range format. Use: AA, AKs, KQs-TQs, 77+");
      }
    },
    []
  );

  // Handle range input blur - sync from selection
  const handleRangeInputBlur = useCallback(() => {
    const current = handsToRangeString(selectedHands);
    setRangeInput(current);
  }, [selectedHands]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedHands(new Set());
    setRangeInput("");
    setRangeInputError(null);
  }, []);

  // Select all hands
  const handleSelectAll = useCallback(() => {
    const all = new Set<string>();
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        all.add(getHand(r, c));
      }
    }
    setSelectedHands(all);
    setRangeInput(handsToRangeString(all));
  }, []);

  // Equity calculation
  const handleEquityCalc = useCallback(async () => {
    if (selectedHands.size === 0) {
      setRangeInputError("Select at least one hand first");
      return;
    }
    if (board === "preflop") {
      setRangeInputError("Select a board to calculate equity");
      return;
    }

    setEquityLoading(true);
    setEquityResult(null);

    try {
      const hands = Array.from(selectedHands).slice(0, 6); // Max 6 hands
      const response = await fetch("/api/v1/equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hands: hands.map((h) => {
            // Convert hand notation to card notation
            if (h.length === 2) return `${h[0]}s${h[1]}s`; // Pair -> suited (doesn't matter for pairs)
            if (h.endsWith("s")) return `${h[0]}s${h[1]}s`;
            return `${h[0]}s${h[1]}h`; // offsuit
          }),
          board: board,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEquityResult({
          hands,
          equities: data.equities || hands.map(() => 0),
          board,
        });
      } else {
        // Fallback: show demo equity from grid data
        const equities = hands.map((h) => gridData[h]?.equity ?? 50);
        setEquityResult({ hands, equities, board });
      }
    } catch {
      // Fallback: use demo data
      const hands = Array.from(selectedHands).slice(0, 6);
      const equities = hands.map((h) => gridData[h]?.equity ?? 50);
      setEquityResult({ hands, equities, board });
    } finally {
      setEquityLoading(false);
    }
  }, [selectedHands, board, gridData]);

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-poker-gold">
          Range Explorer
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Explore GTO ranges by position, stack depth, and board texture
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-3">
        {/* Position selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-400 mr-1">Position:</span>
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={cn(
                "px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors",
                selectedPosition === pos
                  ? "bg-poker-gold text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              )}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Stack depth selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-400 mr-1">Stack:</span>
          {STACK_DEPTHS.map((depth) => (
            <button
              key={depth}
              onClick={() => setSelectedStack(depth)}
              className={cn(
                "px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors",
                selectedStack === depth
                  ? "bg-poker-gold text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              )}
            >
              {depth}bb
            </button>
          ))}
        </div>

        {/* Board + API button row */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-400 mr-1">Board:</span>
          {BOARD_PRESETS.slice(0, 5).map((preset) => (
            <button
              key={preset.board}
              onClick={() => setBoard(preset.board)}
              className={cn(
                "px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors",
                board === preset.board
                  ? "bg-poker-gold text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              )}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="text"
            value={board === "preflop" ? "" : board}
            onChange={(e) => setBoard(e.target.value.trim() || "preflop")}
            placeholder="Custom (e.g. AhKd2c)"
            className="w-36 bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-poker-gold"
          />
          <button
            onClick={handleApiLookup}
            disabled={loading}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-semibold transition-colors",
              loading
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-700 text-white hover:bg-blue-600 border border-blue-600"
            )}
          >
            {loading ? "Loading..." : "Fetch from API"}
          </button>
        </div>

        {/* Range string input */}
        <div className="flex flex-wrap gap-2 items-start">
          <span className="text-xs sm:text-sm text-gray-400 mr-1 mt-2">Range:</span>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInputChange(e.target.value)}
              onBlur={handleRangeInputBlur}
              placeholder="e.g. AA, AKs, KQs-TQs, 77+"
              className={cn(
                "w-full bg-gray-800 border rounded px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none",
                rangeInputError
                  ? "border-red-600 focus:border-red-500"
                  : "border-gray-700 focus:border-poker-gold"
              )}
            />
            {rangeInputError && (
              <p className="text-[10px] text-red-400 mt-1">{rangeInputError}</p>
            )}
            <p className="text-[10px] text-gray-500 mt-1">
              Click grid cells to toggle • Type range notation • Supports: AA, AKs, 77+, T9s-T7s
            </p>
          </div>
          <button
            onClick={handleClearSelection}
            className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            Select All
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mb-4 px-4 py-2 rounded bg-red-900/40 border border-red-800 text-red-300 text-xs">
          {error}
          <button
            onClick={() => setDataSource("demo")}
            className="ml-3 underline hover:text-red-200"
          >
            Switch to demo data
          </button>
        </div>
      )}

      {/* Info banner */}
      {dataSource === "demo" && !error && (
        <div className="mb-4 px-4 py-2 rounded bg-blue-900/30 border border-blue-800 text-blue-300 text-xs flex items-center gap-2">
          <span>📊</span>
          <span>
            Showing generated demo data. Click <strong>&quot;Fetch from API&quot;</strong> to load real GTO strategy from the backend.
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Range Grid */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto">
            <RangeGrid
              data={gridData}
              mode={displayMode}
              title={`${selectedPosition} Range @ ${selectedStack}bb`}
              subtitle={`${streetLabel} · ${stats.totalHands} hand types · ${stats.percentage}% of combos`}
              selectable
              selected={selectedHands}
              onCellClick={handleCellClick}
            />
          </div>

          {/* Selected hands display */}
          {selectedHands.size > 0 && (
            <div className="mt-3 p-3 rounded-lg border border-gray-800 bg-gray-900/60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Selected Range ({rangeStats.totalCombos} combos, {rangeStats.percentage}%)
                </h4>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-amber-400">{rangeStats.pairs} pairs</span>
                  <span className="text-green-400">{rangeStats.suited} suited</span>
                  <span className="text-blue-400">{rangeStats.offsuit} offsuit</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedHands).sort().map((hand) => (
                  <span
                    key={hand}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors",
                      hand.length === 2
                        ? "bg-amber-900/40 text-amber-300 border border-amber-800"
                        : hand.endsWith("s")
                        ? "bg-green-900/40 text-green-300 border border-green-800"
                        : "bg-blue-900/40 text-blue-300 border border-blue-800"
                    )}
                    onClick={() => handleCellClick(hand)}
                    title="Click to remove"
                  >
                    {hand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Display mode toggle */}
          <ModeToggle mode={displayMode} onChange={setDisplayMode} />

          {/* Stats */}
          <RangeStatsCard stats={stats} />

          {/* Board presets (extended) */}
          <BoardPresetSelector
            presets={BOARD_PRESETS}
            activeBoard={board}
            onSelect={setBoard}
          />

          {/* Equity Calculator */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
              Equity Calculator
            </h3>
            <p className="text-[10px] text-gray-500 mb-3">
              Select hands on the grid and a board, then calculate equity.
            </p>
            <button
              onClick={handleEquityCalc}
              disabled={equityLoading || selectedHands.size === 0 || board === "preflop"}
              className={cn(
                "w-full px-3 py-2 rounded text-xs font-semibold transition-colors",
                equityLoading || selectedHands.size === 0 || board === "preflop"
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-green-700 text-white hover:bg-green-600 border border-green-600"
              )}
            >
              {equityLoading
                ? "Calculating..."
                : selectedHands.size === 0
                ? "Select hands first"
                : board === "preflop"
                ? "Select a board first"
                : `Calculate Equity (${Math.min(selectedHands.size, 6)} hands)`}
            </button>

            {/* Equity results */}
            {equityResult && (
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                  Board: {equityResult.board}
                </div>
                {equityResult.hands.map((hand, i) => (
                  <div key={hand} className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-white w-8">{hand}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
                        style={{ width: `${equityResult.equities[i]}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-green-400 font-mono w-10 text-right">
                      {equityResult.equities[i].toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API response info */}
          {lastResult && (
            <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
                API Response
              </h3>
              <div className="space-y-1 text-[11px] text-gray-400">
                <div className="flex justify-between">
                  <span>Game Type</span>
                  <span className="text-gray-300">{lastResult.game_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Street</span>
                  <span className="text-gray-300">{lastResult.street}</span>
                </div>
                <div className="flex justify-between">
                  <span>Board</span>
                  <span className="text-gray-300">{lastResult.board}</span>
                </div>
                <div className="flex justify-between">
                  <span>Position</span>
                  <span className="text-gray-300">{lastResult.position}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stack</span>
                  <span className="text-gray-300">{lastResult.stack_depth}bb</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-green-400">{lastResult.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 border border-gray-800 rounded-lg bg-gray-900/30">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-poker-gold">
          About Range Explorer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm text-gray-400">
          <div>
            <h3 className="font-medium text-white mb-2">What is Range Explorer?</h3>
            <p className="text-xs sm:text-sm">
              The Range Explorer shows GTO (Game Theory Optimal) ranges for every
              position and stack depth combination. Each cell in the 13×13 grid
              represents a hand combination — pocket pairs on the diagonal, suited
              hands above, offsuit hands below. Color intensity shows equity or action
              frequency.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">How to Use</h3>
            <p className="text-xs sm:text-sm">
              Select a position and stack depth to see the recommended range. Choose
              a board texture to see how ranges change postflop. Toggle between
              Equity and Action modes to view hand strength or recommended play.
              Click grid cells to build your own range, or type range notation directly.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Understanding the Colors</h3>
            <p className="text-xs sm:text-sm">
              <strong className="text-gray-300">Equity mode:</strong> Brighter green =
              higher equity. Dark/uncolored cells = hands not in range.<br />
              <strong className="text-gray-300">Action mode:</strong> Different colors
              represent raise/call/fold decisions. Opacity shows frequency.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Range Builder</h3>
            <p className="text-xs sm:text-sm">
              Click any cell in the grid to toggle it in/out of your custom range.
              Or type range notation like <code className="text-poker-gold">AA, AKs, 77+</code> in the
              Range input. Use the Equity Calculator to see how your selected hands
              perform against a specific board texture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
