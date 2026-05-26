"use client";

import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  difficulties: readonly ("easy" | "medium" | "hard")[];
  selected: string | null;
  onChange: (difficulty: string | null) => void;
  className?: string;
}

const DIFFICULTY_STYLES = {
  easy: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
    activeBg: "bg-green-500",
    activeText: "text-black",
  },
  medium: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    activeBg: "bg-yellow-500",
    activeText: "text-black",
  },
  hard: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
    activeBg: "bg-red-500",
    activeText: "text-white",
  },
};

export function DifficultySelector({
  difficulties,
  selected,
  onChange,
  className,
}: DifficultySelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm transition-all",
          selected === null
            ? "bg-gray-600 text-white shadow-lg"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        )}
      >
        All Levels
      </button>
      {difficulties.map((difficulty) => {
        const styles = DIFFICULTY_STYLES[difficulty];
        const isSelected = selected === difficulty;
        
        return (
          <button
            key={difficulty}
            onClick={() => onChange(isSelected ? null : difficulty)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all border",
              isSelected
                ? `${styles.activeBg} ${styles.activeText} shadow-lg`
                : `${styles.bg} ${styles.text} ${styles.border} hover:opacity-80`
            )}
          >
            {difficulty}
          </button>
        );
      })}
    </div>
  );
}

export default DifficultySelector;