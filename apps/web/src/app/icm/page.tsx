"use client";

import { useState, useEffect, useCallback } from "react";
import { PrizePoolPanel } from "@/components/icm/PrizePoolPanel";
import { ChipStackPanel } from "@/components/icm/ChipStackPanel";
import { ICMResults } from "@/components/icm/ICMResults";
import { useICMCalculator } from "@/hooks/useICMCalculator";

interface PrizePoolEntry {
  place: number;
  percentage: number;
}

interface PlayerStack {
  id: string;
  name: string;
  chips: number;
}

export default function ICMPage() {
  const [prizes, setPrizes] = useState<PrizePoolEntry[]>([
    { place: 1, percentage: 50 },
    { place: 2, percentage: 30 },
    { place: 3, percentage: 20 },
  ]);

  const [players, setPlayers] = useState<PlayerStack[]>([
    { id: "1", name: "Big Stack", chips: 3000 },
    { id: "2", name: "Mid Stack", chips: 1500 },
    { id: "3", name: "Short Stack", chips: 800 },
    { id: "4", name: "Micro Stack", chips: 500 },
  ]);

  const [totalPrize, setTotalPrize] = useState<number>(1000);
  const [totalChips, setTotalChips] = useState<number>(5800);

  const { calculateICM, results, totalPrizePool, totalChips: apiTotalChips, loading, error, clearError } = useICMCalculator();

  const performCalculation = useCallback(async () => {
    const stacks = players.map((p) => p.chips);
    const prizesList = prizes.map((p) => (p.percentage / 100) * totalPrize);
    const playersList = players.map((p) => p.name);

    await calculateICM({
      stacks,
      prizes: prizesList,
      players: playersList,
      n_simulations: 100000,
    });
  }, [players, prizes, totalPrize, calculateICM]);

  const handleCalculate = useCallback(async () => {
    clearError();
    await performCalculation();
  }, [clearError, performCalculation]);

  // Auto-calculate on initial load
  useEffect(() => {
    performCalculation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playerChips = players.map((p) => ({ name: p.name, chips: p.chips }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-poker-gold">ICM Calculator</h1>
        <p className="text-gray-400">
          Calculate Independent Chip Model values for tournament situations
        </p>
      </div>

      {/* Quick Settings */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Tournament Buy-in:</label>
          <input
            type="number"
            value={totalPrize}
            onChange={(e) => setTotalPrize(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-28 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-center"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Total Chips:</label>
          <input
            type="number"
            value={totalChips}
            onChange={(e) => setTotalChips(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-28 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-center"
          />
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="px-4 py-1.5 bg-poker-gold text-black font-semibold rounded text-sm hover:bg-poker-gold/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 border border-red-800 rounded bg-red-900/20 text-red-400">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-sm hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prize Pool */}
        <div className="lg:col-span-1 space-y-6">
          <PrizePoolPanel
            prizes={prizes}
            onPrizesChange={setPrizes}
            totalPrize={totalPrize}
          />
        </div>

        {/* Middle Column - Chip Stacks */}
        <div className="lg:col-span-1 space-y-6">
          <ChipStackPanel
            players={players}
            onPlayersChange={setPlayers}
            totalChips={totalChips}
          />
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-1 space-y-6">
          {loading ? (
            <div className="border border-gray-800 rounded-lg p-8 bg-gray-900/50 flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-poker-gold border-t-transparent rounded-full mx-auto mb-4" />
                <div className="text-muted-foreground">Calculating ICM...</div>
              </div>
            </div>
          ) : (
            <ICMResults
              results={results ?? undefined}
              playerChips={playerChips}
              prizes={prizes}
              totalPrizePool={totalPrizePool ?? totalPrize}
            />
          )}
        </div>
      </div>

      {/* Full Width Results for larger screens */}
      <div className="mt-8 grid grid-cols-1 gap-6">
        {loading ? (
          <div className="border border-gray-800 rounded-lg p-8 bg-gray-900/50 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-poker-gold border-t-transparent rounded-full mx-auto mb-4" />
              <div className="text-muted-foreground">Calculating ICM...</div>
            </div>
          </div>
        ) : (
          <ICMResults
            results={results ?? undefined}
            playerChips={playerChips}
            prizes={prizes}
            totalPrizePool={totalPrizePool ?? totalPrize}
            className="w-full"
          />
        )}
      </div>

      {/* Info Section */}
      <div className="mt-12 p-6 border border-gray-800 rounded-lg bg-gray-900/30">
        <h2 className="text-xl font-semibold mb-4 text-poker-gold">About ICM</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
          <div>
            <h3 className="font-medium text-white mb-2">What is ICM?</h3>
            <p>
              The Independent Chip Model (ICM) is a mathematical model used in poker 
              tournaments to calculate the equity of a player's stack based on 
              their probability of finishing in each prize position.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Why use ICM?</h3>
            <p>
              ICM helps players make better decisions in tournament situations by 
              converting chip stacks into real money expected value. This is crucial 
              for freezeouts and when prizepools are top-heavy.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Bubble Factors</h3>
            <p>
              The bubble factor measures how much more valuable each chip becomes 
              as the tournament progresses. A high bubble factor means saving chips 
              is more important than accumulating them.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Practical Applications</h3>
            <p>
              Use ICM calculations to determine optimal push/fold ranges, 
              understand calling conventions, and make better bubble play decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
