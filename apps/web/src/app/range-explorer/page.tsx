"use client";

import { useState, useMemo, useCallback } from "react";
import { RangeGrid, type CellData } from "@/components/equity/RangeGrid";
import { RANKS, getHand } from "@/lib/utils";
import {
  useStrategyLookup,
  parseBoardToStreet,
  getCommonPositions,
  getCommonStackDepths,
  getCommonBoards,
} from "@/hooks/useStrategyLookup";
import { cn } from "@/lib/utils";

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

  const stats = useMemo(() => computeRangeStats(gridData), [gridData]);

  const streetLabel = useMemo(() => {
    const s = parseBoardToStreet(board);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [board]);

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
            />
          </div>
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
              Use &quot;Fetch from API&quot; to load real solver data.
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
            <h3 className="font-medium text-white mb-2">Board Textures</h3>
            <p className="text-xs sm:text-sm">
              Board cards dramatically affect hand equities. A paired board like
              &quot;QhQd4c&quot; strengthens pocket pairs and trips draws. A
              coordinated board like &quot;JdTd9c&quot; favors suited connectors
              and straight draws. Experiment with different textures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
