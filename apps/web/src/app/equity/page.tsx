"use client";

import { useState, useCallback } from "react";
import { RangeSelector, EquityChart, EquityHeatmap, EquityEntry } from "@/components/equity";
import { RANKS, SUITS } from "@/lib/utils";

interface EquityResult {
  equity: number;
  wins: number;
  ties: number;
  total: number;
  ev_per_hand: number;
}

interface HeatmapData {
  hand: string;
  equity: number;
}

const ITERATION_OPTIONS = [
  { value: 10000, label: "10,000" },
  { value: 50000, label: "50,000" },
  { value: 100000, label: "100,000" },
  { value: 500000, label: "500,000" },
];

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

interface CardInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

function CardInput({ value, onChange, label, disabled }: CardInputProps) {
  const rank = value[0] || "";
  const suit = value[1] || "";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-1">
        <select
          value={rank}
          onChange={(e) => onChange(e.target.value + suit)}
          disabled={disabled}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm w-16 appearance-none cursor-pointer disabled:opacity-50"
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
          disabled={disabled}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm w-16 appearance-none cursor-pointer disabled:opacity-50"
        >
          <option value="">--</option>
          {SUITS.map((s) => (
            <option key={s} value={s}>
              {SUIT_DISPLAY[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function EquityPage() {
  const [heroRange, setHeroRange] = useState<Set<string>>(new Set());
  const [villainRange, setVillainRange] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"chart" | "heatmap">("chart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate state
  const [heroHand, setHeroHand] = useState("");
  const [boardCards, setBoardCards] = useState(["", "", "", "", ""]);
  const [iterations, setIterations] = useState(100000);

  // Results state
  const [equityResult, setEquityResult] = useState<EquityResult | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [chartData, setChartData] = useState<EquityEntry[]>([]);

  const updateBoardCard = useCallback((index: number, value: string) => {
    setBoardCards((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const buildBoardString = useCallback(
    (cards: string[]) => cards.filter((c) => c.length === 2).join(""),
    []
  );

  const handleCalculate = useCallback(async () => {
    setError(null);
    setEquityResult(null);
    setHeatmapData([]);
    setChartData([]);

    // Validate hero hand
    if (!heroHand || heroHand.length < 2) {
      setError("Please enter a valid hero hand (e.g., AKs, AhKh)");
      return;
    }

    if (villainRange.size === 0) {
      setError("Please select at least one villain hand");
      return;
    }

    setLoading(true);

    try {
      const villainStr = Array.from(villainRange).join(",");
      const boardStr = buildBoardString(boardCards);

      const requestBody: {
        hero: string;
        villain: string;
        board?: string;
        iterations: number;
      } = {
        hero: heroHand,
        villain: villainStr,
        iterations,
      };

      if (boardStr.length > 0) {
        requestBody.board = boardStr;
      }

      // Call equity heatmap for range data
      const response = await fetch("/api/v1/equity/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villain: villainStr,
          board: boardStr || undefined,
          iterations,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const heatmapResult = await response.json();
      setHeatmapData(heatmapResult.hands || []);

      // Also get specific hand calculation for hero hand
      const equityRes = await fetch("/api/v1/equity/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!equityRes.ok) {
        throw new Error(`API error: ${equityRes.status}`);
      }

      const equityData = await equityRes.json();
      setEquityResult(equityData);

      // Build chart data for the hero hand vs villain range
      if (heatmapResult.hands) {
        const heroHandEquity = heatmapResult.hands.find(
          (h: { hand: string; equity: number }) => h.hand.toLowerCase() === heroHand.toLowerCase()
        )?.equity;

        const entry: EquityEntry = {
          hand: heroHand,
          heroEquity: (equityData.equity ?? heroHandEquity ?? 0) * 100,
          heroWin: ((equityData.wins ?? 0) / (equityData.total || 1)) * 100,
          heroTie: ((equityData.ties ?? 0) / (equityData.total || 1)) * 100,
          villainEquity: (1 - (equityData.equity ?? heroHandEquity ?? 0)) * 100,
          villainWin: (((equityData.total || 1) - (equityData.wins ?? 0)) / (equityData.total || 1)) * 100,
          villainTie: ((equityData.ties ?? 0) / (equityData.total || 1)) * 100,
        };
        setChartData([entry]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Calculation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [heroHand, villainRange, boardCards, iterations, buildBoardString, heatmapData]);

  const hasResults = equityResult !== null || heatmapData.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-poker-gold">Equity Calculator</h1>

      {/* Ranges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Hero Range</h2>
          <RangeSelector value={heroRange} onChange={setHeroRange} />
        </div>

        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Villain Range</h2>
          <RangeSelector value={villainRange} onChange={setVillainRange} />
        </div>
      </div>

      {/* Hand Input, Board & Controls */}
      <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Hero Hand Input */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Hero Hand</label>
            <input
              type="text"
              value={heroHand}
              onChange={(e) => setHeroHand(e.target.value.toUpperCase())}
              placeholder="e.g., AKs, AA, AhKh"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">Specific hand to calculate</p>
          </div>

          {/* Iteration Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Iterations</label>
            <select
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-full appearance-none cursor-pointer"
            >
              {ITERATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Monte Carlo simulations</p>
          </div>

          {/* Board Cards */}
          <div className="lg:col-span-2">
            <label className="text-sm text-muted-foreground mb-1 block">Board Cards (optional)</label>
            <div className="flex gap-2 flex-wrap">
              {boardCards.map((card, idx) => (
                <CardInput
                  key={idx}
                  value={card}
                  onChange={(val) => updateBoardCard(idx, val)}
                  label={idx === 0 ? "Flop 1" : idx === 1 ? "Flop 2" : idx === 2 ? "Flop 3" : idx === 3 ? "Turn" : "River"}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleCalculate}
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
                Calculating...
              </span>
            ) : (
              "Calculate Equity"
            )}
          </button>

          {error && (
            <div className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠</span>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-4 sm:mt-6 lg:mt-8 border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Results</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("chart")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "chart"
                  ? "bg-poker-gold text-gray-900"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode("heatmap")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === "heatmap"
                  ? "bg-poker-gold text-gray-900"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Equity Summary */}
        {equityResult && !loading && chartData.length > 0 && viewMode === "chart" && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {(equityResult.equity * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Hero Equity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {((1 - equityResult.equity) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Villain Equity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {equityResult.wins.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {equityResult.ties.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Ties</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-poker-gold" viewBox="0 0 24 24">
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
              <span className="text-muted-foreground">Calculating equity...</span>
            </div>
          </div>
        )}

        {/* Chart View */}
        {!loading && viewMode === "chart" && chartData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <EquityChart data={chartData} />
          </div>
        )}

        {/* Heatmap View */}
        {!loading && viewMode === "heatmap" && heatmapData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 flex justify-center">
            <EquityHeatmap
              data={heatmapData}
              onCellClick={(hand, equity) => console.log(`Clicked ${hand}: ${equity}%`)}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasResults && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Select ranges and click Calculate to see equity results
          </div>
        )}
      </div>
    </div>
  );
}
