"use client";

import { useState, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

type Suit = "h" | "d" | "c" | "s";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K";

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];
const SUITS: Suit[] = ["h", "d", "c", "s"];

const SUIT_SYMBOLS: Record<Suit, string> = { h: "♥", d: "♦", c: "♣", s: "♠" };
const SUIT_COLORS: Record<Suit, string> = {
  h: "text-red-400", d: "text-red-400", c: "text-gray-300", s: "text-gray-300",
};

interface Card {
  rank: Rank;
  suit: Suit;
}

interface EquityResult {
  equity1: number;
  equity2: number;
  samples: number;
  hand1Name: string;
  hand2Name: string;
}

// ============================================================================
// Card Parsing
// ============================================================================

function parseCard(str: string): Card | null {
  const s = str.trim().toLowerCase();
  if (s.length < 2) return null;
  const rank = s[0].toUpperCase() as Rank;
  const suit = s[1] as Suit;
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit };
}

function cardToString(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function parseHand(input: string, expectedCount: number): Card[] | null {
  const parts = input.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== expectedCount) return null;
  const cards: Card[] = [];
  for (const p of parts) {
    const c = parseCard(p);
    if (!c) return null;
    cards.push(c);
  }
  const seen = new Set<string>();
  for (const c of cards) {
    const key = cardToString(c);
    if (seen.has(key)) return null;
    seen.add(key);
  }
  return cards;
}

// ============================================================================
// Hand Description (best 5-card hand from 5 hole cards + board)
// ============================================================================

const RANK_VALUES: Record<Rank, number> = {
  A: 14, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  8: 8, 9: 9, T: 10, J: 11, Q: 12, K: 13,
};

function describeHand(cards: Card[]): string {
  if (cards.length < 5) return `${cards.length} cards`;
  const values = cards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  if (uniqueValues.length >= 5) {
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true;
        break;
      }
    }
    // Wheel: A-2-3-4-5
    if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) &&
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
      isStraight = true;
    }
  }

  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, c]) => ({ value: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (isFlush && isStraight) return "Straight Flush";
  if (groups[0].count === 4) return "Four of a Kind";
  if (groups[0].count === 3 && groups[1]?.count === 2) return "Full House";
  if (isFlush) return "Flush";
  if (isStraight) return "Straight";
  if (groups[0].count === 3) return "Three of a Kind";
  if (groups[0].count === 2 && groups[1]?.count === 2) return "Two Pair";
  if (groups[0].count === 2) return "One Pair";
  return "High Card";
}

// ============================================================================
// Card Display Component
// ============================================================================

function CardChip({ card }: { card: Card }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-mono font-bold">
      <span className="text-white">{card.rank}</span>
      <span className={SUIT_COLORS[card.suit]}>{SUIT_SYMBOLS[card.suit]}</span>
    </span>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PLO5Page() {
  const [hand1, setHand1] = useState("");
  const [hand2, setHand2] = useState("");
  const [board, setBoard] = useState("");
  const [samples, setSamples] = useState(10000);
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedHand1, setParsedHand1] = useState<Card[] | null>(null);
  const [parsedHand2, setParsedHand2] = useState<Card[] | null>(null);
  const [parsedBoard, setParsedBoard] = useState<Card[] | null>(null);

  const handleHand1Change = (val: string) => {
    setHand1(val);
    setParsedHand1(parseHand(val, 5));
  };

  const handleHand2Change = (val: string) => {
    setHand2(val);
    setParsedHand2(parseHand(val, 5));
  };

  const handleBoardChange = (val: string) => {
    setBoard(val);
    if (val.trim() === "") {
      setParsedBoard([]);
    } else {
      setParsedBoard(parseHand(val, val.split(/[,\s]+/).filter(Boolean).length));
    }
  };

  const calculate = useCallback(async () => {
    const h1 = parseHand(hand1, 5);
    const h2 = parseHand(hand2, 5);

    if (!h1) {
      setError("Hand 1: enter 5 valid cards (e.g. Ah Kh Qh Jh Th)");
      return;
    }
    if (!h2) {
      setError("Hand 2: enter 5 valid cards (e.g. Ks Qs Js Ts 9s)");
      return;
    }

    // Check for overlapping cards between hands
    const allCards = new Set([...h1, ...h2].map(cardToString));
    if (allCards.size < 10) {
      setError("Hands cannot share cards");
      return;
    }

    // Check board cards don't overlap with hands
    const boardCards = parsedBoard || [];
    for (const bc of boardCards) {
      if (allCards.has(cardToString(bc))) {
        setError("Board cards cannot overlap with hand cards");
        return;
      }
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/omaha/plo5/equity/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hand1: h1.map(cardToString),
          hand2: h2.map(cardToString),
          board: boardCards.map(cardToString),
          samples,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult({
        equity1: data.equity1,
        equity2: data.equity2,
        samples: data.samples,
        hand1Name: describeHand(h1),
        hand2Name: describeHand(h2),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  }, [hand1, hand2, board, samples, parsedBoard]);

  const canCalculate =
    parsedHand1 !== null &&
    parsedHand2 !== null &&
    parsedBoard !== null &&
    !loading;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-poker-gold mb-1">
            PLO5 Equity Calculator
          </h1>
          <p className="text-gray-400 text-sm">
            5-card Pot-Limit Omaha equity calculator — enter two 5-card hands and an optional board.
            In PLO, you must use exactly 2 cards from your hand and 3 from the board.
          </p>
        </div>

        {/* Hand Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Your Hand (5 cards)
            </h2>
            <input
              type="text"
              value={hand1}
              onChange={(e) => handleHand1Change(e.target.value)}
              placeholder="Ah Kh Qh Jh Th"
              className="w-full bg-[#0E0E0E] border border-[#333] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-poker-gold focus:outline-none font-mono text-sm"
            />
            {parsedHand1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedHand1.map((c, i) => (
                  <span key={i} className="bg-[#262626] rounded px-2 py-1 text-xs">
                    <CardChip card={c} />
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Format: rank + suit (h/d/c/s), comma-separated
            </p>
          </div>

          <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Opponent Hand (5 cards)
            </h2>
            <input
              type="text"
              value={hand2}
              onChange={(e) => handleHand2Change(e.target.value)}
              placeholder="Ks Qs Js Ts 9s"
              className="w-full bg-[#0E0E0E] border border-[#333] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-poker-gold focus:outline-none font-mono text-sm"
            />
            {parsedHand2 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedHand2.map((c, i) => (
                  <span key={i} className="bg-[#262626] rounded px-2 py-1 text-xs">
                    <CardChip card={c} />
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Enter 5 cards, comma or space separated
            </p>
          </div>
        </div>

        {/* Board Input */}
        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Board (optional, 0-5 cards)
          </h2>
          <input
            type="text"
            value={board}
            onChange={(e) => handleBoardChange(e.target.value)}
            placeholder="Qs Jd 4h (flop), or Qs Jd 4h 7c 2s (river)"
            className="w-full bg-[#0E0E0E] border border-[#333] rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-poker-gold focus:outline-none font-mono text-sm"
          />
          {parsedBoard && parsedBoard.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {parsedBoard.map((c, i) => (
                <span key={i} className="bg-[#262626] rounded px-2 py-1 text-xs">
                  <CardChip card={c} />
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Leave empty for preflop Monte Carlo, or enter known board cards
          </p>
        </div>

        {/* Samples */}
        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Monte Carlo Samples
            </h2>
            <span className="text-lg font-mono text-poker-gold">
              {samples.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={samples}
            onChange={(e) => setSamples(Number(e.target.value))}
            className="w-full accent-poker-gold"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1,000 (fast)</span>
            <span>100,000 (accurate)</span>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculate}
          disabled={!canCalculate}
          className="w-full bg-poker-gold hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900 font-bold py-3.5 px-6 rounded-lg transition-colors text-lg mb-8"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </span>
          ) : (
            "Calculate Equity"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-white">Results</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Equity</p>
                <p className="text-4xl font-bold text-green-400 font-mono">
                  {result.equity1.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current: {result.hand1Name}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Opponent Equity</p>
                <p className="text-4xl font-bold text-blue-400 font-mono">
                  {result.equity2.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current: {result.hand2Name}
                </p>
              </div>
            </div>

            {/* Equity bar */}
            <div className="h-8 rounded-full overflow-hidden flex bg-[#0E0E0E] mb-4">
              <div
                className="bg-green-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${result.equity1}%` }}
              >
                {result.equity1 > 12 && (
                  <span className="text-xs font-bold text-gray-900">
                    {result.equity1.toFixed(0)}%
                  </span>
                )}
              </div>
              <div
                className="bg-blue-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${result.equity2}%` }}
              >
                {result.equity2 > 12 && (
                  <span className="text-xs font-bold text-white">
                    {result.equity2.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Samples: {result.samples.toLocaleString()}</span>
              <span>Total: {(result.equity1 + result.equity2).toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* How PLO5 Works */}
        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            How PLO5 Works
          </h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Each player receives 5 hole cards (instead of 2 in NLH or 4 in PLO4)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              You must use exactly 2 cards from your hand + 3 from the board (same as PLO4)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              The extra card increases variance and makes draws more powerful
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Nut hands (AAxxx, KKxxx) have slightly less equity than in PLO4
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Wrap draws and flush draws are more common — suited hands gain value
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
