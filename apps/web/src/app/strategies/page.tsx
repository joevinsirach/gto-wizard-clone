"use client";

import { useState } from "react";
import { StrategyHeatmap } from "@/components/ui/StrategyHeatmap";
import { StrategyCard } from "@/components/ui/StrategyCard";

type Position = "BTN" | "SB" | "BB" | "CO" | "MP" | "UTG";
type BoardType = "dry" | "wet" | "paired" | "rainbow" | "monochrome";

interface StrategySpot {
  id: string;
  board: string;
  boardType: BoardType;
  position: Position;
  potSize: number;
  stackDepth: number;
  strategy: Record<string, { action: "raise" | "call" | "fold"; frequency: number; ev: number }>;
}

// Mock data for demonstration
const MOCK_STRATEGIES: StrategySpot[] = [
  {
    id: "1",
    board: "Kd7h2c",
    boardType: "dry",
    position: "BTN",
    potSize: 100,
    stackDepth: 100,
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.85 },
      "KK": { action: "raise", frequency: 0.95, ev: 0.82 },
      "AKs": { action: "raise", frequency: 0.88, ev: 0.76 },
      "AKo": { action: "raise", frequency: 0.75, ev: 0.68 },
      "QQ": { action: "raise", frequency: 0.90, ev: 0.74 },
      "JJ": { action: "call", frequency: 0.65, ev: 0.58 },
      "TT": { action: "call", frequency: 0.55, ev: 0.52 },
      "99": { action: "call", frequency: 0.45, ev: 0.45 },
      "22": { action: "fold", frequency: 0.8, ev: 0.0 },
    },
  },
  {
    id: "2",
    board: "AhKs7d",
    boardType: "wet",
    position: "CO",
    potSize: 80,
    stackDepth: 120,
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.88 },
      "KK": { action: "raise", frequency: 0.98, ev: 0.85 },
      "AKs": { action: "raise", frequency: 0.92, ev: 0.78 },
      "AKo": { action: "raise", frequency: 0.70, ev: 0.62 },
      "QQ": { action: "call", frequency: 0.60, ev: 0.55 },
      "JJ": { action: "fold", frequency: 0.55, ev: 0.0 },
      "TT": { action: "fold", frequency: 0.60, ev: 0.0 },
    },
  },
  {
    id: "3",
    board: "8c8s4d",
    boardType: "paired",
    position: "BB",
    potSize: 150,
    stackDepth: 80,
    strategy: {
      "AA": { action: "raise", frequency: 1.0, ev: 0.90 },
      "KK": { action: "raise", frequency: 0.95, ev: 0.86 },
      "QQ": { action: "raise", frequency: 0.85, ev: 0.78 },
      "JJ": { action: "call", frequency: 0.70, ev: 0.65 },
      "88": { action: "fold", frequency: 0.75, ev: 0.0 },
      "77": { action: "fold", frequency: 0.70, ev: 0.0 },
    },
  },
];

export default function StrategiesPage() {
  const [filterPosition, setFilterPosition] = useState<Position | "all">("all");
  const [filterBoardType, setFilterBoardType] = useState<BoardType | "all">("all");
  const [filterStackDepth, setFilterStackDepth] = useState<string>("all");
  const [selectedSpot, setSelectedSpot] = useState<StrategySpot | null>(MOCK_STRATEGIES[0]);

  const filteredStrategies = MOCK_STRATEGIES.filter((spot) => {
    if (filterPosition !== "all" && spot.position !== filterPosition) return false;
    if (filterBoardType !== "all" && spot.boardType !== filterBoardType) return false;
    if (filterStackDepth !== "all" && spot.stackDepth.toString() !== filterStackDepth) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-poker-gold">GTO Strategy Browser</h1>
        <span className="text-sm text-muted-foreground">
          {filteredStrategies.length} spots found
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Position</label>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value as Position | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All</option>
            <option value="BTN">Button</option>
            <option value="SB">Small Blind</option>
            <option value="BB">Big Blind</option>
            <option value="CO">Cutoff</option>
            <option value="MP">Middle Position</option>
            <option value="UTG">UTG</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Board Type</label>
          <select
            value={filterBoardType}
            onChange={(e) => setFilterBoardType(e.target.value as BoardType | "all")}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All</option>
            <option value="dry">Dry</option>
            <option value="wet">Wet</option>
            <option value="paired">Paired</option>
            <option value="rainbow">Rainbow</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Stack Depth</label>
          <select
            value={filterStackDepth}
            onChange={(e) => setFilterStackDepth(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All</option>
            <option value="80">80bb</option>
            <option value="100">100bb</option>
            <option value="120">120bb</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strategy list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Strategy Spots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStrategies.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelectedSpot(spot)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedSpot?.id === spot.id
                    ? "border-poker-gold bg-poker-gold/10"
                    : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-semibold">{spot.board}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-poker-gold/20 text-poker-gold">
                    {spot.position}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Pot: {spot.potSize}bb</span>
                  <span>Stack: {spot.stackDepth}bb</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground capitalize">
                  Board type: {spot.boardType}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Strategy details */}
        <div className="space-y-6">
          {selectedSpot ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Strategy Heatmap</h3>
                <StrategyHeatmap
                  strategy={selectedSpot.strategy}
                  board={selectedSpot.board}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Spot Details</h3>
                <StrategyCard
                  board={selectedSpot.board}
                  potSize={selectedSpot.potSize}
                  stackDepth={selectedSpot.stackDepth}
                  position={selectedSpot.position}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground border border-gray-800 rounded-lg">
              Select a strategy spot to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}