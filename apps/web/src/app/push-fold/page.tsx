"use client";

import { useState, useMemo } from "react";
import { RangeGrid, type CellData } from "@/components/equity/RangeGrid";
import { RANKS, getHand } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type Position = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";

interface NashRanges {
  [position: string]: {
    [stackDepth: number]: Set<string>;
  };
}

// ============================================================================
// Nash Equilibrium Push/Fold Ranges (6-max NLH, no ante)
// These are standard pre-computed Nash equilibrium solutions for tournament
// push/fold scenarios. Each entry is the set of hands to open-push from that
// position at that stack depth.
// Source: Standard HoldemResources Calculator / ICMIZER Nash tables
// ============================================================================

const POSITIONS: Position[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];

const STACK_DEPTHS = [5, 6, 7, 8, 9, 10, 12, 15, 20];

function hands(...list: string[]): Set<string> {
  return new Set(list);
}

/**
 * Standard Nash push ranges for 6-max NLH.
 * For each position + stack depth, the set of hands to open-push.
 * BB is the calling range vs SB push (since BB can't open-push).
 */
const NASH_PUSH_RANGES: Record<string, Record<number, string[]>> = {
  UTG: {
    5:  ["22+", "A2s+", "K9s+", "Q9s+", "J9s+", "T9s", "98s", "87s", "ATo+", "KJo+", "QJo"],
    6:  ["22+", "A2s+", "K9s+", "Q9s+", "JTs", "T9s", "98s", "AJo+", "KQo"],
    7:  ["33+", "A2s+", "K9s+", "QTs+", "JTs", "T9s", "AJo+", "KQo"],
    8:  ["44+", "A9s+", "KTs+", "QTs+", "JTs", "AQo+"],
    9:  ["55+", "ATs+", "KJs+", "QJs", "AKo"],
    10: ["66+", "ATs+", "KJs+", "QJs", "AKo"],
    12: ["77+", "AJs+", "KQs", "AKo"],
    15: ["88+", "AQs+", "AKo"],
    20: ["99+", "AKs+"],
  },
  HJ: {
    5:  ["22+", "A2s+", "K5s+", "Q8s+", "J8s+", "T8s+", "98s", "87s", "76s", "A2o+", "K9o+", "QTo+", "JTo"],
    6:  ["22+", "A2s+", "K7s+", "Q9s+", "J9s+", "T9s", "98s", "87s", "A2o+", "KTo+", "QJo"],
    7:  ["33+", "A2s+", "K8s+", "Q9s+", "J9s+", "T9s", "98s", "A9o+", "KJo+", "QJo"],
    8:  ["44+", "A7s+", "K9s+", "QTs+", "JTs", "T9s", "ATo+", "KJo+"],
    9:  ["55+", "A8s+", "KTs+", "QTs+", "JTs", "AQo+", "KQo"],
    10: ["66+", "A9s+", "KTs+", "QJs", "JTs", "AQo+"],
    12: ["77+", "ATs+", "KQs", "AKo"],
    15: ["88+", "AJs+", "AKo"],
    20: ["99+", "AKs+"],
  },
  CO: {
    5:  ["22+", "A2s+", "K2s+", "Q5s+", "J7s+", "T7s+", "97s+", "86s+", "75s+", "65s", "A2o+", "K8o+", "Q9o+", "J9o+", "T9o", "98o"],
    6:  ["22+", "A2s+", "K4s+", "Q7s+", "J8s+", "T8s+", "97s+", "87s", "76s", "A2o+", "K9o+", "QTo+", "JTo"],
    7:  ["22+", "A2s+", "K6s+", "Q8s+", "J8s+", "T8s+", "98s", "87s", "A7o+", "KTo+", "QJo"],
    8:  ["33+", "A2s+", "K7s+", "Q9s+", "J9s+", "T9s", "98s", "A9o+", "KJo+"],
    9:  ["44+", "A5s+", "K8s+", "Q9s+", "JTs", "T9s", "ATo+", "KQo"],
    10: ["55+", "A7s+", "K9s+", "QTs+", "JTs", "ATo+", "KJo+"],
    12: ["66+", "A8s+", "KTs+", "QJs", "AJo+"],
    15: ["77+", "ATs+", "KQs", "AQo+"],
    20: ["88+", "AJs+"],
  },
  BTN: {
    5:  ["22+", "A2s+", "K2s+", "Q2s+", "J3s+", "T5s+", "95s+", "84s+", "73s+", "63s+", "53s+", "43s", "A2o+", "K5o+", "Q7o+", "J8o+", "T8o+", "97o+", "87o", "76o"],
    6:  ["22+", "A2s+", "K2s+", "Q4s+", "J6s+", "T7s+", "96s+", "85s+", "75s+", "64s+", "54s", "A2o+", "K7o+", "Q9o+", "J9o+", "T9o", "98o"],
    7:  ["22+", "A2s+", "K3s+", "Q5s+", "J7s+", "T7s+", "97s+", "86s+", "76s", "65s", "A2o+", "K8o+", "Q9o+", "J9o+", "T9o"],
    8:  ["22+", "A2s+", "K5s+", "Q7s+", "J8s+", "T8s+", "98s", "87s", "A2o+", "K9o+", "QTo+", "JTo"],
    9:  ["33+", "A2s+", "K6s+", "Q8s+", "J8s+", "T8s+", "98s", "A5o+", "KTo+", "QJo"],
    10: ["44+", "A2s+", "K7s+", "Q9s+", "J9s+", "T9s", "A7o+", "KJo+"],
    12: ["55+", "A4s+", "K8s+", "Q9s+", "JTs", "A9o+", "KQo"],
    15: ["66+", "A7s+", "K9s+", "QTs+", "JTs", "AJo+"],
    20: ["77+", "A9s+", "KTs+", "QJs", "AQo+"],
  },
  SB: {
    5:  ["22+", "A2s+", "K2s+", "Q2s+", "J2s+", "T2s+", "92s+", "82s+", "72s+", "62s+", "52s+", "42s+", "32s", "A2o+", "K2o+", "Q4o+", "J6o+", "T7o+", "97o+", "86o+", "75o+", "65o", "54o"],
    6:  ["22+", "A2s+", "K2s+", "Q2s+", "J3s+", "T4s+", "95s+", "84s+", "74s+", "63s+", "53s+", "43s", "A2o+", "K3o+", "Q6o+", "J7o+", "T8o+", "97o+", "86o+", "76o"],
    7:  ["22+", "A2s+", "K2s+", "Q3s+", "J5s+", "T6s+", "96s+", "85s+", "75s+", "64s+", "54s", "A2o+", "K5o+", "Q7o+", "J8o+", "T8o+", "98o", "87o"],
    8:  ["22+", "A2s+", "K2s+", "Q4s+", "J6s+", "T7s+", "97s+", "86s+", "76s", "65s", "A2o+", "K6o+", "Q8o+", "J9o+", "T9o"],
    9:  ["22+", "A2s+", "K3s+", "Q5s+", "J7s+", "T7s+", "97s+", "87s", "A2o+", "K7o+", "Q9o+", "J9o+"],
    10: ["22+", "A2s+", "K4s+", "Q6s+", "J7s+", "T8s+", "98s", "A2o+", "K8o+", "QTo+"],
    12: ["22+", "A2s+", "K5s+", "Q7s+", "J8s+", "T8s+", "A2o+", "K9o+", "QJo"],
    15: ["33+", "A2s+", "K6s+", "Q8s+", "J9s+", "A5o+", "KTo+"],
    20: ["44+", "A5s+", "K7s+", "Q9s+", "JTs", "A9o+"],
  },
  BB: {
    // BB call range vs SB push (not an open-push range)
    5:  ["22+", "A2s+", "K2s+", "Q2s+", "J5s+", "T7s+", "97s+", "86s+", "76s", "65s", "A2o+", "K5o+", "Q8o+", "J9o+", "T9o"],
    6:  ["22+", "A2s+", "K4s+", "Q6s+", "J8s+", "T8s+", "98s", "A2o+", "K7o+", "Q9o+", "JTo"],
    7:  ["33+", "A2s+", "K6s+", "Q8s+", "J9s+", "T9s", "A5o+", "K8o+", "QTo+"],
    8:  ["44+", "A5s+", "K7s+", "Q9s+", "JTs", "A8o+", "KJo+"],
    9:  ["55+", "A7s+", "K8s+", "QTs+", "ATo+", "KQo"],
    10: ["66+", "A8s+", "K9s+", "QJs", "AJo+"],
    12: ["77+", "ATs+", "KQs", "AQo+"],
    15: ["88+", "AJs+", "AKo"],
    20: ["99+", "AKs+"],
  },
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Parse a shorthand hand expression like "22+" or "K9s+" or "ATo+"
 * into a set of individual hand strings.
 *
 * Supported forms:
 * - "XX" (pocket pair, e.g., "AA", "22")
 * - "XXs" (suited, e.g., "AKs")
 * - "XXo" (offsuit, e.g., "AKo")
 * - "XX+" (pocket pair XX and higher)
 * - "XYs+" (suited combos XY and higher)
 * - "XYo+" (offsuit combos XY and higher)
 * - "XYs" (single suited hand)
 * - "XYo" (single offsuit hand)
 * - "XY" (pocket pair or single hand)
 */
function expandHands(expressions: string[]): Set<string> {
  const result = new Set<string>();

  for (const expr of expressions) {
    const isPlus = expr.endsWith("+");
    const base = isPlus ? expr.slice(0, -1) : expr;
    const isSuited = base.endsWith("s");
    const isOffsuit = base.endsWith("o");
    const cleanBase = isSuited || isOffsuit ? base.slice(0, 2) : base;

    if (cleanBase.length !== 2) continue;

    const r1 = cleanBase[0]!;
    const r2 = cleanBase[1]!;
    const isPair = r1 === r2;

    if (isPlus) {
      // Range like "22+", "K9s+", "ATo+"
      if (isPair) {
        // All pairs from this one up to AA
        const ranks = RANKS;
        let started = false;
        for (const rank of ranks) {
          if (rank === r1) started = true;
          if (started) {
            result.add(`${rank}${rank}`);
          }
        }
      } else if (isSuited) {
        // For suited "K9s+": K9s, KTs, KJs, KQs, AKs
        const ranks = RANKS;
        const idx1 = ranks.indexOf(r1 as any);
        const idx2 = ranks.indexOf(r2 as any);
        if (idx1 === -1 || idx2 === -1) continue;

        // If first rank is higher than second (e.g., K9), range goes:
        // K9s, KTs, KJs, KQs, AKs (moving second rank up)
        // Actually for suited connectors: lower rank goes up
        // K9s+ means: K9s, KTs, KJs, KQs, AKs (but AKs has different structure)
        // Better: enumerate all combos that are ">= this combo" in the grid
        
        // For suited hands where r1 > r2 (e.g., K9s): include all hands with same first rank and higher second rank
        // Also include hands with higher first rank where second is appropriate
        for (const rank1 of ranks.slice(0, ranks.indexOf(r1 as any) + 1)) {
          for (const rank2 of ranks) {
            if (rank1 === rank2) continue; // not suited
            const suitIdx1 = ranks.indexOf(rank1 as any);
            const suitIdx2 = ranks.indexOf(rank2 as any);
            // For suited, we need (rank1 > rank2) = suited hand in grid
            if (suitIdx1 < suitIdx2) {
              const hand = `${rank1}${rank2}s`;
              // Compare with base: is this >= base?
              if (suitIdx1 <= idx1 && suitIdx2 >= idx2) {
                result.add(hand);
              }
            }
          }
        }
      } else if (isOffsuit) {
        // Similar for offsuit
        for (const rank1 of RANKS) {
          for (const rank2 of RANKS) {
            if (rank1 === rank2) continue;
            const idxA = RANKS.indexOf(rank1 as any);
            const idxB = RANKS.indexOf(rank2 as any);
            // Offsuit: rank1 appears above rank2 in grid => offsuit
            if (idxA > idxB) {
              const hand = `${rank1}${rank2}o`;
              // Include if it's >= base
              const bIdx1 = RANKS.indexOf(r1 as any);
              const bIdx2 = RANKS.indexOf(r2 as any);
              // Simple heuristic: if this combo is in the top-left of the base combo
              if (idxA <= bIdx1 || (idxA === bIdx1 && idxB <= bIdx2)) {
                result.add(hand);
              }
            }
          }
        }
      }
    } else {
      // Single hand
      if (isSuited) {
        result.add(`${r1}${r2}s`);
      } else if (isOffsuit) {
        result.add(`${r1}${r2}o`);
      } else if (isPair) {
        result.add(`${r1}${r2}`);
      }
    }
  }

  return result;
}

/**
 * Build a complete lookup of all hand ranges expanded.
 */
function buildRanges(data: Record<string, Record<number, string[]>>): NashRanges {
  const result: NashRanges = {};
  for (const [pos, stacks] of Object.entries(data)) {
    result[pos] = {};
    for (const [stackStr, handsList] of Object.entries(stacks)) {
      result[pos][Number(stackStr)] = expandHands(handsList);
    }
  }
  return result as NashRanges;
}

const RANGES = buildRanges(NASH_PUSH_RANGES);

/**
 * Build a full 13x13 hand grid of CellData for a given position + stack depth.
 * PUSH hands get equity=100 (green), FOLD hands are omitted (dark/unselected).
 */
function buildPushFoldGrid(
  position: Position,
  stackDepth: number,
  isCallRange: boolean
): Record<string, CellData> {
  const data: Record<string, CellData> = {};
  const pushHands = RANGES[position]?.[stackDepth] ?? new Set<string>();

  // Fallback: find the closest available stack depth
  let effectivePushSet = pushHands;
  if (pushHands.size === 0) {
    // Try nearest lower stack depth
    const sortedStacks = STACK_DEPTHS.filter(s => s < stackDepth).sort((a, b) => b - a);
    for (const s of sortedStacks) {
      const fallback = RANGES[position]?.[s];
      if (fallback && fallback.size > 0) {
        effectivePushSet = fallback;
        break;
      }
    }
  }

  for (let row = 0; row < RANKS.length; row++) {
    for (let col = 0; col < RANKS.length; col++) {
      const hand = getHand(row, col);
      if (effectivePushSet.has(hand)) {
        data[hand] = {
          hand,
          equity: 100, // green
          action: isCallRange ? "CALL" : "PUSH",
          frequency: 1.0,
          betSize: stackDepth,
        };
      }
      // FOLD hands are omitted (no data = dark/unselected in RangeGrid)
    }
  }

  return data;
}

/**
 * Compute statistics about the range.
 */
function getRangeStats(pushSet: Set<string>): {
  totalHands: number;
  percentage: string;
  pairs: number;
  suited: number;
  offsuit: number;
} {
  let pairs = 0, suited = 0, offsuit = 0;
  for (const hand of pushSet) {
    if (hand.length === 2) pairs++;
    else if (hand.endsWith("s")) suited++;
    else if (hand.endsWith("o")) offsuit++;
  }
  const total = pairs + suited + offsuit;
  const totalCombos = pairs * 6 + suited * 4 + offsuit * 12;
  const percentage = ((totalCombos / 1326) * 100).toFixed(1);
  return {
    totalHands: total,
    percentage,
    pairs: pairs,
    suited,
    offsuit,
  };
}

// ============================================================================
// Component
// ============================================================================

export default function PushFoldPage() {
  const [selectedPosition, setSelectedPosition] = useState<Position>("BTN");
  const [selectedStackDepth, setSelectedStackDepth] = useState<number>(10);

  const isCallRange = selectedPosition === "BB";

  const gridData = useMemo(
    () => buildPushFoldGrid(selectedPosition, selectedStackDepth, isCallRange),
    [selectedPosition, selectedStackDepth, isCallRange]
  );

  const pushSet = RANGES[selectedPosition]?.[selectedStackDepth] ?? new Set<string>();
  let effectivePushSet = pushSet;
  if (pushSet.size === 0) {
    const sortedStacks = STACK_DEPTHS.filter(s => s < selectedStackDepth).sort((a, b) => b - a);
    for (const s of sortedStacks) {
      const fallback = RANGES[selectedPosition]?.[s];
      if (fallback && fallback.size > 0) {
        effectivePushSet = fallback;
        break;
      }
    }
  }

  const stats = useMemo(() => getRangeStats(effectivePushSet), [effectivePushSet]);

  const rangeTitle = isCallRange
    ? `${selectedPosition} Call vs SB Push @ ${selectedStackDepth}bb`
    : `${selectedPosition} Push Range @ ${selectedStackDepth}bb`;

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-poker-gold">
          Push/Fold Nash Charts
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Pre-computed Nash equilibrium push/fold ranges for 6-max NLH tournaments (no ante)
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-3">
        {/* Position selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-400 mr-1">Position:</span>
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setSelectedPosition(pos)}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors ${
                selectedPosition === pos
                  ? "bg-poker-gold text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              {pos}
              {pos === "BB" && (
                <span className="ml-1 text-[10px] opacity-70">(call)</span>
              )}
            </button>
          ))}
        </div>

        {/* Stack depth selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs sm:text-sm text-gray-400 mr-1">Stack:</span>
          {STACK_DEPTHS.map((depth) => (
            <button
              key={depth}
              onClick={() => setSelectedStackDepth(depth)}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors ${
                selectedStackDepth === depth
                  ? "bg-poker-gold text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              {depth}bb
            </button>
          ))}
        </div>
      </div>

      {/* Range Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto">
            <RangeGrid
              data={gridData}
              mode="strength"
              title={rangeTitle}
              subtitle={`${stats.totalHands} hand types · ${stats.percentage}% of combos`}
            />
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
              Range Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total combos</span>
                <span className="text-white font-semibold">
                  {((stats.pairs * 6) + (stats.suited * 4) + (stats.offsuit * 12))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">% of hands</span>
                <span className="text-poker-gold font-semibold">{stats.percentage}%</span>
              </div>
              <div className="border-t border-gray-800 my-2" />
              <div className="flex justify-between">
                <span className="text-gray-400">Pocket pairs</span>
                <span className="text-amber-400 font-semibold">{stats.pairs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Suited</span>
                <span className="text-green-400 font-semibold">{stats.suited}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Offsuit</span>
                <span className="text-blue-400 font-semibold">{stats.offsuit}</span>
              </div>
            </div>
          </div>

          {/* All-positions comparison table */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
              All Positions @ {selectedStackDepth}bb
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left py-1 pr-2">Pos</th>
                    <th className="text-right py-1 px-2">Range %</th>
                    <th className="text-right py-1 pl-2">Combos</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONS.map((pos) => {
                    const posSet = RANGES[pos]?.[selectedStackDepth] ?? new Set<string>();
                    let effectivePosSet = posSet;
                    if (posSet.size === 0) {
                      const sortedStacks = STACK_DEPTHS.filter(s => s < selectedStackDepth).sort((a, b) => b - a);
                      for (const s of sortedStacks) {
                        const fallback = RANGES[pos]?.[s];
                        if (fallback && fallback.size > 0) {
                          effectivePosSet = fallback;
                          break;
                        }
                      }
                    }
                    const s = getRangeStats(effectivePosSet);
                    const combos = s.pairs * 6 + s.suited * 4 + s.offsuit * 12;
                    const isActive = pos === selectedPosition;
                    return (
                      <tr
                        key={pos}
                        className={`border-b border-gray-800/50 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      >
                        <td className={`py-1 pr-2 font-semibold ${isActive ? "text-poker-gold" : ""}`}>
                          {pos}{pos === "BB" ? "" : ""}
                        </td>
                        <td className="text-right py-1 px-2">{s.percentage}%</td>
                        <td className="text-right py-1 pl-2">{combos}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">
              Legend
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "#22c55e" }} />
                <span>Push/Call (green)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1f2937" }} />
                <span>Fold (dark)</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 leading-relaxed">
              <p className="mb-1"><strong className="text-gray-400">Nash equilibrium</strong> — optimal play assuming both players play perfectly.</p>
              <p>BB position shows <strong className="text-gray-400">calling range</strong> vs SB push (not an open-push range).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 sm:mt-12 p-4 sm:p-6 border border-gray-800 rounded-lg bg-gray-900/30">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-poker-gold">About Push/Fold Nash Charts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm text-gray-400">
          <div>
            <h3 className="font-medium text-white mb-2">What are Push/Fold Charts?</h3>
            <p className="text-xs sm:text-sm">
              Push/fold charts show the mathematically optimal (Nash equilibrium) ranges for
              all-in or fold decisions in tournament poker. When your stack is below ~20 big blinds,
              the correct play is often to either push all-in or fold — standard raises become
              less effective because opponents can call with a wide range.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">How to Use</h3>
            <p className="text-xs sm:text-sm">
              Select your position and stack depth. The green cells show hands you should
              open-push. Dark cells are folds. For BB, the chart shows which hands to call
              with when SB pushes. Ranges tighten as stacks get deeper and positions get
              earlier.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">ICM Adjustments</h3>
            <p className="text-xs sm:text-sm">
              These charts assume equal stack sizes and no ICM pressure (cash game / final
              table equal stacks). In real tournament situations with ICM pressure (on the
              bubble, unequal stacks), ranges should be tighter for pushes and wider for calls.
              Use the ICM Calculator for bubble-specific adjustments.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Position Naming</h3>
            <p className="text-xs sm:text-sm">
              UTG = Under the Gun (first to act), HJ = Hijack, CO = Cutoff,
              BTN = Button (dealer), SB = Small Blind, BB = Big Blind.
              Earlier positions need stronger hands because more players act after them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
