"use client";

import { clsx } from "clsx";

export interface EquityBarEntry {
  hand: string;
  heroEquity: number;
  villainEquity: number;
}

export const MOCK_EQUITY_BAR_DATA: EquityBarEntry[] = [
  { hand: "AA vs KK", heroEquity: 81, villainEquity: 19 },
  { hand: "AKs vs QQ", heroEquity: 65, villainEquity: 35 },
  { hand: "JJ vs TT", heroEquity: 72, villainEquity: 28 },
];

interface EquityBarProps {
  heroEquity: number;
  villainEquity: number;
  heroLabel?: string;
  villainLabel?: string;
  showLabels?: boolean;
  className?: string;
}

export function EquityBar({
  heroEquity,
  villainEquity,
  heroLabel = "Hero",
  villainLabel = "Villain",
  showLabels = true,
  className,
}: EquityBarProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-green-500 font-medium">{heroLabel}</span>
          <span className="text-red-500 font-medium">{villainLabel}</span>
        </div>
      )}
      <div className="relative h-6 w-full rounded-full bg-gray-800 overflow-hidden">
        {/* Hero bar (left) */}
        <div
          className="absolute top-0 left-0 h-full bg-green-500 rounded-l-full transition-all duration-300"
          style={{ width: `${heroEquity}%` }}
        />
        {/* Villain bar (right) */}
        <div
          className="absolute top-0 right-0 h-full bg-red-500 rounded-r-full transition-all duration-300"
          style={{ width: `${villainEquity}%` }}
        />
        {/* Center divider */}
        <div className="absolute top-0 left-1/2 h-full w-px bg-gray-900 z-10" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{heroEquity.toFixed(1)}%</span>
        <span>{villainEquity.toFixed(1)}%</span>
      </div>
    </div>
  );
}

interface EquityBarComparisonProps {
  entries?: EquityBarEntry[];
  heroLabel?: string;
  villainLabel?: string;
  className?: string;
}

export function EquityBarComparison({
  entries = MOCK_EQUITY_BAR_DATA,
  heroLabel = "Hero",
  villainLabel = "Villain",
  className,
}: EquityBarComparisonProps) {
  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      {entries.map((entry) => (
        <div key={entry.hand} className="flex flex-col gap-1">
          <div className="text-sm font-medium text-foreground">{entry.hand}</div>
          <EquityBar
            heroEquity={entry.heroEquity}
            villainEquity={entry.villainEquity}
            heroLabel={heroLabel}
            villainLabel={villainLabel}
          />
        </div>
      ))}
    </div>
  );
}