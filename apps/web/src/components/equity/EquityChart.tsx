"use client";

import { cn } from "@/lib/utils";

export interface EquityEntry {
  hand: string;
  heroEquity: number;    // 0-100
  heroWin: number;       // win %
  heroTie: number;       // tie %
  villainEquity: number; // 0-100
  villainWin: number;
  villainTie: number;
}

export const MOCK_EQUITY_DATA: EquityEntry[] = [
  { hand: "AA", heroEquity: 81.2, heroWin: 79.1, heroTie: 2.1, villainEquity: 18.8, villainWin: 17.2, villainTie: 1.6 },
  { hand: "KK", heroEquity: 79.8, heroWin: 77.5, heroTie: 2.3, villainEquity: 20.2, villainWin: 18.4, villainTie: 1.8 },
  { hand: "QQ", heroEquity: 77.1, heroWin: 74.2, heroTie: 2.9, villainEquity: 22.9, villainWin: 20.8, villainTie: 2.1 },
  { hand: "AKs", heroEquity: 65.4, heroWin: 62.1, heroTie: 3.3, villainEquity: 34.6, villainWin: 31.9, villainTie: 2.7 },
  { hand: "AKo", heroEquity: 63.2, heroWin: 59.8, heroTie: 3.4, villainEquity: 36.8, villainWin: 34.1, villainTie: 2.7 },
  { hand: "JJ", heroEquity: 71.5, heroWin: 68.3, heroTie: 3.2, villainEquity: 28.5, villainWin: 25.9, villainTie: 2.6 },
  { hand: "TT", heroEquity: 69.2, heroWin: 65.7, heroTie: 3.5, villainEquity: 30.8, villainWin: 28.1, villainTie: 2.7 },
  { hand: "99", heroEquity: 66.8, heroWin: 62.9, heroTie: 3.9, villainEquity: 33.2, villainWin: 30.4, villainTie: 2.8 },
];

interface EquityChartProps {
  data?: EquityEntry[];
  className?: string;
  heroLabel?: string;
  villainLabel?: string;
}

export function EquityChart({
  data = MOCK_EQUITY_DATA,
  className,
  heroLabel = "Hero",
  villainLabel = "Villain",
}: EquityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-48 text-muted-foreground text-sm", className)}>
        No equity data available
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {data.map((entry) => {
        const { hand, heroEquity, heroWin, heroTie, villainEquity, villainWin, villainTie } = entry;
        // Residual tie: whatever doesn't belong to hero or villain
        const tiePct = Math.max(0, 100 - heroEquity - villainEquity);

        return (
          <div key={hand} className="space-y-2">
            {/* Hand label + EV */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{hand}</span>
              <span className="text-xs text-muted-foreground">
                EV: {(heroEquity / 100).toFixed(3)}
              </span>
            </div>

            {/* Horizontal bar: hero | tie | villain */}
            <div className="relative h-10 w-full rounded-full overflow-hidden bg-gray-800">
              {heroEquity > 0 && (
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-start pl-3"
                  style={{ width: `${heroEquity}%`, backgroundColor: "#22c55e" }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {heroEquity.toFixed(1)}%
                  </span>
                </div>
              )}
              {tiePct > 0 && (
                <div
                  className="absolute inset-y-0 flex items-center justify-center"
                  style={{
                    width: `${tiePct}%`,
                    backgroundColor: "#6b7280",
                    left: `${heroEquity}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-sm">
                    {tiePct.toFixed(1)}%
                  </span>
                </div>
              )}
              {villainEquity > 0 && (
                <div
                  className="absolute inset-y-0 right-0 flex items-center justify-end pr-3"
                  style={{ width: `${villainEquity}%`, backgroundColor: "#ef4444" }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {villainEquity.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Win / Tie counts below */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-green-400 font-medium">Win: {heroWin.toFixed(1)}%</span>
                <span className="text-gray-400">Tie: {heroTie.toFixed(1)}%</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400">Tie: {villainTie.toFixed(1)}%</span>
                <span className="text-red-400 font-medium">Win: {villainWin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EquityChart;
