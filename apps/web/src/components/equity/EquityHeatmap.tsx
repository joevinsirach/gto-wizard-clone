"use client";

import { useState, useMemo } from "react";
import { cn, RANKS, getHand } from "@/lib/utils";

export interface EquityDataEntry {
  hand: string;
  equity: number;
}

interface EquityHeatmapProps {
  data: EquityDataEntry[];
  onCellClick?: (hand: string, equity: number) => void;
  className?: string;
}

/**
 * Map equity (0-100) to an HSL color string.
 *   0%   → hsl(0,   70%, 50%)  – red
 *   50%  → hsl(60,  70%, 55%)  – yellow
 *   100% → hsl(120, 70%, 50%)  – green
 */
function equityToHsl(equity: number): string {
  const clamped = Math.max(0, Math.min(100, equity));
  const hue = (clamped / 100) * 120; // 0 → 120
  const saturation = 70;
  // Slightly brighter at 50% so yellow is legible
  const lightness = 50;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function EquityHeatmap({ data, onCellClick, className }: EquityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const equityMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((entry) => {
      map.set(entry.hand, entry.equity);
    });
    return map;
  }, [data]);

  const getTextColor = (equity: number | undefined): string => {
    if (equity === undefined) return "text-gray-400";
    // Use dark text on light cells (yellow/green), white on dark cells (red)
    return equity > 45 ? "text-gray-900" : "text-white";
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* --- Grid --- */}
      <div className="grid gap-px bg-gray-800 p-1 rounded-lg select-none" style={{ gridTemplateColumns: `34px repeat(13, 34px)` }}>
        {/* Top-left corner (empty) */}
        <div style={{ width: 34, height: 34 }} />

        {/* Column headers */}
        {RANKS.map((rank) => (
          <div
            key={`col-${rank}`}
            className="flex items-center justify-center text-xs font-semibold text-muted-foreground"
            style={{ width: 34, height: 34 }}
          >
            {rank}
          </div>
        ))}

        {/* Rows */}
        {RANKS.map((rowRank, rowIdx) => (
          <>
            {/* Row header */}
            <div
              key={`row-${rowRank}`}
              className="flex items-center justify-center text-xs font-semibold text-muted-foreground"
              style={{ width: 34, height: 34 }}
            >
              {rowRank}
            </div>

            {/* Hand cells */}
            {RANKS.map((_, colIdx) => {
              const hand = getHand(rowIdx, colIdx);
              const equity = equityMap.get(hand);
              const isHovered = hoveredCell === hand;

              return (
                <div
                  key={hand}
                  className={cn(
                    "relative flex items-center justify-center text-[11px] font-medium cursor-pointer transition-all",
                    isHovered && "ring-2 ring-white ring-offset-1 ring-offset-gray-900 z-10"
                  )}
                  style={{
                    width: 34,
                    height: 34,
                    backgroundColor: equity !== undefined ? equityToHsl(equity) : "#1f2937",
                    borderRadius: 2,
                  }}
                  onMouseEnter={() => setHoveredCell(hand)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => onCellClick?.(hand, equity ?? 0)}
                >
                  <span className={getTextColor(equity)}>
                    {equity !== undefined ? `${equity.toFixed(0)}%` : "-"}
                  </span>
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* --- Tooltip --- */}
      {hoveredCell && equityMap.has(hoveredCell) && (
        <div className="absolute top-0 left-full ml-3 z-20 bg-popover border border-border rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
          <div className="font-semibold text-sm">{hoveredCell}</div>
          <div className="text-xs text-muted-foreground">
            Equity: {equityMap.get(hoveredCell)?.toFixed(1) ?? "N/A"}%
          </div>
        </div>
      )}

      {/* --- Color Scale Legend --- */}
      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="text-muted-foreground font-medium">Low</span>
        <div className="flex h-4 w-48 rounded-md overflow-hidden border border-border">
          {Array.from({ length: 31 }, (_, i) => {
            const equity = (i / 30) * 100;
            return (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: equityToHsl(equity) }}
              />
            );
          })}
        </div>
        <span className="text-muted-foreground font-medium">High</span>
      </div>
    </div>
  );
}

export default EquityHeatmap;
