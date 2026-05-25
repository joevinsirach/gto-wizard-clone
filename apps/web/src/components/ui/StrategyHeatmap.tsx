"use client";

import { useState } from "react";
import { cn, RANKS, getHand } from "@/lib/utils";

interface StrategyHeatmapProps {
  strategy: Record<string, { action: "raise" | "call" | "fold"; frequency: number; ev: number }>;
  board?: string;
  className?: string;
}

const ACTION_COLORS = {
  raise: {
    bg: "bg-green-500",
    bgHover: "hover:bg-green-600",
    text: "text-green-700 dark:text-green-300",
  },
  call: {
    bg: "bg-yellow-500",
    bgHover: "hover:bg-yellow-600",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  fold: {
    bg: "bg-red-500",
    bgHover: "hover:bg-red-600",
    text: "text-red-700 dark:text-red-300",
  },
};

export function StrategyHeatmap({ strategy, board, className }: StrategyHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    hand: string;
    data: { action: string; frequency: number; ev: number };
    x: number;
    y: number;
  } | null>(null);

  const getCellColor = (hand: string) => {
    const data = strategy[hand];
    if (!data) return "bg-gray-800";
    return ACTION_COLORS[data.action]?.bg || "bg-gray-700";
  };

  const getCellBgOpacity = (hand: string) => {
    const data = strategy[hand];
    if (!data) return 0.3;
    return 0.3 + data.frequency * 0.7;
  };

  const getCellTextColor = (hand: string) => {
    const data = strategy[hand];
    if (!data) return "text-gray-500";
    return ACTION_COLORS[data.action]?.text || "text-gray-300";
  };

  return (
    <div className={cn("relative", className)}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-muted-foreground">Raise</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-muted-foreground">Call</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-muted-foreground">Fold</span>
        </div>
      </div>

      {/* Board label */}
      {board && (
        <div className="mb-2 text-sm font-mono text-muted-foreground">
          Board: {board}
        </div>
      )}

      {/* Heatmap grid */}
      <div className="inline-grid gap-0.5 bg-gray-800 p-2 rounded-lg">
        {/* Top-left corner */}
        <div className="w-8 h-8" />
        {/* Column headers */}
        {RANKS.map((rank) => (
          <div
            key={`col-${rank}`}
            className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground"
          >
            {rank}
          </div>
        ))}

        {/* Rows */}
        {RANKS.map((rank, row) => (
          <div key={`row-${rank}`} className="contents">
            {/* Row header */}
            <div className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {rank}
            </div>
            {/* Hand cells */}
            {RANKS.map((_, col) => {
              const hand = getHand(row, col);
              const data = strategy[hand];

              return (
                <div
                  key={hand}
                  className={cn(
                    "w-8 h-8 rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center",
                    getCellColor(hand),
                    data ? ACTION_COLORS[data.action]?.bgHover : "hover:bg-gray-700"
                  )}
                  style={{
                    backgroundColor: data
                      ? undefined
                      : undefined,
                    opacity: data ? getCellBgOpacity(hand) : 0.3,
                  }}
                  onMouseEnter={(e) => {
                    if (data) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        hand,
                        data,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  title={hand}
                >
                  <span className={getCellTextColor(hand)}>
                    {data ? `${(data.frequency * 100).toFixed(0)}` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs bg-popover border border-border rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 60,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold mb-1">{tooltip.hand}</div>
          <div className="space-y-0.5 text-muted-foreground">
            <div>Action: {tooltip.data.action}</div>
            <div>Frequency: {(tooltip.data.frequency * 100).toFixed(1)}%</div>
            <div>EV: {tooltip.data.ev.toFixed(3)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StrategyHeatmap;