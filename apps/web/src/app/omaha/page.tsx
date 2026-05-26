"use client";

import { useState } from "react";

type OmahaTab = "plo5" | "hilo" | "shortdeck";

interface HandResult {
  equity1: number;
  equity2: number;
  samples: number;
  rank1?: number;
  rank2?: number;
}

const TAB_CONFIGS = {
  plo5: {
    title: "PLO5 Equity Calculator",
    description: "5-card Pot-Limit Omaha equity calculator powered by PH Evaluator",
    endpoint: "/api/omaha/plo5/equity",
    cardCount: 5,
    tips: [
      "• PLO5 uses 5 hole cards, must use exactly 2 + 3 board",
      "• With 5 cards, hand ranges are much wider",
      "• Suited connectors and gappers have more value",
      "• High cards (A, K, Q) are stronger due to more possible straights",
    ],
  },
  hilo: {
    title: "Omaha Hi/Lo Equity Calculator",
    description: "8-or-better split pot Omaha equity calculator",
    endpoint: "/api/omaha/hi-lo/equity",
    cardCount: 4,
    tips: [
      "• Omaha Hi/Lo uses 4 hole cards, must use exactly 2 + 3 board",
      "• Hand qualifies for low if it's 8-or-better (8-7-6-5-4 low)",
      "• Aces are strong for both high AND low",
      "• Double-suited hands that can win both halves are premium",
      "• Scooping (winning both halves) is key to profitability",
    ],
  },
  shortdeck: {
    title: "Shortdeck Equity Calculator",
    description: "6+ Hold'em (Shortdeck) equity calculator",
    endpoint: "/api/omaha/shortdeck/equity",
    cardCount: 4,
    tips: [
      "• Shortdeck uses 4 hole cards (like regular Omaha)",
      "• Deck is 36 cards (9-A in each suit, 6s removed)",
      "• Flush beats a full house (like PLO)",
      "• A♥6♥7♥8♥9♥ beats K♥K♥K♥Q♥Q♥",
      "• Straights are more common, high pairs less dominant",
    ],
  },
};

export default function OmahaPage() {
  const [activeTab, setActiveTab] = useState<OmahaTab>("plo5");
  const [hand1, setHand1] = useState("");
  const [hand2, setHand2] = useState("");
  const [board, setBoard] = useState("");
  const [samples, setSamples] = useState(10000);
  const [result, setResult] = useState<HandResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = TAB_CONFIGS[activeTab];

  const calculateEquity = async () => {
    if (!hand1 || !hand2) {
      setError("Enter both hands");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(config.endpoint, {
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
    const maxRank = activeTab === "plo5" ? 541314 : 7462;
    const pct = (rank / maxRank) * 100;
    if (pct < 5) return "Premium";
    if (pct < 15) return "Strong";
    if (pct < 30) return "Good";
    if (pct < 50) return "Average";
    return "Weak";
  };

  const tabs = [
    { id: "plo5", label: "PLO5" },
    { id: "hilo", label: "Omaha Hi/Lo" },
    { id: "shortdeck", label: "Shortdeck" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        <p className="text-gray-400 mb-8">{config.description}</p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResult(null);
                setError("");
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Hand 1</h2>
            <input
              type="text"
              value={hand1}
              onChange={(e) => setHand1(e.target.value)}
              placeholder={activeTab === "plo5" ? "Ah, Kh, Qh, Jh, 9h (comma-separated)" : "Ah, Kh, Qh, Jh (comma-separated)"}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
            />
            <p className="text-sm text-gray-500">
              Enter {activeTab === "plo5" ? 5 : 4} cards, comma-separated
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Hand 2</h2>
            <input
              type="text"
              value={hand2}
              onChange={(e) => setHand2(e.target.value)}
              placeholder={activeTab === "plo5" ? "Ad, Kd, Qd, Jd, 9d (comma-separated)" : "Ad, Kd, Qd, Jd (comma-separated)"}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2"
            />
            <p className="text-sm text-gray-500">
              Enter {activeTab === "plo5" ? 5 : 4} cards, comma-separated
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
          <h2 className="text-lg font-semibold mb-2">{activeTab} Tips</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            {config.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}