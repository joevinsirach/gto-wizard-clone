"use client";

import { useState } from "react";

interface GameState {
  positions: string[];
  straddle_map: Record<number, number>;
  junk_blinds: number[];
  betting_order: number[];
  betting_acted: number[];
  current_bettor: number;
  phase: string;
  pot: number;
  board: string[];
  player_count: number;
}

interface EquityResult {
  hand1: string[];
  hand2: string[];
  straddle_map: Record<number, number>;
  pot: number;
  equity1: number;
  equity2: number;
  samples: number;
}

const POSITION_NAMES = ["UTG", "UTG+1", "UTG+2", "CO", "BTN", "SB", "BB"];

export default function BombPotPage() {
  const [playerCount, setPlayerCount] = useState(4);
  const [straddleMap, setStraddleMap] = useState<Record<number, number>>({});
  const [junkBlinds, setJunkBlinds] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [heroHand, setHeroHand] = useState<string[]>([]);
  const [villainHand, setVillainHand] = useState<string[]>([]);
  const [equityResult, setEquityResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStraddleChange = (position: number, amount: string) => {
    const val = parseInt(amount) || 0;
    setStraddleMap((prev) => {
      const next = { ...prev };
      if (val > 0) {
        next[position] = val;
      } else {
        delete next[position];
      }
      return next;
    });
  };

  const createGameState = async () => {
    setLoading(true);
    setError("");

    const positions = POSITION_NAMES.slice(0, playerCount);

    try {
      const response = await fetch("/api/bomb-pot/game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions,
          straddle_map: straddleMap,
          junk_blinds: junkBlinds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game state");
      }

      const data = await response.json();
      setGameState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const calculateEquity = async () => {
    if (heroHand.length !== 4) {
      setError("Hero must have 4 cards");
      return;
    }
    if (villainHand.length !== 4) {
      setError("Villain must have 4 cards");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bomb-pot/equity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hand1: heroHand,
          hand2: villainHand,
          straddle_map: straddleMap,
          junk_blinds: junkBlinds,
          samples: 10000,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate equity");
      }

      const data = await response.json();
      setEquityResult(data);
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Bomb Pot</h1>
        <p className="text-gray-400 mb-8">
          Novel variant — pre-flop action BEFORE the board is dealt. No fold option for straddlers.
        </p>

        {/* Player Count */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Player Count</h3>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`
                  px-4 py-2 rounded font-bold
                  ${playerCount === n ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}
                `}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Straddle Configuration */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Straddle Map</h3>
          <p className="text-sm text-gray-400 mb-3">
            Select which positions straddle and how much. Leave at 0 for no straddle.
          </p>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {POSITION_NAMES.slice(0, playerCount).map((name, idx) => (
              <div key={idx} className="text-center">
                <p className="text-sm text-gray-400 mb-1">{name}</p>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0"
                  value={straddleMap[idx] || ""}
                  onChange={(e) => handleStraddleChange(idx, e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-center"
                />
              </div>
            ))}
          </div>
          {Object.keys(straddleMap).length > 0 && (
            <div className="mt-3 text-sm text-gray-400">
              Straddlers: {Object.entries(straddleMap)
                .map(([pos, amt]) => `${POSITION_NAMES[parseInt(pos)]} ($${amt})`)
                .join(", ")}
            </div>
          )}
        </div>

        {/* Junk Blinds */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Junk Blinds / Antes</h3>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 20, 25].map((amt) => (
              <button
                key={amt}
                onClick={() =>
                  setJunkBlinds((prev) =>
                    prev.includes(amt) ? prev.filter((x) => x !== amt) : [...prev, amt]
                  )
                }
                className={`
                  px-4 py-2 rounded
                  ${junkBlinds.includes(amt) ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}
                `}
              >
                ${amt} ante
              </button>
            ))}
          </div>
        </div>

        {/* Create Game Button */}
        <button
          onClick={createGameState}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-6"
        >
          {loading ? "Creating..." : "Create Game State"}
        </button>

        {/* Game State Display */}
        {gameState && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Game State</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Phase</p>
                <p className="text-xl font-bold text-purple-400 uppercase">{gameState.phase}</p>
              </div>
              <div>
                <p className="text-gray-400">Pot Size</p>
                <p className="text-xl font-bold text-green-400">${gameState.pot}</p>
              </div>
              <div>
                <p className="text-gray-400">Current Bettor</p>
                <p className="text-lg">{POSITION_NAMES[gameState.current_bettor] || gameState.current_bettor}</p>
              </div>
              <div>
                <p className="text-gray-400">Players</p>
                <p className="text-lg">{gameState.player_count}</p>
              </div>
            </div>

            {gameState.straddle_map && Object.keys(gameState.straddle_map).length > 0 && (
              <div className="mt-3 text-sm">
                <p className="text-gray-400">Straddle Map:</p>
                <p className="text-yellow-400">
                  {Object.entries(gameState.straddle_map)
                    .map(([pos, amt]) => `${POSITION_NAMES[parseInt(pos)]}: $${amt}`)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Equity Calculator */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Equity Calculator</h3>
          <p className="text-sm text-gray-400 mb-4">
            Calculate equity given the straddle configuration. Uses PLO4 rules.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Hero Hand (4 cards)</p>
              <input
                type="text"
                placeholder="Ah, Kh, Qh, Jh (comma-separated)"
                value={heroHand.join(", ")}
                onChange={(e) =>
                  setHeroHand(e.target.value.split(",").map((c) => c.trim()).filter(Boolean))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Villain Hand (4 cards)</p>
              <input
                type="text"
                placeholder="2h, 3h, 4h, 5h (comma-separated)"
                value={villainHand.join(", ")}
                onChange={(e) =>
                  setVillainHand(e.target.value.split(",").map((c) => c.trim()).filter(Boolean))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={calculateEquity}
            disabled={loading || heroHand.length !== 4 || villainHand.length !== 4}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded transition-colors"
          >
            {loading ? "Calculating..." : "Calculate Equity"}
          </button>
        </div>

        {/* Equity Results */}
        {equityResult && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Equity Results</h2>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="text-center">
                <p className="text-gray-400 mb-1">Hero Equity</p>
                <p className={`text-4xl font-bold ${getEquityColor(equityResult.equity1)}`}>
                  {equityResult.equity1.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-1">Villain Equity</p>
                <p className={`text-4xl font-bold ${getEquityColor(equityResult.equity2)}`}>
                  {equityResult.equity2.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Equity Bar */}
            <div className="h-8 rounded-full overflow-hidden flex mb-4">
              <div
                className="bg-green-500 flex items-center justify-center"
                style={{ width: `${equityResult.equity1}%` }}
              >
                {equityResult.equity1 > 15 && (
                  <span className="text-sm font-bold">{equityResult.equity1.toFixed(0)}%</span>
                )}
              </div>
              <div
                className="bg-red-500 flex items-center justify-center"
                style={{ width: `${equityResult.equity2}%` }}
              >
                {equityResult.equity2 > 15 && (
                  <span className="text-sm font-bold">{equityResult.equity2.toFixed(0)}%</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Pot</p>
                <p className="text-lg font-bold text-green-400">${equityResult.pot}</p>
              </div>
              <div>
                <p className="text-gray-400">Samples</p>
                <p className="text-lg font-bold">{equityResult.samples.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="bg-blue-600 text-white px-3 py-2 rounded font-mono">
                Hero: {equityResult.hand1.join(" ")}
              </span>
              <span className="bg-red-600 text-white px-3 py-2 rounded font-mono">
                Villain: {equityResult.hand2.join(" ")}
              </span>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">How Bomb Pot Works</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Pre-flop action happens BEFORE the board is dealt</li>
            <li>• <span className="text-red-400">No fold option</span> for players who posted straddle</li>
            <li>• Straddle round is a mandatory action round</li>
            <li>• All players see the flop/turn/river regardless of pre-flop action</li>
            <li>• Straddle adds to the pot — increases implied odds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}