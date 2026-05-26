"use client";

import { useState } from "react";

interface HandResult {
  equity1: number;
  equity2: number;
  samples: number;
  rank1?: number;
  rank2?: number;
}

export default function PLO4Page() {
  const [hand1, setHand1] = useState("");
  const [hand2, setHand2] = useState("");
  const [board, setBoard] = useState("");
  const [samples, setSamples] = useState(10000);
  const [result, setResult] = useState<HandResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateEquity = async () => {
    if (!hand1 || !hand2) {
      setError("Enter both hands");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/plo4/equity/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hand1: hand1.split(",").map((c) => c.trim()).filter(Boolean),
          hand2: hand2.split(",").map((c) => c.trim()).filter(Boolean),
          board: board.split(",").map((c) => c.trim()).filter(Boolean),
          samples,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate equity");
      }

      const data = await response.json();
      setResult({
        equity1: data.equity1,
        equity2: data.equity2,
        samples: data.samples,
        rank1: data.hand1_rank,
        rank2: data.hand2_rank,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getHandStrength = (rank: number | undefined) => {
    if (!rank) return "Unknown";
    const pct = (rank / 7462) * 100;
    if (pct < 5) return "Premium";
    if (pct < 15) return "Strong";
    if (pct < 30) return "Good";
    if (pct < 50) return "Average";
    return "Weak";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PLO4 Equity Calculator</h1>
        <p className="text-gray-400 mb-8">
          Pot-Limit Omaha 4-card hand equity calculator powered by PH Evaluator
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Hand 1</h2>
            <input
              type="text"
              value={hand1}
              onChange={(e) => setHand1(e.target.value)}
              placeholder="Ah, Kh, Qh, Jh (comma-separated)"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
            />
            <p className="text-sm text-gray-500">
              Enter 4 cards, comma-separated
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Hand 2</h2>
            <input
              type="text"
              value={hand2}
              onChange={(e) => setHand2(e.target.value)}
              placeholder="Ad, Kd, Qd, Jd (comma-separated)"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
            />
            <p className="text-sm text-gray-500">
              Enter 4 cards, comma-separated
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Board (Optional)</h2>
          <input
            type="text"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder="Tc, 9c, 8c, 7c, 6c (up to 5 cards)"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
          />
          <p className="text-sm text-gray-500">
            Leave empty for Monte Carlo simulation
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Simulation Samples</h2>
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
        </div>

        <button
          onClick={calculateEquity}
          disabled={loading || !hand1 || !hand2}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors mb-8"
        >
          {loading ? "Calculating..." : "Calculate Equity"}
        </button>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 rm-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-gray-400 mb-1">Hand 1 Equity</p>
                <p className="text-4xl font-bold text-green-400">
                  {result.equity1.toFixed(1)}%
                </p>
                {result.rank1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Rank: {result.rank1} ({getHandStrength(result.rank1)})
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-1">Hand 2 Equity</p>
                <p className="text-4xl font-bold text-blue-400">
                  {result.equity2.toFixed(1)}%
                </p>
                {result.rank2 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Rank: {result.rank2} ({getHandStrength(result.rank2)})
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>Samples: {result.samples.toLocaleString()}</span>
              {result.rank1 && result.rank2 && (
                <span>
                  Winner: {result.rank1 < result.rank2 ? "Hand 1" : "Hand 2"}
                </span>
              )}
            </div>

            {/* Equity bar visualization */}
            <div className="mt-6">
              <div className="h-8 rounded-full overflow-hidden flex">
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
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">PLO4 Tips</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• PLO4 uses 4 hole cards, must use exactly 2 + 3 board</li>
            <li>• Double-suited hands (AAKK ds) are extremely strong</li>
            <li>• Connected cards (9TnJT) have more straight potential</li>
            <li>• Position matters more in PLO than NLHE due to polarised ranges</li>
            <li>• Broadway cards (T-A) are stronger with more players in the pot</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
