"use client";

import { useState, useCallback, useMemo } from "react";
import { StrategyHeatmap, StrategyCell } from "@/components/ui/StrategyHeatmap";
import {
  useStrategyLookup,
  parseBoardToStreet,
  getCommonBoards,
  getCommonPositions,
  getCommonStackDepths,
  getCommonBetSizes,
} from "@/hooks/useStrategyLookup";
import { RANKS } from "@/lib/utils";

const RANK_DISPLAY: Record<string, string> = {
  A: "A",
  K: "K",
  Q: "Q",
  J: "J",
  T: "T",
  "9": "9",
  "8": "8",
  "7": "7",
  "6": "6",
  "5": "5",
  "4": "4",
  "3": "3",
  "2": "2",
};

const SUIT_DISPLAY: Record<string, string> = {
  h: "♥",
  d: "♦",
  c: "♣",
  s: "♠",
};

// Generate mock strategy data for demonstration
function generateMockStrategy(street: string): Record<string, StrategyCell> {
  const strategy: Record<string, StrategyCell> = {};
  const actionTypes = ["raise", "call", "fold", "check", "bet"];

  RANKS.forEach((rank1, row) => {
    RANKS.forEach((rank2, col) => {
      const hand = row <= col ? `${rank1}${rank2}` : `${rank2}${rank1}`;
      const isSuited = row === col;
      const isPair = row === col;

      let action: string;
      let frequency: number;
      let ev: number;

      if (isPair) {
        // Pocket pairs - stronger pairs more likely to raise
        const pairStrength = Math.max(0, 10 - (12 - row) * 0.8);
        action = pairStrength > 5 ? "raise" : pairStrength > 2 ? "call" : "fold";
        frequency = Math.min(1, Math.max(0, pairStrength / 10));
        ev = pairStrength * 0.5 - 0.5;
      } else if (isSuited) {
        // Suited connectors - medium strength
        const strength = (row + col) / 2;
        action = strength > 8 ? "raise" : strength > 5 ? "call" : "fold";
        frequency = Math.min(1, Math.max(0, strength / 13));
        ev = strength * 0.3 - 1;
      } else {
        // Offsuit - generally weaker
        const strength = (row + col) / 2;
        action = strength > 9 ? "raise" : strength > 6 ? "call" : "fold";
        frequency = Math.min(1, Math.max(0, strength / 15));
        ev = strength * 0.2 - 1.5;
      }

      strategy[hand] = { action, frequency, ev };
    });
  });

  return strategy;
}

export default function StrategyPage() {
  // Board state
  const [boardCards, setBoardCards] = useState<string[]>(["", "", "", "", ""]);

  // Lookup parameters
  const [position, setPosition] = useState("BTN");
  const [stackDepth, setStackDepth] = useState(100);
  const [betSize, setBetSize] = useState(0.5);
  const [streetOverride, setStreetOverride] = useState<string | null>(null);

  // Strategy data
  const [strategy, setStrategy] = useState<Record<string, StrategyCell>>({});
  const [comparisonStrategy, setComparisonStrategy] = useState<Record<string, StrategyCell> | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<"demo" | "api">("demo");
  const [compareMode, setCompareMode] = useState(false);

  const { lookupStrategy, loading, error, clearError } = useStrategyLookup();

  // Build board string from selected cards
  const boardString = useMemo(() => {
    return boardCards.filter((c) => c.length === 2).join("");
  }, [boardCards]);

  // Determine street
  const street = useMemo(() => {
    if (streetOverride) return streetOverride as "preflop" | "flop" | "turn" | "river";
    return parseBoardToStreet(boardString);
  }, [boardString, streetOverride]);

  // Update a single board card
  const updateBoardCard = useCallback((index: number, value: string) => {
    setBoardCards((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  // Load a preset board
  const loadPresetBoard = useCallback((board: string) => {
    const cards: string[] = [];
    for (let i = 0; i < board.length - 1; i += 2) {
      cards.push(board.slice(i, i + 2));
    }
    // Pad to 5 cards
    while (cards.length < 5) {
      cards.push("");
    }
    setBoardCards(cards.slice(0, 5));
  }, []);

  // Handle demo lookup (uses mock data)
  const handleDemoLookup = useCallback(() => {
    clearError();
    const mockStrategy = generateMockStrategy(street);
    setStrategy(mockStrategy);

    if (compareMode && !comparisonStrategy) {
      // Generate a slightly different comparison strategy
      const comparison: Record<string, StrategyCell> = {};
      Object.entries(mockStrategy).forEach(([hand, data]) => {
        // Randomly adjust some actions for comparison
        const shouldDiffer = Math.random() > 0.7;
        if (shouldDiffer && data.action === "raise") {
          comparison[hand] = { ...data, action: "call" };
        } else if (shouldDiffer && data.action === "call") {
          comparison[hand] = { ...data, action: "raise" };
        } else {
          comparison[hand] = { ...data };
        }
      });
      setComparisonStrategy(comparison);
    }
  }, [street, compareMode, comparisonStrategy, clearError]);

  // Handle API lookup
  const handleApiLookup = useCallback(async () => {
    if (!boardString && street === "preflop") {
      setStrategy(generateMockStrategy("preflop"));
      return;
    }

    clearError();
    const result = await lookupStrategy({
      board: boardString || "preflop",
      stackDepth,
      position,
      street: street === "preflop" ? undefined : street,
      betSize,
    });

    if (result) {
      setStrategy(result);
    } else {
      // Fall back to demo data if API fails
      setStrategy(generateMockStrategy(street));
    }
  }, [boardString, stackDepth, position, street, betSize, lookupStrategy, clearError]);

  // Clear comparison
  const handleClearComparison = useCallback(() => {
    setComparisonStrategy(null);
    setCompareMode(false);
  }, []);

  // Preset boards dropdown
  const presetBoards = useMemo(() => getCommonBoards(), []);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">Strategy Lookup</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("demo")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === "demo"
                ? "bg-poker-gold text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Demo Mode
          </button>
          <button
            onClick={() => setViewMode("api")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === "api"
                ? "bg-poker-gold text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            API Mode
          </button>
        </div>
      </div>

      {/* Board Selection */}
      <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Board Cards</h2>
          <select
            onChange={(e) => {
              if (e.target.value) loadPresetBoard(e.target.value);
            }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
            value=""
          >
            <option value="">Load preset board...</option>
            {presetBoards.map((preset) => (
              <option key={preset.board} value={preset.board}>
                {preset.label} ({preset.board})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Flop cards */}
          {[0, 1, 2].map((idx) => (
            <CardSelector
              key={`flop-${idx}`}
              label={idx === 0 ? "Flop 1" : idx === 1 ? "Flop 2" : "Flop 3"}
              value={boardCards[idx]}
              onChange={(val) => updateBoardCard(idx, val)}
            />
          ))}
          {/* Turn */}
          <CardSelector
            label="Turn"
            value={boardCards[3]}
            onChange={(val) => updateBoardCard(3, val)}
          />
          {/* River */}
          <CardSelector
            label="River"
            value={boardCards[4]}
            onChange={(val) => updateBoardCard(4, val)}
          />
        </div>

        {/* Street indicator */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Street:</span>
            <span className="px-3 py-1 bg-primary/20 rounded text-sm font-medium">
              {street.charAt(0).toUpperCase() + street.slice(1)}
            </span>
          </div>
          {boardString && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Board:</span>
              <span className="font-mono text-sm">{boardString || "(empty)"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Parameters */}
      <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50 mb-4">
        <h2 className="text-lg font-semibold mb-4">Lookup Parameters</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Position */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {getCommonPositions().map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stack Depth */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Stack Depth</label>
            <select
              value={stackDepth}
              onChange={(e) => setStackDepth(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {getCommonStackDepths().map((sd) => (
                <option key={sd.value} value={sd.value}>
                  {sd.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bet Size */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Bet Size</label>
            <select
              value={betSize}
              onChange={(e) => setBetSize(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            >
              {getCommonBetSizes().map((bs) => (
                <option key={bs.value} value={bs.value}>
                  {bs.label}
                </option>
              ))}
            </select>
          </div>

          {/* Compare Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Comparison</label>
            <button
              onClick={() => {
                if (compareMode) {
                  handleClearComparison();
                } else {
                  setCompareMode(true);
                }
              }}
              className={`px-3 py-2 rounded text-sm border transition-colors ${
                compareMode
                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }`}
            >
              {compareMode ? "Comparing" : "Enable Compare"}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Lookup buttons */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={viewMode === "demo" ? handleDemoLookup : handleApiLookup}
            disabled={loading}
            className="px-6 py-2.5 bg-poker-gold text-gray-900 font-semibold rounded-lg hover:bg-poker-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              `Lookup Strategy (${viewMode === "demo" ? "Demo" : "API"})`
            )}
          </button>

          {viewMode === "api" && (
            <span className="text-xs text-muted-foreground">
              Using /api/v1/strategy-lookup endpoint
            </span>
          )}
        </div>
      </div>

      {/* Strategy Heatmap Display */}
      {Object.keys(strategy).length > 0 && (
        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Strategy Heatmap</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {position && <span>Position: {position}</span>}
              <span>Stack: {stackDepth}bb</span>
              <span>Bet: {betSize * 100}%</span>
              {compareMode && comparisonStrategy && (
                <span className="text-yellow-500">Comparison Active</span>
              )}
            </div>
          </div>

          <StrategyHeatmap
            strategy={strategy}
            boardCards={boardString}
            position={position}
            street={street}
            actionType="raise_call_fold"
            comparisonStrategy={compareMode ? comparisonStrategy || undefined : undefined}
            showFrequency={true}
            showEv={false}
          />
        </div>
      )}

      {/* Empty state */}
      {Object.keys(strategy).length === 0 && !loading && (
        <div className="border border-gray-800 rounded-lg p-8 bg-gray-900/50 text-center">
          <div className="text-muted-foreground mb-2">No strategy loaded</div>
          <div className="text-sm text-muted-foreground/70">
            Select board cards and click &quot;Lookup Strategy&quot; to see the GTO strategy heatmap
          </div>
        </div>
      )}
    </div>
  );
}

// Card selector component
interface CardSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function CardSelector({ label, value, onChange }: CardSelectorProps) {
  const rank = value[0] || "";
  const suit = value[1] || "";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-1">
        <select
          value={rank}
          onChange={(e) => onChange(e.target.value + suit)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm w-14 appearance-none cursor-pointer"
        >
          <option value="">--</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {RANK_DISPLAY[r]}
            </option>
          ))}
        </select>
        <select
          value={suit}
          onChange={(e) => onChange(rank + e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm w-14 appearance-none cursor-pointer"
        >
          <option value="">--</option>
          {["h", "d", "c", "s"].map((s) => (
            <option key={s} value={s}>
              {SUIT_DISPLAY[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
