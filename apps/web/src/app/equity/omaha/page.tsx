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
  high_equity1: number;
  high_equity2: number;
  low_equity1: number;
  low_equity2: number;
  scoop_equity1: number;
  scoop_equity2: number;
  samples: number;
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
// Hand Description (best 5-card Omaha hand: 2 from hand + 3 from board)
// ============================================================================

const RANK_VALUES: Record<Rank, number> = {
  A: 14, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  8: 8, 9: 9, T: 10, J: 11, Q: 12, K: 13,
};

function evaluateFiveCards(cards: Card[]): string {
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

/** Find the best Omaha hand (exactly 2 from hole + 3 from board) */
function describeOmahaHand(holeCards: Card[], boardCards: Card[]): string {
  if (holeCards.length < 2 || boardCards.length < 3) return "Incomplete";

  let bestRank = -1;
  let bestDesc = "High Card";

  for (const holeCombo of combinations(holeCards, 2)) {
    for (const boardCombo of combinations(boardCards, 3)) {
      const five = [...holeCombo, ...boardCombo];
      const desc = evaluateFiveCards(five);
      const rank = handRankValue(desc);
      if (rank > bestRank) {
        bestRank = rank;
        bestDesc = desc;
      }
    }
  }
  return bestDesc;
}

function handRankValue(desc: string): number {
  const ranks: Record<string, number> = {
    "High Card": 1, "One Pair": 2, "Two Pair": 3, "Three of a Kind": 4,
    "Straight": 5, "Flush": 6, "Full House": 7, "Four of a Kind": 8,
    "Straight Flush": 9,
  };
  return ranks[desc] ?? 0;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}

/** Check if a low hand is possible (8-or-better) */
function canMakeLow(holeCards: Card[], boardCards: Card[]): { hand1: boolean; hand2: boolean } {
  // A low is possible if there are at least 3 board cards with rank <= 8
  // and the hand has at least 2 cards with rank <= 8
  const lowRanks = new Set(["A", "2", "3", "4", "5", "6", "7", "8"]);
  const boardLowCount = boardCards.filter((c) => lowRanks.has(c.rank)).length;
  const hand1LowCount = holeCards.filter((c) => lowRanks.has(c.rank)).length;
  // Simplified: just check if there are enough low cards
  return {
    hand1: boardLowCount >= 3 && hand1LowCount >= 2,
    hand2: boardLowCount >= 3 && hand1LowCount >= 2, // simplified
  };
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
// Equity Bar Component
// ============================================================================

function EquityBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-right text-gray-400">{label}</span>
      <div className="flex-1 h-5 bg-[#262626] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 0)}%` }}
        />
      </div>
      <span className="w-14 text-right font-mono text-white">{pct.toFixed(1)}%</span>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function OmahaHiLoPage() {
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
    setParsedHand1(parseHand(val, 4));
  };

  const handleHand2Change = (val: string) => {
    setHand2(val);
    setParsedHand2(parseHand(val, 4));
  };

  const handleBoardChange = (val: string) => {
    setBoard(val);
    if (val.trim() === "") {
      setParsedBoard([]);
    } else {
      const parts = val.split(/[,\s]+/).filter(Boolean);
      if (parts.length <= 5) {
        setParsedBoard(parseHand(val, parts.length));
      }
    }
  };

  const calculate = useCallback(async () => {
    const h1 = parseHand(hand1, 4);
    const h2 = parseHand(hand2, 4);

    if (!h1) {
      setError("Hand 1: enter 4 valid cards (e.g. Ah Kh Qh Jh)");
      return;
    }
    if (!h2) {
      setError("Hand 2: enter 4 valid cards (e.g. Ks Qs Js Ts)");
      return;
    }

    // Check for overlapping cards between hands
    const allCards = new Set([...h1, ...h2].map(cardToString));
    if (allCards.size < 8) {
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
      const response = await fetch("/omaha/hi-lo/equity/calculate", {
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
        high_equity1: data.high_equity1,
        high_equity2: data.high_equity2,
        low_equity1: data.low_equity1,
        low_equity2: data.low_equity2,
        scoop_equity1: data.scoop_equity1,
        scoop_equity2: data.scoop_equity2,
        samples: data.samples,
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

  // Compute current hand descriptions when board is available
  const hand1Desc = parsedHand1 && parsedBoard && parsedBoard.length >= 3
    ? describeOmahaHand(parsedHand1, parsedBoard) : null;
  const hand2Desc = parsedHand2 && parsedBoard && parsedBoard.length >= 3
    ? describeOmahaHand(parsedHand2, parsedBoard) : null;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-poker-gold mb-1">
            Omaha Hi-Lo 8-or-Better
          </h1>
          <p className="text-gray-400 text-sm">
            4-card Omaha Hi/Lo equity calculator — enter two 4-card hands and an optional board.
            In Omaha Hi/Lo, you must use exactly 2 cards from your hand and 3 from the board for both high and low.
          </p>
        </div>

        {/* Hand Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Your Hand (4 cards)
            </h2>
            <input
              type="text"
              value={hand1}
              onChange={(e) => handleHand1Change(e.target.value)}
              placeholder="Ah Kh Qh Jh"
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
            {hand1Desc && (
              <p className="text-xs text-emerald-400 mt-2">Current best: {hand1Desc}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Format: rank + suit (h/d/c/s), comma-separated
            </p>
          </div>

          <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Opponent Hand (4 cards)
            </h2>
            <input
              type="text"
              value={hand2}
              onChange={(e) => handleHand2Change(e.target.value)}
              placeholder="Ks Qs Js Ts"
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
            {hand2Desc && (
              <p className="text-xs text-blue-400 mt-2">Current best: {hand2Desc}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Enter 4 cards, comma or space separated
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

            {/* High Equity */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                High Pot Equity
              </h3>
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your High</p>
                  <p className="text-3xl font-bold text-green-400 font-mono">
                    {result.high_equity1.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Opponent High</p>
                  <p className="text-3xl font-bold text-blue-400 font-mono">
                    {result.high_equity2.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-6 rounded-full overflow-hidden flex bg-[#0E0E0E]">
                <div
                  className="bg-green-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${result.high_equity1}%` }}
                >
                  {result.high_equity1 > 15 && (
                    <span className="text-xs font-bold text-gray-900">
                      {result.high_equity1.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div
                  className="bg-blue-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${result.high_equity2}%` }}
                >
                  {result.high_equity2 > 15 && (
                    <span className="text-xs font-bold text-white">
                      {result.high_equity2.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Low Equity */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Low Pot Equity
              </h3>
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Low</p>
                  <p className="text-3xl font-bold text-amber-400 font-mono">
                    {result.low_equity1.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Opponent Low</p>
                  <p className="text-3xl font-bold text-orange-400 font-mono">
                    {result.low_equity2.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-6 rounded-full overflow-hidden flex bg-[#0E0E0E]">
                <div
                  className="bg-amber-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${result.low_equity1}%` }}
                >
                  {result.low_equity1 > 15 && (
                    <span className="text-xs font-bold text-gray-900">
                      {result.low_equity1.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center transition-all duration-500"
                  style={{ width: `${result.low_equity2}%` }}
                >
                  {result.low_equity2 > 15 && (
                    <span className="text-xs font-bold text-white">
                      {result.low_equity2.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scoop Equity */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Scoop Equity (win both high + low)
              </h3>
              <div className="space-y-2">
                <EquityBar pct={result.scoop_equity1} color="bg-emerald-500" label="You" />
                <EquityBar pct={result.scoop_equity2} color="bg-red-500" label="Opp" />
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-[#262626]">
              <span>Samples: {result.samples.toLocaleString()}</span>
              <span>
                Total high: {(result.high_equity1 + result.high_equity2).toFixed(1)}% ·
                Total low: {(result.low_equity1 + result.low_equity2).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* How Omaha Hi/Lo Works */}
        <div className="bg-[#1C1C1C] border border-[#262626] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
            How Omaha Hi/Lo Works
          </h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Each player receives 4 hole cards (instead of 2 in NLH)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              You must use exactly 2 cards from your hand + 3 from the board (same for high and low)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              The pot is split: 50% to the best high hand, 50% to the best qualifying low hand
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Low hand must be 8-or-better (5 unique cards ranked 8 or lower, A=1)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              A-2-3-4-5 (the &quot;wheel&quot;) is the nut low — and also a straight for high!
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              If no player qualifies for low, the high hand takes the entire pot (&quot;scoops&quot;)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-poker-gold">•</span>
              Suited hands with low cards (A2xx, A3xx) are premium — they can win both ways
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
