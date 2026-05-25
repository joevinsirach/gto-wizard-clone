"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PrizePoolEntry {
  place: number;
  percentage: number;
}

interface PrizePoolPanelProps {
  prizes?: PrizePoolEntry[];
  onPrizesChange?: (prizes: PrizePoolEntry[]) => void;
  totalPrize?: number;
  className?: string;
}

const DEFAULT_PRIZES: PrizePoolEntry[] = [
  { place: 1, percentage: 50 },
  { place: 2, percentage: 30 },
  { place: 3, percentage: 20 },
];

export function PrizePoolPanel({
  prizes = DEFAULT_PRIZES,
  onPrizesChange,
  totalPrize = 1000,
  className,
}: PrizePoolPanelProps) {
  const [localPrizes, setLocalPrizes] = useState<PrizePoolEntry[]>(prizes);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEdit = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      const newPrizes = [...localPrizes];
      newPrizes[index] = { ...newPrizes[index], percentage: numValue };
      setLocalPrizes(newPrizes);
      onPrizesChange?.(newPrizes);
    }
  };

  const addPlace = () => {
    const newPrizes = [
      ...localPrizes,
      { place: localPrizes.length + 1, percentage: 0 },
    ];
    setLocalPrizes(newPrizes);
    onPrizesChange?.(newPrizes);
  };

  const removePlace = (index: number) => {
    if (localPrizes.length <= 2) return;
    const newPrizes = localPrizes.filter((_, i) => i !== index);
    // Renumber places
    newPrizes.forEach((p, i) => (p.place = i + 1));
    setLocalPrizes(newPrizes);
    onPrizesChange?.(newPrizes);
  };

  const totalPercentage = localPrizes.reduce((sum, p) => sum + p.percentage, 0);

  return (
    <div className={cn("border border-gray-800 rounded-lg p-4 bg-gray-900/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-poker-gold">Prize Pool Structure</h3>
        <span className="text-sm text-muted-foreground">
          Total: ${totalPrize.toLocaleString()}
        </span>
      </div>

      <div className="space-y-2">
        {localPrizes.map((prize, index) => (
          <div
            key={prize.place}
            className="flex items-center gap-3 p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <span className="w-16 text-sm font-medium">
              {prize.place === 1
                ? "1st"
                : prize.place === 2
                ? "2nd"
                : prize.place === 3
                ? "3rd"
                : `${prize.place}th`}
            </span>
            {editingIndex === index ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  handleEdit(index, editValue);
                  setEditingIndex(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEdit(index, editValue);
                    setEditingIndex(null);
                  }
                }}
                className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-center"
                min="0"
                max="100"
                step="0.1"
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  setEditingIndex(index);
                  setEditValue(prize.percentage.toString());
                }}
                className="cursor-pointer hover:text-poker-gold transition-colors"
              >
                <span className="text-green-400 font-mono">
                  ${((prize.percentage / 100) * totalPrize).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  ({prize.percentage.toFixed(1)}%)
                </span>
              </span>
            )}
            <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-poker-gold to-yellow-500 transition-all"
                style={{ width: `${prize.percentage}%` }}
              />
            </div>
            <button
              onClick={() => removePlace(index)}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              disabled={localPrizes.length <= 2}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={addPlace}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
        >
          + Add Place
        </button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span
            className={cn(
              "font-mono font-semibold",
              Math.abs(totalPercentage - 100) < 0.01
                ? "text-green-400"
                : "text-red-400"
            )}
          >
            {totalPercentage.toFixed(1)}%
          </span>
          {Math.abs(totalPercentage - 100) > 0.01 && (
            <span className="text-red-400 text-xs ml-2">(must equal 100%)</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrizePoolPanel;
