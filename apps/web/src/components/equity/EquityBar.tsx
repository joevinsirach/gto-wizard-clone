"use client";

import { cn } from "@/lib/utils";

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
  /** Equity percentage (0-100) */
  value: number;
  /** Label shown to the right of the bar (optional) */
  label?: string;
  /** If true, a label is shown to the left */
  showValue?: boolean;
  /** Compact mode: smaller height, no border-radius, minimal gap */
  compact?: boolean;
  className?: string;
}

/**
 * Map equity (0-100) to an HSL color.
 *   0%   → hsl(0,   70%, 50%)  – red
 *   50%  → hsl(60,  70%, 55%)  – yellow
 *   100% → hsl(120, 70%, 50%)  – green
 */
function equityToHsl(equity: number): string {
  const clamped = Math.max(0, Math.min(100, equity));
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * EquityBar – A compact inline horizontal bar whose width represents equity.
 *
 * Use cases:
 * - Inline in tables or hand-history rows.
 * - Mini equity visualization next to hand names.
 */
export function EquityBar({
  value,
  label,
  showValue = false,
  compact = false,
  className,
}: EquityBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Bar track */}
      <div
        className={cn(
          "relative overflow-hidden bg-gray-800",
          compact ? "h-3 w-16 rounded-sm" : "h-4 w-24 rounded-md"
        )}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundColor: equityToHsl(clamped),
          }}
        />
      </div>

      {/* Value label */}
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
          {clamped.toFixed(0)}%
        </span>
      )}

      {/* Custom label */}
      {label && (
        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
          {label}
        </span>
      )}
    </div>
  );
}

/** Bar-only variant: just the colored bar, no label, ultra-compact. */
export function MiniEquityBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <EquityBar value={value} compact className={className} />;
}

export default EquityBar;
