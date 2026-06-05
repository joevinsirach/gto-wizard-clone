"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { cn, RANKS, getHand } from "@/lib/utils";
import { gtoTheme } from "@/styles/gto-tokens";

interface RangeSelectorProps {
  value: Set<string>;
  onChange: (value: Set<string>) => void;
  className?: string;
  selectable?: boolean;
}

type HandType = "pocket" | "suited" | "offsuit";

/**
 * Determine hand type from the getHand format:
 * - row === col => pocket pair (e.g. "AA", "KK")
 * - col > row   => suited (e.g. "AKs")
 * - col < row   => offsuit (e.g. "AKo")
 */
function getHandType(hand: string): HandType {
  if (hand.includes("s")) return "suited";
  if (hand.includes("o")) return "offsuit";
  return "pocket";
}

function getHandTypeColor(hand: string): string {
  const t = getHandType(hand);
  return gtoTheme.handType[t];
}

export function RangeSelector({ value, onChange, className, selectable = true }: RangeSelectorProps) {
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const isDragging = useRef(false);
  const selectMode = useRef<"add" | "remove">("add");

  // Track all cells for range-filling during drag
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setCellRef = useCallback((hand: string, el: HTMLDivElement | null) => {
    if (el) {
      cellRefs.current.set(hand, el);
    } else {
      cellRefs.current.delete(hand);
    }
  }, []);

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

  /** Drag handler: when mouse enters a cell while dragging, add/remove it */
  const handleCellEnter = useCallback(
    (hand: string) => {
      if (!selectable || !isDragging.current) return;

      const newValue = new Set(value);
      if (selectMode.current === "add") {
        newValue.add(hand);
      } else {
        newValue.delete(hand);
      }
      setLastSelected(hand);
      onChange(newValue);
    },
    [selectable, value, onChange]
  );

  const handleMouseDown = useCallback(
    (hand: string, e: React.MouseEvent) => {
      if (!selectable) return;
      e.preventDefault();

      // Determine mode based on current state of clicked cell
      if (value.has(hand)) {
        selectMode.current = "remove";
      } else {
        selectMode.current = "add";
      }

      isDragging.current = true;
      toggleHand(hand, e.shiftKey);
    },
    [selectable, value, toggleHand]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const getCellColor = (hand: string) => {
    if (!selectable) return "bg-gray-800 cursor-default";

    const isSelected = value.has(hand);

    if (isSelected) {
      const color = getHandTypeColor(hand);
      // Use the hand type color at ~60% saturation for selected state
      return `${color}77`; // 47% alpha in hex
    }

    return "bg-gray-700";
  };

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

  const getHandDisplayName = (hand: string): string => {
    if (hand.includes("s")) {
      return hand.slice(0, 2);
    }
    if (hand.includes("o")) {
      return hand.slice(0, 2);
    }
    return hand;
  };

  // Memoize labels for each cell position — show for diagonal, first col, and last col
  const showLabel = useCallback((rowIdx: number, colIdx: number): boolean => {
    return rowIdx === colIdx || colIdx === 0 || colIdx === RANKS.length - 1;
  }, []);

  return (
    <div
      className={cn("relative", className)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="inline-grid gap-0.5 bg-gray-800 p-2 rounded-lg select-none">
        {/* Grid CSS — 14 columns: 1 row-header + 13 ranks */}
        {/* Top-left corner */}
        <div className="w-11 h-11" />
        {/* Column headers */}
        {RANKS.map((rank, idx) => (
          <div
            key={`col-${rank}-${idx}`}
            className="w-11 h-11 flex items-center justify-center text-xs font-semibold text-gray-400"
          >
            {rank}
          </div>
        ))}

        {/* Rows */}
        {RANKS.map((rank, rowIdx) => (
          <div key={`row-${rank}-${rowIdx}`} className="contents">
            {/* Row header */}
            <div className="w-11 h-11 flex items-center justify-center text-xs font-semibold text-gray-400">
              {rank}
            </div>
            {/* Hand cells */}
            {RANKS.map((_, colIdx) => {
              const hand = getHand(rowIdx, colIdx);
              const isSelected = value.has(hand);
              const type = getHandType(hand);
              const typeColor = getHandTypeColor(hand);

              return (
                <div
                  key={hand}
                  ref={(el) => setCellRef(hand, el)}
                  className={cn(
                    "w-11 h-11 rounded text-xs font-medium cursor-pointer transition-colors flex items-center justify-center select-none",
                    isSelected
                      ? "text-white font-bold"
                      : "text-gray-300 hover:brightness-125",
                    isSelected
                      ? ""
                      : "hover:bg-gray-600"
                  )}
                  style={{
                    backgroundColor: isSelected ? typeColor : undefined,
                    minWidth: "44px",
                    minHeight: "44px",
                  }}
                  onMouseEnter={() => handleCellEnter(hand)}
                  onMouseDown={(e) => handleMouseDown(hand, e)}
                  title={`${hand} (${type})`}
                >
                  <span>
                    {showLabel(rowIdx, colIdx) ? getHandDisplayName(hand) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend — hand type colors */}
      <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: gtoTheme.handType.pocket }}
          />
          <span className="text-gray-400">Pocket Pairs</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: gtoTheme.handType.suited }}
          />
          <span className="text-gray-400">Suited</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: gtoTheme.handType.offsuit }}
          />
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

export default RangeSelector;
