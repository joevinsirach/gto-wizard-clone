"use client";

import { useState, useCallback, useRef } from "react";
import { cn, RANKS, getHand } from "@/lib/utils";

interface RangeSelectorProps {
  value: Set<string>;
  onChange: (value: Set<string>) => void;
  className?: string;
  selectable?: boolean;
}

export function RangeSelector({ value, onChange, className, selectable = true }: RangeSelectorProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const isDragging = useRef(false);

  const toggleHand = useCallback(
    (hand: string, isShiftClick: boolean) => {
      const newValue = new Set(value);

      if (isShiftClick && lastSelected) {
        // Range selection: select all hands between lastSelected and current hand
        const lastIdx = getHandIndex(lastSelected);
        const currentIdx = getHandIndex(hand);

        if (lastIdx && currentIdx) {
          const minRow = Math.min(lastIdx.row, currentIdx.row);
          const maxRow = Math.max(lastIdx.row, currentIdx.row);
          const minCol = Math.min(lastIdx.col, currentIdx.col);
          const maxCol = Math.max(lastIdx.col, currentIdx.col);

          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const h = getHand(r, c);
              newValue.add(h);
            }
          }
        }
      } else {
        if (newValue.has(hand)) {
          newValue.delete(hand);
        } else {
          newValue.add(hand);
        }
      }

      setLastSelected(hand);
      onChange(newValue);
    },
    [value, onChange, lastSelected]
  );

  const getHandIndex = (hand: string): { row: number; col: number } | null => {
    const ranks = hand.match(/[AKQJT2-9]/g);
    if (!ranks || ranks.length < 2) return null;

    const rank1 = ranks[0];
    const rank2 = ranks[1];
    const row = RANKS.indexOf(rank1 as typeof RANKS[number]);
    const col = RANKS.indexOf(rank2 as typeof RANKS[number]);

    if (row === -1 || col === -1) return null;
    return { row, col };
  };

  const getCellColor = (hand: string, isHovered: boolean) => {
    if (!selectable) return "bg-gray-800 cursor-default";

    const isSelected = value.has(hand);

    if (isSelected) {
      if (hand.includes("s")) {
        return "bg-blue-600 hover:bg-blue-500";
      }
      return "bg-green-600 hover:bg-green-500";
    }

    if (isHovered) {
      return "bg-gray-600 hover:bg-gray-500";
    }

    return "bg-gray-700 hover:bg-gray-600";
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
              const isHovered = hoveredCell === hand;
              const isSelected = value.has(hand);
              const showLabel = rowIdx === colIdx || colIdx === 0 || colIdx === RANKS.length - 1;

              return (
                <div
                  key={hand}
                  className={cn(
                    "w-8 h-8 rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center",
                    getCellColor(hand, isHovered)
                  )}
                  onMouseEnter={() => selectable && setHoveredCell(hand)}
                  onMouseLeave={() => selectable && setHoveredCell(null)}
                  onMouseDown={(e) => {
                    if (!selectable) return;
                    isDragging.current = true;
                    toggleHand(hand, e.shiftKey);
                  }}
                  onMouseUp={() => {
                    isDragging.current = false;
                  }}
                  title={hand}
                >
                  <span
                    className={cn(
                      isSelected ? "text-white font-semibold" : "text-gray-300"
                    )}
                  >
                    {showLabel ? getHandDisplayName(hand) : ""}
                  </span>
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
          <span className="text-muted-foreground">Pocket Pairs / Offsuit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span className="text-muted-foreground">Suited</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-700" />
          <span className="text-muted-foreground">Unselected</span>
        </div>
      </div>
    </div>
  );
}

export default RangeSelector;
