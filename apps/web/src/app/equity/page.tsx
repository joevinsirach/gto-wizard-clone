"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { RangeSelector, EquityChart, EquityHeatmap, EquityBar, RangeGrid } from "@/components/equity";
import type { CellData } from "@/components/equity";
import { RANKS, getHand } from "@/lib/utils";
import { gtoTheme, getStrengthColor, getBetColor, getEquityBucket } from "@/styles/gto-tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface PositionAction {
  position: string;
  stack: number;
  action: string;
  isHero: boolean;
}

interface BoardCard {
  rank: string;
  suit: string;
}

interface StatItem {
  label: string;
  value: string;
  color?: string;
}

interface ActionBreakdown {
  action: string;
  pct: number;
  combos: number;
  color: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_POSITIONS: PositionAction[] = [
  { position: "UTG", stack: 100, action: "fold", isHero: false },
  { position: "HJ",  stack: 100, action: "fold", isHero: false },
  { position: "CO",  stack: 100, action: "fold", isHero: false },
  { position: "BTN", stack: 100, action: "raise 2.5", isHero: true },
  { position: "SB",  stack: 100, action: "fold", isHero: false },
  { position: "BB",  stack: 100, action: "call", isHero: false },
];

const MOCK_BOARD: BoardCard[] = [
  { rank: "Q", suit: "♥" },
  { rank: "J", suit: "♦" },
  { rank: "4", suit: "♠" },
];

const SUIT_SYMBOLS: Record<string, string> = {
  h: "♥", d: "♦", c: "♣", s: "♠",
  "♥": "♥", "♦": "♦", "♣": "♣", "♠": "♠",
};

const SUIT_COLORS: Record<string, string> = {
  h: "text-red-400", d: "text-blue-400", c: "text-green-400", s: "text-gray-300",
  "♥": "text-red-400", "♦": "text-blue-400", "♣": "text-green-400", "♠": "text-gray-300",
};

// Mock BB range data (strength mode) - equity values
function generateMockBBData(): Record<string, CellData> {
  const data: Record<string, CellData> = {};
  for (let row = 0; row < RANKS.length; row++) {
    for (let col = 0; col < RANKS.length; col++) {
      const hand = getHand(row, col);
      // Generate realistic equity values for BB vs BTN range on QJ4 board
      const equity = Math.random() * 100;
      data[hand] = {
        hand,
        equity,
        action: equity > 50 ? "call" : equity > 30 ? "check" : "fold",
        frequency: Math.random(),
      };
    }
  }
  return data;
}

// Mock BTN range data (action mode) with bet sizes
function generateMockBTNData(): Record<string, CellData> {
  const data: Record<string, CellData> = {};
  for (let row = 0; row < RANKS.length; row++) {
    for (let col = 0; col < RANKS.length; col++) {
      const hand = getHand(row, col);
      const rand = Math.random();
      let action: string;
      let betSize: number;
      let frequency: number;

      if (rand < 0.2) {
        action = "fold";
        betSize = 0;
        frequency = 0.2 - rand * 0.1;
      } else if (rand < 0.4) {
        action = "check";
        betSize = 0;
        frequency = 0.3 - (rand - 0.2) * 0.2;
      } else if (rand < 0.6) {
        action = "bet 1.8";
        betSize = 1.8;
        frequency = 0.4 - (rand - 0.4) * 0.3;
      } else if (rand < 0.8) {
        action = "bet 2.75";
        betSize = 2.75;
        frequency = 0.5 - (rand - 0.6) * 0.3;
      } else if (rand < 0.9) {
        action = "bet 4.1";
        betSize = 4.1;
        frequency = 0.6 - (rand - 0.8) * 0.4;
      } else {
        action = "bet 6.9";
        betSize = 6.9;
        frequency = 0.7 - (rand - 0.9) * 0.5;
      }

      data[hand] = { hand, equity: 50, action, betSize, frequency };
    }
  }
  return data;
}

// Mock stats
const MOCK_STATS: StatItem[] = [
  { label: "COMBOS", value: "120", color: gtoTheme.text.primary },
  { label: "EV", value: "+3.42", color: gtoTheme.stat.positive },
  { label: "EQUITY%", value: "54.1%", color: gtoTheme.text.primary },
  { label: "EQR%", value: "98.2%", color: gtoTheme.stat.positive },
];

const MOCK_BUCKETS = [
  { label: "BEST", pct: 35, combos: 42, color: gtoTheme.bucket.best },
  { label: "GOOD", pct: 28, combos: 34, color: gtoTheme.bucket.good },
  { label: "WEAK", pct: 22, combos: 26, color: gtoTheme.bucket.weak },
  { label: "TRASH", pct: 15, combos: 18, color: gtoTheme.bucket.trash },
];

const MOCK_ACTION_BREAKDOWN: ActionBreakdown[] = [
  { action: "CHECK", pct: 42, combos: 50, color: gtoTheme.strategy.check },
  { action: "BET 1.8", pct: 22, combos: 26, color: gtoTheme.strategy.bet33 },
  { action: "BET 2.75", pct: 18, combos: 22, color: gtoTheme.strategy.bet50 },
  { action: "BET 4.1", pct: 10, combos: 12, color: gtoTheme.strategy.bet75 },
  { action: "BET 6.9", pct: 8, combos: 10, color: gtoTheme.strategy.bet150 },
];

// ============================================================================
// Sub-components
// ============================================================================

function SuitIcon({ suit, size = "sm" }: { suit: string; size?: "sm" | "md" }) {
  const symbol = SUIT_SYMBOLS[suit] || suit;
  const colorClass = SUIT_COLORS[suit] || "text-white";
  const sizeClass = size === "md" ? "text-2xl" : "text-lg";
  return (
    <span className={cn(sizeClass, "font-bold", colorClass)}>
      {symbol}
    </span>
  );
}

function BoardCardView({ card, index }: { card: BoardCard; index: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-10 h-14 rounded-md bg-white flex flex-col items-center justify-center shadow-lg border border-gray-300">
        <span className="text-sm font-bold text-gray-900 leading-none">{card.rank}</span>
        <SuitIcon suit={card.suit} size="sm" />
      </div>
    </div>
  );
}

function PositionFlowBar({ positions }: { positions: PositionAction[] }) {
  return (
    <div className="flex items-center gap-0 bg-gray-800/50 rounded-lg p-2 overflow-x-auto">
      {positions.map((pos, idx) => (
        <div key={pos.position} className="flex items-center">
          <div
            className={cn(
              "flex flex-col items-center px-3 py-1.5 rounded-md min-w-[64px]",
              pos.isHero
                ? "bg-green-900/50 border border-green-700"
                : pos.action === "fold"
                ? "opacity-50"
                : "bg-gray-800"
            )}
          >
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wide",
                pos.isHero ? "text-green-400" : "text-gray-300"
              )}
            >
              {pos.position}
            </span>
            <span className="text-[10px] text-gray-400">{pos.stack}bb</span>
            <span
              className={cn(
                "text-[10px] font-medium",
                pos.action === "fold"
                  ? "text-gray-500"
                  : pos.action.includes("raise")
                  ? "text-orange-400"
                  : pos.action === "call"
                  ? "text-blue-400"
                  : pos.action === "bet"
                  ? "text-green-400"
                  : "text-gray-300"
              )}
            >
              {pos.action}
            </span>
          </div>
          {idx < positions.length - 1 && (
            <span className="text-gray-600 mx-1 text-lg">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function BoardSection({ board, stack }: { board: BoardCard[]; stack: number }) {
  return (
    <div className="flex items-center gap-4 bg-gray-800/30 rounded-lg px-4 py-3">
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">
          FLOP
        </span>
        <span className="text-xs text-gray-500">|</span>
        <span className="text-xs text-gray-400">Stack</span>
        <span className="text-sm font-bold text-white ml-1">{stack}</span>
      </div>
      <div className="flex items-center gap-2">
        {board.map((card, i) => (
          <BoardCardView key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}

function StatsPanel({ stats, buckets }: { stats: StatItem[]; buckets: typeof MOCK_BUCKETS }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Statistics
      </h3>
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800/40 rounded-lg p-3">
            <div
              className="text-lg font-bold font-mono"
              style={{ color: stat.color || "inherit" }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Buckets */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        EQ BUCKETS
      </h3>
      <div className="space-y-2">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: bucket.color }}
            />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-300">{bucket.label}</span>
                <span className="text-gray-400">
                  {bucket.pct}% · {bucket.combos}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${bucket.pct}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBreakdownPanel({ actions }: { actions: ActionBreakdown[] }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Action Breakdown
      </h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action.action} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: action.color }}
            />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-300">{action.action}</span>
                <span className="text-gray-400">
                  {action.pct}% · {action.combos} combos
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Action bar visualization */}
      <div className="flex h-5 rounded-md overflow-hidden mt-3">
        {actions.map((action) => (
          <div
            key={action.action}
            style={{
              width: `${action.pct}%`,
              backgroundColor: action.color,
              opacity: 0.8,
            }}
            title={`${action.action}: ${action.pct}% (${action.combos} combos)`}
          />
        ))}
      </div>
    </div>
  );
}

function GameSettingsSidebar() {
  const [selectedGameType, setSelectedGameType] = useState("Cash");
  const gameTypes = ["Cash", "Tournament", "Spin & Go"];
  const tableSizes = ["6max", "9max", "Heads-up"];
  const stakes = ["NL50", "NL100", "NL200", "NL500"];
  const scenarios = ["General", "3b Pot", "4b Pot", "SRP"];
  const stackDepths = ["100bb", "50bb", "75bb", "150bb"];
  const activeScenario = "3b GTO";

  return (
    <div className="w-56 shrink-0 bg-gray-900/80 border-r border-gray-800 flex flex-col">
      {/* Game type header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Game
        </h2>
      </div>

      {/* Game Settings */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Game Type */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Type
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {gameTypes.map((gt) => (
              <button
                key={gt}
                onClick={() => setSelectedGameType(gt)}
                className={cn(
                  "text-[11px] px-2 py-1 rounded transition-colors",
                  selectedGameType === gt
                    ? "bg-green-700 text-white font-semibold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {gt}
              </button>
            ))}
          </div>
        </div>

        {/* Table Size */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Table Size
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {tableSizes.map((size) => (
              <button
                key={size}
                className={cn(
                  "text-[11px] px-2 py-1 rounded transition-colors",
                  size === "6max"
                    ? "bg-green-700 text-white font-semibold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Stakes */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Stakes
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {stakes.map((stake) => (
              <button
                key={stake}
                className={cn(
                  "text-[11px] px-2 py-1 rounded transition-colors",
                  stake === "NL50"
                    ? "bg-green-700 text-white font-semibold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {stake}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Scenario
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {scenarios.map((sc) => (
              <button
                key={sc}
                className={cn(
                  "text-[11px] px-2 py-1 rounded transition-colors",
                  sc === activeScenario
                    ? "bg-green-700 text-white font-semibold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {sc === "General" ? "General" : sc}
              </button>
            ))}
          </div>
        </div>

        {/* Stack Depth */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Stack Depth
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {stackDepths.map((sd) => (
              <button
                key={sd}
                className={cn(
                  "text-[11px] px-2 py-1 rounded transition-colors",
                  sd === "100bb"
                    ? "bg-green-700 text-white font-semibold"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {sd}
              </button>
            ))}
          </div>
        </div>

        {/* Active Scenario */}
        <div className="pt-3 border-t border-gray-800">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            Active Solution
          </label>
          <div className="mt-1 p-2 rounded bg-green-900/30 border border-green-800">
            <span className="text-xs font-semibold text-green-400">3b GTO</span>
            <span className="text-[10px] text-green-600 block">BTN vs BB · Q♥J♦4♠</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  const [activeTab, setActiveTab] = useState("study");

  const tabs = [
    { id: "study", label: "STUDY" },
    { id: "practice", label: "PRACTICE" },
    { id: "analyze", label: "ANALYZE" },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-gray-800">
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-poker-gold tracking-tight">
          GTO Wizard
        </span>
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors",
                activeTab === tab.id
                  ? "bg-green-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-3">
        <button className="text-xs text-gray-400 hover:text-white px-3 py-1.5 border border-gray-700 rounded transition-colors">
          Upload
        </button>
        <button className="text-gray-500 hover:text-white transition-colors" title="Help">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
          </svg>
        </button>
        <button className="text-gray-500 hover:text-white transition-colors" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
          U
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// Equity Line Chart (Inline SVG)
// ============================================================================

function EquityLineChart({ bbEquity, btnEquity }: { bbEquity: number[]; btnEquity: number[] }) {
  const width = 700;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const streets = ["Pre", "Flop", "Turn", "River"];

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / (streets.length - 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - ((v - 30) / 40) * chartH;

  const bbLine = bbEquity.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`).join(" ");
  const btnLine = btnEquity.map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(v)}`).join(" ");

  // Area fills
  const bbArea = `M${xScale(0)},${yScale(30)} ${bbEquity.map((v, i) => `L${xScale(i)},${yScale(v)}`).join(" ")} L${xScale(streets.length - 1)},${yScale(30)} Z`;
  const btnArea = `M${xScale(0)},${yScale(30)} ${btnEquity.map((v, i) => `L${xScale(i)},${yScale(v)}`).join(" ")} L${xScale(streets.length - 1)},${yScale(30)} Z`;

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Equity Graph
      </h3>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[40, 50, 60].map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={yScale(v)}
              x2={width - padding.right}
              y2={yScale(v)}
              stroke="#374151"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <text x={padding.left - 8} y={yScale(v) + 3} textAnchor="end" fill="#6b7280" fontSize={10}>
              {v}%
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {streets.map((s, i) => (
          <text
            key={s}
            x={xScale(i)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={11}
            fontWeight={600}
          >
            {s}
          </text>
        ))}

        {/* Area fills */}
        <path d={bbArea} fill="#3b82f6" opacity={0.08} />
        <path d={btnArea} fill="#22c55e" opacity={0.08} />

        {/* Lines */}
        <path d={bbLine} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={btnLine} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {bbEquity.map((v, i) => (
          <circle key={`bb-${i}`} cx={xScale(i)} cy={yScale(v)} r={4} fill="#3b82f6" stroke="#1a1a2e" strokeWidth={2} />
        ))}
        {btnEquity.map((v, i) => (
          <circle key={`btn-${i}`} cx={xScale(i)} cy={yScale(v)} r={4} fill="#22c55e" stroke="#1a1a2e" strokeWidth={2} />
        ))}

        {/* Labels at last point */}
        <text x={xScale(3) + 10} y={yScale(bbEquity[3]) + 3} fill="#3b82f6" fontSize={11} fontWeight={700}>
          BB
        </text>
        <text x={xScale(3) + 10} y={yScale(btnEquity[3]) + 3} fill="#22c55e" fontSize={11} fontWeight={700}>
          BTN
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function EquityPage() {
  const [heroRange, setHeroRange] = useState<Set<string>>(new Set());
  const [villainRange, setVillainRange] = useState<Set<string>>(new Set());
  const [equityData, setEquityData] = useState<{bb: number; btn: number} | null>(null);

  // Fetch real equity from API
  useEffect(() => {
    const hero = "AKs";
    const villain = "QQ";
    fetch("/api/v1/equity/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero, villain, board: "QdJh4s", iterations: 50000 }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.equity !== undefined) {
          setEquityData({ bb: data.equity * 100, btn: 100 - data.equity * 100 });
        }
      })
      .catch((err) => console.error("Equity fetch failed:", err));
  }, []);

  // Live stats computed from API response
  const liveStats: StatItem[] = useMemo(() => {
    const bbEq = equityData?.bb ?? 54.1;
    const btnEq = equityData?.btn ?? 45.9;
    return [
      { label: "BB EQUITY%", value: `${bbEq.toFixed(1)}%`, color: gtoTheme.stat.positive },
      { label: "BTN EQUITY%", value: `${btnEq.toFixed(1)}%`, color: gtoTheme.text.primary },
      { label: "COMBOS", value: "120", color: gtoTheme.text.primary },
      { label: "EQR%", value: "98.2%", color: gtoTheme.stat.positive },
    ];
  }, [equityData]);

  // Update chart data with real equity values
  const chartEquityBB = equityData ? [50, equityData.bb, equityData.bb - 2, equityData.bb - 4] : [45, 52, 48, 44];
  const chartEquityBTN = equityData ? [50, equityData.btn, equityData.btn + 2, equityData.btn + 4] : [55, 48, 52, 56];

  // Generate mock data
  const bbRangeData = useMemo(() => generateMockBBData(), []);
  const btnRangeData = useMemo(() => generateMockBTNData(), []);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* Top Nav */}
      <NavBar />

      <div className="flex">
        {/* Left Sidebar */}
        <GameSettingsSidebar />

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* Page title */}
          <h1 className="text-lg font-bold text-white sr-only">Equity Calculator</h1>

          {/* Hand History Flow Bar */}
          <PositionFlowBar positions={MOCK_POSITIONS} />

          {/* Board + Stack */}
          <BoardSection board={MOCK_BOARD} stack={5.5} />

          {/* Two Range Grids Side by Side + Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* BB Range (Strength) */}
            <div>
              <RangeGrid
                data={bbRangeData}
                mode="strength"
                title="BB Range"
                subtitle="Strength"
                className="h-full"
              />
            </div>

            {/* BTN Range (Action) */}
            <div>
              <RangeGrid
                data={btnRangeData}
                mode="action"
                title="BTN Range"
                subtitle="Strategy"
                className="h-full"
              />
            </div>

            {/* Right Panel: Stats + Action Breakdown */}
            <div className="space-y-4">
              <StatsPanel stats={liveStats} buckets={MOCK_BUCKETS} />
              <ActionBreakdownPanel actions={MOCK_ACTION_BREAKDOWN} />
            </div>
          </div>

          {/* Equity Graph */}
          <EquityLineChart bbEquity={chartEquityBB} btnEquity={chartEquityBTN} />
        </div>
      </div>
    </div>
  );
}
