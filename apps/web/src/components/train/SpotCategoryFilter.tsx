"use client";

import { cn } from "@/lib/utils";

interface SpotCategoryFilterProps {
  categories: string[];
  selected: string | null;
  onChange: (category: string | null) => void;
  className?: string;
}

export function SpotCategoryFilter({
  categories,
  selected,
  onChange,
  className,
}: SpotCategoryFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-4 py-2 rounded-lg font-medium text-sm transition-all",
          selected === null
            ? "bg-poker-gold text-black shadow-lg"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        )}
      >
        All Categories
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(selected === category ? null : category)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all",
            selected === category
              ? "bg-poker-gold text-black shadow-lg"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default SpotCategoryFilter;