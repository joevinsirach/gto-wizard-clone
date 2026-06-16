"use client";

import { useState } from "react";

interface ScoopStats {
  total_sims: number;
  scoop_wins: number;
  chop_wins: number;
  scoop_losses: number;
  adjusted_equity: number;
}

interface EquityResult {
  equity1: number;
  equity2: number;
  samples: number;
  scoop_stats: ScoopStats;
  hand1: string[];
  hand2: string[];
}

const CARD_OPTIONS = [
  "Ah", "Kh", "Qh", "Jh", "Th", "9h", "8h", "7h", "6h", "5h", "4h", "3h", "2h",
  "Ad", "Kd", "Qd", "Jd", "Td", "9d", "8d", "7d", "6d", "5d", "4d", "3d", "2d",
  "Ac", "Kc", "Qc", "Jc", "Tc", "9c", "8c", "7c", "6c", "5c", "4c", "3c", "2c",
  "As", "Ks", "Qs", "Js", "Ts", "9s", "8s", "7s", "6s", "5s", "4s", "3s", "2s",
];

function CardSelector({
  label,
  selectedCards,
  onChange,
  maxCards = 5,
}: {
  label: string;
  selectedCards: string[];
  onChange: (cards: string[]) => void;
  maxCards?: number;
}) {
  const handleCardClick = (card: string) => {
    if (selectedCards.includes(card)) {
      onChange(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < maxCards) {
      onChange([...selectedCards, card]);
    }
  };

  const suits = ["h", "d", "c", "s"];
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">{label}</h3>
      <div className="flex flex-wrap gap-1 mb-3">
        {selectedCards.map((card) => (
          <span
            key={card}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
          >
            {card}
            <button
              onClick={() => onChange(selectedCards.filter((c) => c !== card))}
              className="hover:text-red-300"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="text-sm text-gray-400 mb-2">
        {selectedCards.length}/{maxCards} cards selected
      </div>
      <div className="grid grid-cols-13 gap-0.5">
        {ranks.map((rank) =>
          suits.map((suit) => {
            const card = rank + suit;
            const isSelected = selectedCards.includes(card);
            return (
              <button
                key={card}
                onClick={() => handleCardClick(card)}
                className={`
                  w-8 h-10 text-xs font-mono rounded
                  ${isSelected ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}
                  ${card[1] === "h" || card[1] === "d" ? "text-red-400" : "text-gray-200"}
                `}
              >
                {card}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DoubleBoardPage() {
  const [hand1, setHand1] = useState<string[]>([]);
  const [hand2, setHand2] = useState<string[]>([]);
  const [board1, setBoard1] = useState<string[]>([]);
  const [board2, setBoard2] = useState<string[]>([]);
  const [samples, setSamples] = useState(10000);
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateEquity = async () => {
    if (hand1.length !== 4) {
      setError("Hand 1 must have 4 cards");
      return;
    }
    if (hand2.length !== 4) {
      setError("Hand 2 must have 4 cards");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/double-board/equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hand1,
          hand2,
          board1,
          board2,
          samples,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate equity");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getEquityColor = (equity: number) => {
    if (equity > 60) return "text-green-400";
    if (equity > 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Double Board PLO</h1>
        <p className="text-gray-400 mb-8">
          Novel variant — two independent boards. Scoop if you win both, chop if you win one.
        </p>

        {/* Hands Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CardSelector
            label="Hand 1 (4 cards)"
            selectedCards={hand1}
            onChange={setHand1}
            maxCards={4}
          />
          <CardSelector
            label="Hand 2 (4 cards)"
            selectedCards={hand2}
            onChange={setHand2}
            maxCards={4}
          />
        </div>

        {/* Boards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CardSelector
            label="Board 1 (up to 5)"
            selectedCards={board1}
            onChange={setBoard1}
            maxCards={5}
          />
          <CardSelector
            label="Board 2 (up to 5)"
            selectedCards={board2}
            onChange={setBoard2}
            maxCards={5}
          />
        </div>

        {/* Samples */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Simulation Samples</h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={samples}
              onChange={(e) => setSamples(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xl font-mono">{samples.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Leave boards empty for Monte Carlo simulation
          </p>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateEquity}
          disabled={loading || hand1.length !== 4 || hand2.length !== 4}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors mb-8"
        >
          {loading ? "Calculating..." : "Calculate Double Board Equity"}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Results</h2>

            {/* Equity Display */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-gray-400 mb-1">Hand 1 Equity</p>
                <p className={`text-4xl font-bold ${getEquityColor(result.equity1)}`}>
                  {result.equity1.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-1">Hand 2 Equity</p>
                <p className={`text-4xl font-bold ${getEquityColor(result.equity2)}`}>
                  {result.equity2.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Equity Bar */}
            <div className="h-8 rounded-full overflow-hidden flex mb-6">
              <div
                className="bg-green-500 flex items-center justify-center"
                style={{ width: `${result.equity1}%` }}
              >
                {result.equity1 > 15 && (
                  <span className="text-sm font-bold">{result.equity1.toFixed(0)}%</span>
                )}
              </div>
              <div
                className="bg-blue-500 flex items-center justify-center"
                style={{ width: `${result.equity2}%` }}
              >
                {result.equity2 > 15 && (
                  <span className="text-sm font-bold">{result.equity2.toFixed(0)}%</span>
                )}
              </div>
            </div>

            {/* Scoop Stats */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Scoop/Chop Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {result.scoop_stats.scoop_wins}
                  </p>
                  <p className="text-sm text-gray-400">Scoop Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {result.scoop_stats.chop_wins}
                  </p>
                  <p className="text-sm text-gray-400">Chop Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {result.scoop_stats.scoop_losses}
                  </p>
                  <p className="text-sm text-gray-400">Scoop Losses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {result.samples.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Total Sims</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">Adjusted Equity Formula</p>
                <p className="text-lg font-mono">
                  ({result.scoop_stats.scoop_wins} × 1.0 + {result.scoop_stats.chop_wins} × 0.5) / {result.scoop_stats.total_sims}
                  {" = "}
                  <span className="text-purple-400">
                    {(result.scoop_stats.adjusted_equity * 100).toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>

            {/* Hand Cards Display */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Hand 1</p>
                <div className="flex gap-2">
                  {result.hand1.map((card) => (
                    <span
                      key={card}
                      className="bg-blue-600 text-white px-3 py-2 rounded font-mono"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Hand 2</p>
                <div className="flex gap-2">
                  {result.hand2.map((card) => (
                    <span
                      key={card}
                      className="bg-blue-600 text-white px-3 py-2 rounded font-mono"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">How Double Board PLO Works</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Two independent boards are dealt at showdown</li>
            <li>• <span className="text-green-400">Scoop</span>: Win BOTH boards = 1.0 points</li>
            <li>• <span className="text-yellow-400">Chop</span>: Win one board, lose one = 0.5 points</li>
            <li>• <span className="text-red-400">Lose both</span>: 0.0 points</li>
            <li>• Adjusted Equity = (Scoop Wins × 1.0 + Chop Wins × 0.5) / Total Sims</li>
          </ul>
        </div>
      </div>
    </div>
  );
}