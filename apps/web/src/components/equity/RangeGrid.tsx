"use client";

import { useState, useCallback } from "react";
import { cn, RANKS } from "@/lib/utils";

export type HandType = "pocket" | "suited" | "offsuit";

export interface CellData {
  hand: string;
  row: number;
  col: number;
  type: HandType;
}

export interface RangeGridProps {
  selectedHands: Set<string>;
  onChange: (hands: Set<string>) => void;
  className?: string;
  selectable?: boolean;
}

export function getHandType(row: number, col: number): HandType {
  if (row === col) return "pocket";
  return col > row ? "suited" : "offsuit";
}

export function getHand(row: number, col: number): string {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];
  if (row === col) return `${rank1}${rank2}`;
  if (col > row) return `${rank1}${rank2}s`;
  return `${rank1}${rank2}o`;
}

export function RangeGrid({
  selectedHands,
  onChange,
  className,
  selectable = true,
}: RangeGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const handleCellClick = useCallback(
    (hand: string) => {
      if (!selectable) return;
      const newSelected = new Set(selectedHands);
      if (newSelected.has(hand)) {
        newSelected.delete(hand);
      } else {
        newSelected.add(hand);
      }
      onChange(newSelected);
    },
    [selectedHands, onChange, selectable]
  );

  const getCellBgColor = (hand: string, type: HandType, isHovered: boolean) => {
    if (!selectable) return "bg-gray-800 cursor-default";
    const isSelected = selectedHands.has(hand);

    if (isSelected) {
      if (type === "pocket") return "bg-green-600 hover:bg-green-500";
      if (type === "suited") return "bg-blue-600 hover:bg-blue-500";
      return "bg-yellow-600 hover:bg-yellow-500";
    }

    if (isHovered) return "bg-gray-600 hover:bg-gray-500";
    return "bg-gray-700 hover:bg-gray-600";
  };

  const displayRank = (rank: string) => rank;

  return (
    <div className={cn("inline-block", className)}>
      <div className="inline-grid gap-0.5 bg-gray-900 p-2 rounded-lg select-none">
        {/* Top-left corner spacer */}
        <div className="w-9 h-9" />

        {/* Column headers (T, J, Q, K, A for opponent's hand) */}
        {RANKS.map((rank, idx) => (
          <div
            key={`col-header-${rank}-${idx}`}
            className="w-9 h-9 flex items-center justify-center text-xs font-bold text-amber-400"
          >
            {displayRank(rank)}
          </div>
        ))}

        {/* Grid rows */}
        {RANKS.map((rowRank, rowIdx) => (
          <div key={`row-${rowRank}-${rowIdx}`} className="contents">
            {/* Row header (2-9, T, J, Q, K, A for our hand) */}
            <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-amber-400">
              {displayRank(rowRank)}
            </div>

            {/* Cells for this row */}
            {RANKS.map((colRank, colIdx) => {
              const hand = getHand(rowIdx, colIdx);
              const type = getHandType(rowIdx, colIdx);
              const isHovered = hoveredCell === hand;
              const showLabel = rowIdx === colIdx || colIdx === 0 || colIdx === RANKS.length - 1;

              return (
                <div
                  key={hand}
                  className={cn(
                    "w-9 h-9 rounded cursor-pointer transition-all flex items-center justify-center",
                    getCellBgColor(hand, type, isHovered)
                  )}
                  onMouseEnter={() => selectable && setHoveredCell(hand)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => handleCellClick(hand)}
                  title={hand}
                >
                  {showLabel && (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        selectedHands.has(hand) ? "text-white" : "text-gray-300"
                      )}
                    >
                      {hand.length > 2 ? hand.slice(0, 2) : hand}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-gray-400">Pocket Pairs</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span className="text-gray-400">Suited</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-600" />
          <span className="text-gray-400">Offsuit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-700" />
          <span className="text-gray-400">Unselected</span>
        </div>
      </div>
    </div>
  );
}

export default RangeGrid;