"use client";

import { useState } from "react";
import { RangeSelector, EquityChart, EquityHeatmap, EquityEntry } from "@/components/equity";

const MOCK_EQUITY_HEATMAP_DATA: { hand: string; equity: number }[] = [
  { hand: "AA", equity: 85.2 },
  { hand: "KK", equity: 82.1 },
  { hand: "QQ", equity: 79.5 },
  { hand: "JJ", equity: 77.2 },
  { hand: "TT", equity: 75.0 },
  { hand: "99", equity: 72.1 },
  { hand: "88", equity: 69.3 },
  { hand: "77", equity: 66.5 },
  { hand: "66", equity: 63.7 },
  { hand: "55", equity: 60.8 },
  { hand: "44", equity: 57.9 },
  { hand: "33", equity: 54.8 },
  { hand: "22", equity: 51.5 },
  { hand: "AKs", equity: 67.4 },
  { hand: "AQs", equity: 66.1 },
  { hand: "AJs", equity: 65.0 },
  { hand: "ATs", equity: 64.1 },
  { hand: "A9s", equity: 62.8 },
  { hand: "A8s", equity: 61.6 },
  { hand: "A7s", equity: 60.4 },
  { hand: "A6s", equity: 59.1 },
  { hand: "A5s", equity: 58.5 },
  { hand: "A4s", equity: 57.2 },
  { hand: "A3s", equity: 55.9 },
  { hand: "A2s", equity: 54.5 },
  { hand: "AKo", equity: 65.3 },
  { hand: "AQo", equity: 63.8 },
  { hand: "AJo", equity: 62.5 },
  { hand: "ATo", equity: 61.3 },
  { hand: "A9o", equity: 59.8 },
  { hand: "A8o", equity: 58.3 },
  { hand: "A7o", equity: 56.8 },
  { hand: "A6o", equity: 55.2 },
  { hand: "A5o", equity: 54.3 },
  { hand: "A4o", equity: 52.8 },
  { hand: "A3o", equity: 51.2 },
  { hand: "A2o", equity: 49.5 },
  { hand: "KQs", equity: 64.8 },
  { hand: "KJs", equity: 63.6 },
  { hand: "KTs", equity: 62.7 },
  { hand: "K9s", equity: 61.3 },
  { hand: "K8s", equity: 59.9 },
  { hand: "K7s", equity: 58.5 },
  { hand: "K6s", equity: 57.1 },
  { hand: "K5s", equity: 55.9 },
  { hand: "K4s", equity: 54.5 },
  { hand: "K3s", equity: 53.1 },
  { hand: "K2s", equity: 51.6 },
  { hand: "KQo", equity: 62.5 },
  { hand: "KJo", equity: 61.1 },
  { hand: "KTo", equity: 60.0 },
  { hand: "K9o", equity: 58.4 },
  { hand: "K8o", equity: 56.7 },
  { hand: "K7o", equity: 55.1 },
  { hand: "K6o", equity: 53.4 },
  { hand: "K5o", equity: 52.3 },
  { hand: "K4o", equity: 50.8 },
  { hand: "K3o", equity: 49.1 },
  { hand: "K2o", equity: 47.4 },
  { hand: "QQ", equity: 79.5 },
  { hand: "QJs", equity: 62.9 },
  { hand: "QTs", equity: 62.0 },
  { hand: "Q9s", equity: 60.5 },
  { hand: "Q8s", equity: 59.0 },
  { hand: "Q7s", equity: 57.4 },
  { hand: "Q6s", equity: 55.8 },
  { hand: "Q5s", equity: 54.6 },
  { hand: "Q4s", equity: 53.0 },
  { hand: "Q3s", equity: 51.3 },
  { hand: "Q2s", equity: 49.5 },
  { hand: "QJo", equity: 60.5 },
  { hand: "QTo", equity: 59.2 },
  { hand: "Q9o", equity: 57.4 },
  { hand: "Q8o", equity: 55.5 },
  { hand: "Q7o", equity: 53.7 },
  { hand: "Q6o", equity: 51.9 },
  { hand: "Q5o", equity: 50.8 },
  { hand: "Q4o", equity: 49.0 },
  { hand: "Q3o", equity: 47.1 },
  { hand: "Q2o", equity: 45.2 },
  { hand: "JJ", equity: 77.2 },
  { hand: "JTs", equity: 61.4 },
  { hand: "J9s", equity: 59.8 },
  { hand: "J8s", equity: 58.1 },
  { hand: "J7s", equity: 56.4 },
  { hand: "J6s", equity: 54.6 },
  { hand: "J5s", equity: 53.3 },
  { hand: "J4s", equity: 51.5 },
  { hand: "J3s", equity: 49.6 },
  { hand: "J2s", equity: 47.6 },
  { hand: "JTo", equity: 58.8 },
  { hand: "J9o", equity: 56.8 },
  { hand: "J8o", equity: 54.8 },
  { hand: "J7o", equity: 52.8 },
  { hand: "J6o", equity: 50.8 },
  { hand: "J5o", equity: 49.6 },
  { hand: "J4o", equity: 47.6 },
  { hand: "J3o", equity: 45.5 },
  { hand: "J2o", equity: 43.4 },
  { hand: "TT", equity: 75.0 },
  { hand: "T9s", equity: 59.5 },
  { hand: "T8s", equity: 57.8 },
  { hand: "T7s", equity: 56.0 },
  { hand: "T6s", equity: 54.1 },
  { hand: "T5s", equity: 52.7 },
  { hand: "T4s", equity: 50.8 },
  { hand: "T3s", equity: 48.8 },
  { hand: "T2s", equity: 46.7 },
  { hand: "T9o", equity: 56.6 },
  { hand: "T8o", equity: 54.5 },
  { hand: "T7o", equity: 52.4 },
  { hand: "T6o", equity: 50.2 },
  { hand: "T5o", equity: 48.9 },
  { hand: "T4o", equity: 46.7 },
  { hand: "T3o", equity: 44.5 },
  { hand: "T2o", equity: 42.2 },
  { hand: "99", equity: 72.1 },
  { hand: "98s", equity: 57.3 },
  { hand: "97s", equity: 55.5 },
  { hand: "96s", equity: 53.5 },
  { hand: "95s", equity: 52.0 },
  { hand: "94s", equity: 50.0 },
  { hand: "93s", equity: 47.9 },
  { hand: "92s", equity: 45.7 },
  { hand: "98o", equity: 54.3 },
  { hand: "97o", equity: 52.2 },
  { hand: "96o", equity: 50.0 },
  { hand: "95o", equity: 48.6 },
  { hand: "94o", equity: 46.4 },
  { hand: "93o", equity: 44.1 },
  { hand: "92o", equity: 41.8 },
  { hand: "88", equity: 69.3 },
  { hand: "87s", equity: 55.2 },
  { hand: "86s", equity: 53.4 },
  { hand: "85s", equity: 51.5 },
  { hand: "84s", equity: 49.5 },
  { hand: "83s", equity: 47.4 },
  { hand: "82s", equity: 45.2 },
  { hand: "87o", equity: 52.2 },
  { hand: "86o", equity: 50.1 },
  { hand: "85o", equity: 48.1 },
  { hand: "84o", equity: 45.9 },
  { hand: "83o", equity: 43.6 },
  { hand: "82o", equity: 41.3 },
  { hand: "77", equity: 66.5 },
  { hand: "76s", equity: 53.2 },
  { hand: "75s", equity: 51.3 },
  { hand: "74s", equity: 49.3 },
  { hand: "73s", equity: 47.2 },
  { hand: "72s", equity: 45.0 },
  { hand: "76o", equity: 50.1 },
  { hand: "75o", equity: 48.1 },
  { hand: "74o", equity: 45.9 },
  { hand: "73o", equity: 43.6 },
  { hand: "72o", equity: 41.2 },
  { hand: "66", equity: 63.7 },
  { hand: "65s", equity: 51.2 },
  { hand: "64s", equity: 49.2 },
  { hand: "63s", equity: 47.1 },
  { hand: "62s", equity: 44.9 },
  { hand: "65o", equity: 48.1 },
  { hand: "64o", equity: 45.9 },
  { hand: "63o", equity: 43.7 },
  { hand: "62o", equity: 41.3 },
  { hand: "55", equity: 60.8 },
  { hand: "54s", equity: 49.2 },
  { hand: "53s", equity: 47.2 },
  { hand: "52s", equity: 45.1 },
  { hand: "54o", equity: 46.1 },
  { hand: "53o", equity: 44.0 },
  { hand: "52o", equity: 41.7 },
  { hand: "44", equity: 57.9 },
  { hand: "43s", equity: 47.2 },
  { hand: "42s", equity: 45.1 },
  { hand: "43o", equity: 44.0 },
  { hand: "42o", equity: 41.7 },
  { hand: "33", equity: 54.8 },
  { hand: "32s", equity: 45.1 },
  { hand: "32o", equity: 41.7 },
  { hand: "22", equity: 51.5 },
];

export default function EquityPage() {
  const [heroRange, setHeroRange] = useState<Set<string>>(new Set());
  const [villainRange, setVillainRange] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"chart" | "heatmap">("chart");

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-poker-gold">Equity Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Hero Range</h2>
          <RangeSelector value={heroRange} onChange={setHeroRange} />
        </div>

        <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Villain Range</h2>
          <RangeSelector value={villainRange} onChange={setVillainRange} />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-8 border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/50">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Board Cards</h2>
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-24 sm:h-32 flex items-center justify-center text-gray-500">
          Board Display - EquityChart Component
        </div>
      </div>

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
        {viewMode === "chart" ? (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <EquityChart data={MOCK_EQUITY_DATA} />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4 flex justify-center">
            <EquityHeatmap
              data={MOCK_EQUITY_HEATMAP_DATA}
              onCellClick={(hand, equity) => console.log(`Clicked ${hand}: ${equity}%`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const MOCK_EQUITY_DATA: EquityEntry[] = [
  { hand: "AA", heroEquity: 81.2, heroWin: 79.1, heroTie: 2.1, villainEquity: 18.8, villainWin: 17.2, villainTie: 1.6 },
  { hand: "KK", heroEquity: 79.8, heroWin: 77.5, heroTie: 2.3, villainEquity: 20.2, villainWin: 18.4, villainTie: 1.8 },
  { hand: "QQ", heroEquity: 77.1, heroWin: 74.2, heroTie: 2.9, villainEquity: 22.9, villainWin: 20.8, villainTie: 2.1 },
  { hand: "AKs", heroEquity: 65.4, heroWin: 62.1, heroTie: 3.3, villainEquity: 34.6, villainWin: 31.9, villainTie: 2.7 },
  { hand: "AKo", heroEquity: 63.2, heroWin: 59.8, heroTie: 3.4, villainEquity: 36.8, villainWin: 34.1, villainTie: 2.7 },
  { hand: "JJ", heroEquity: 71.5, heroWin: 68.3, heroTie: 3.2, villainEquity: 28.5, villainWin: 25.9, villainTie: 2.6 },
  { hand: "TT", heroEquity: 69.2, heroWin: 65.7, heroTie: 3.5, villainEquity: 30.8, villainWin: 28.1, villainTie: 2.7 },
  { hand: "99", heroEquity: 66.8, heroWin: 62.9, heroTie: 3.9, villainEquity: 33.2, villainWin: 30.4, villainTie: 2.8 },
];
