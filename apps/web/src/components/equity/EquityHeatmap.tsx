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

export function EquityHeatmap({ data, onCellClick, className }: EquityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const equityMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((entry) => {
      map.set(entry.hand, entry.equity);
    });
    return map;
  }, [data]);

  const getEquityColor = (equity: number | undefined): string => {
    if (equity === undefined) return "bg-gray-800";

    // Map equity (0-100) to hue (0-120: red -> yellow -> green)
    const hue = (equity / 100) * 120;
    const saturation = 70;
    const lightness = 50;

    return `bg-[hsl(${hue},${saturation}%,${lightness}%)]`;
  };

  const getEquityTextColor = (equity: number | undefined): string => {
    if (equity === undefined) return "text-gray-400";
    return equity > 60 ? "text-gray-900" : "text-white";
  };

  const getHandDisplayName = (hand: string): string => {
    if (hand.includes("s")) {
      return hand.slice(0, 2);
    }
    if (hand.includes("o")) {
      return hand.slice(0, 2);
    }
    return hand;
  };

  return (
    <div className={cn("relative", className)}>
      <div className="inline-grid gap-0.5 bg-gray-800 p-2 rounded-lg select-none">
        {/* Top-left corner */}
        <div className="w-8 h-8" />
        {/* Column headers */}
        {RANKS.map((rank, idx) => (
          <div
            key={`col-${rank}-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground"
          >
            {rank}
          </div>
        ))}

        {/* Rows */}
        {RANKS.map((rank, rowIdx) => (
          <div key={`row-${rank}-${rowIdx}`} className="contents">
            {/* Row header */}
            <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {rank}
            </div>
            {/* Hand cells */}
            {RANKS.map((_, colIdx) => {
              const hand = getHand(rowIdx, colIdx);
              const equity = equityMap.get(hand);
              const isHovered = hoveredCell === hand;
              const showLabel = rowIdx === colIdx || colIdx === 0 || colIdx === RANKS.length - 1;

              return (
                <div
                  key={hand}
                  className={cn(
                    "w-8 h-8 rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center",
                    getEquityColor(equity),
                    isHovered && "ring-2 ring-white ring-offset-1 ring-offset-gray-900"
                  )}
                  onMouseEnter={() => setHoveredCell(hand)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => onCellClick?.(hand, equity ?? 0)}
                  title={`${hand}: ${equity !== undefined ? equity.toFixed(1) : "N/A"}%`}
                >
                  <span className={getEquityTextColor(equity)}>
                    {showLabel ? getHandDisplayName(hand) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute top-2 left-full ml-2 z-10 bg-popover border border-border rounded-md px-3 py-2 shadow-lg">
          <div className="font-semibold text-sm">{hoveredCell}</div>
          <div className="text-xs text-muted-foreground">
            Equity: {equityMap.get(hoveredCell)?.toFixed(1) ?? "N/A"}%
          </div>
        </div>
      )}

      {/* Color Scale Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs">
        <span className="text-muted-foreground">Low (0%)</span>
        <div className="flex h-4 w-48 rounded overflow-hidden">
          {Array.from({ length: 21 }, (_, i) => {
            const hue = (i / 20) * 120;
            return (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: `hsl(${hue}, 70%, 50%)`,
                }}
              />
            );
          })}
        </div>
        <span className="text-muted-foreground">High (100%)</span>
      </div>
    </div>
  );
}

export default EquityHeatmap;
