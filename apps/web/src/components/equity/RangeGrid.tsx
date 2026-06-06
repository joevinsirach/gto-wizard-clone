"use client";

import { useMemo, useState, useCallback } from "react";
import { cn, RANKS, getHand } from "@/lib/utils";
import { gtoTheme, getStrengthColor, getBetColor } from "@/styles/gto-tokens";

// ============================================================================
// Types
// ============================================================================

export type CellMode = "strength" | "action";

export interface CellData {
  hand: string;
  /** Equity value 0-100 (for strength mode) */
  equity?: number;
  /** Bet size in big blinds (for action mode) */
  betSize?: number;
  /** Action label */
  action?: string;
  /** Frequency of this action (0-1) */
  frequency?: number;
}

export interface RangeGridProps {
  /** Grid data keyed by hand string */
  data: Record<string, CellData>;
  /** Coloring mode */
  mode: CellMode;
  /** Title shown above the grid */
  title: string;
  /** Optional subtitle/position label */
  subtitle?: string;
  /** Whether cells are selectable */
  selectable?: boolean;
  /** Selected hands set */
  selected?: Set<string>;
  /** Called when a cell is clicked */
  onCellClick?: (hand: string, data: CellData) => void;
  /** Callback for selection changes */
  onSelectionChange?: (selected: Set<string>) => void;
  className?: string;
}

export function getHandDisplayName(hand: string): string {
  if (hand.includes("s") || hand.includes("o")) {
    return hand.slice(0, 2);
  }
  return hand;
}

// ============================================================================
// Sub-components
// ============================================================================

function StrengthCell({ hand, equity }: { hand: string; equity: number | undefined }) {
  const bgColor = equity !== undefined ? getStrengthColor(equity) : gtoTheme.cell.unselected;
  const opacity = equity !== undefined ? Math.max(0.25, Math.min(0.85, equity / 100 + 0.15)) : 0.5;
  const displayVal = equity !== undefined ? `${equity.toFixed(0)}%` : "";

  return (
    <>
      <span className="text-[10px] font-semibold text-white drop-shadow-sm">
        {getHandDisplayName(hand)}
      </span>
      <span className="text-[8px] text-white/70 absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {displayVal}
      </span>
    </>
  );
}

function ActionCell({ data }: { data: CellData }) {
  const bgColor = getBetColor(data.betSize ?? 0);
  const opacity = Math.max(0.2, Math.min(0.85, (data.frequency ?? 0.5) + 0.2));
  const label = data.action ?? "";

  // Shorten bet size labels
  const shortLabel = label
    .replace("bet ", "")
    .replace("check", "X")
    .replace("fold", "F");

  return (
    <>
      <span className="text-[10px] font-semibold text-white drop-shadow-sm">
        {getHandDisplayName(data.hand)}
      </span>
      <span className="text-[8px] text-white/80 absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {shortLabel}
      </span>
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RangeGrid({
  data,
  mode,
  title,
  subtitle,
  selectable = false,
  selected,
  onCellClick,
  onSelectionChange,
  className,
}: RangeGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const gridRows = useMemo(() => {
    return RANKS.map((rowRank, row) => {
      const cells = RANKS.map((colRank, col) => {
        const hand = getHand(row, col);
        return { hand, cellData: data[hand] };
      });
      return { rank: rowRank, cells };
    });
  }, [data]);

  const handleClick = useCallback(
    (hand: string, cellData: CellData | undefined) => {
      if (selectable && onSelectionChange) {
        const newSet = new Set(selected ?? []);
        if (newSet.has(hand)) {
          newSet.delete(hand);
        } else {
          newSet.add(hand);
        }
        onSelectionChange(newSet);
      }
      if (cellData && onCellClick) {
        onCellClick(hand, cellData);
      }
    },
    [selectable, selected, onSelectionChange, onCellClick]
  );

  const isSelected = (hand: string) => selected?.has(hand) ?? false;

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-800 bg-gray-900/60 p-4",
        className
      )}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block select-none">
          {/* Column headers */}
          <div className="flex items-center mb-px">
            <div className="w-[22px] shrink-0" />
            {RANKS.map((rank) => (
              <div
                key={rank}
                className="text-[10px] font-semibold text-gray-500 text-center"
                style={{ width: 30, minWidth: 30 }}
              >
                {rank}
              </div>
            ))}
          </div>

          {/* Rows */}
          {gridRows.map(({ rank, cells }) => (
            <div key={rank} className="flex items-center mb-px">
              <div className="w-[22px] shrink-0 text-[10px] font-semibold text-gray-500 text-center">
                {rank}
              </div>
              {cells.map(({ hand, cellData }) => {
                const equity = cellData?.equity ?? 0;
                const betSize = cellData?.betSize ?? 0;
                const freq = cellData?.frequency ?? 0;

                // Determine background color and opacity
                let bgColor: string;
                let opacity: number;
                let showLabel = true;

                if (mode === "strength") {
                  bgColor = getStrengthColor(equity);
                  opacity = Math.max(0.2, Math.min(0.85, equity / 100 + 0.15));
                } else {
                  bgColor = getBetColor(betSize);
                  opacity = Math.max(0.2, Math.min(0.85, freq + 0.2));
                }

                if (!cellData) {
                  bgColor = gtoTheme.cell.unselected;
                  opacity = 0.3;
                  showLabel = false;
                }

                const hovered = hoveredCell === hand;
                const selectedState = isSelected(hand);

                return (
                  <div
                    key={hand}
                    className={cn(
                      "relative flex items-center justify-center cursor-pointer transition-all",
                      hovered && "ring-1 ring-white/30 z-10",
                      selectedState && "ring-2 ring-gold"
                    )}
                    style={{
                      width: 30,
                      height: 30,
                      minWidth: 30,
                      minHeight: 30,
                      backgroundColor: `${bgColor}${Math.round(opacity * 255)
                        .toString(16)
                        .padStart(2, "0")}`,
                      borderRadius: 2,
                    }}
                    onMouseEnter={() => setHoveredCell(hand)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleClick(hand, cellData)}
                    title={
                      cellData
                        ? `${hand} | Eq: ${cellData.equity?.toFixed(1) ?? "?"}% | Action: ${cellData.action ?? "?"} ${cellData.betSize ? `(${cellData.betSize}bb)` : ""}`
                        : hand
                    }
                  >
                    {showLabel && (
                      <>
                        <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                          {getHandDisplayName(hand)}
                        </span>
                        {mode === "strength" && cellData?.equity !== undefined && (
                          <span className="text-[7px] text-white/70 absolute -bottom-[2px] left-1/2 -translate-x-1/2 whitespace-nowrap leading-none">
                            {equity.toFixed(0)}%
                          </span>
                        )}
                        {mode === "action" && cellData?.action && (
                          <span className="text-[7px] text-white/70 absolute -bottom-[2px] left-1/2 -translate-x-1/2 whitespace-nowrap leading-none">
                            {cellData.action.replace("bet ", "").replace("check", "X").replace("fold", "F")}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RangeGrid;
