/**
 * TagInput — multi-tag input for spot categories and filters.
 * Allows adding, removing, and displaying tags with auto-complete support.
 */

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tag {
  id: string;
  label: string;
}

interface TagInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tag...",
  maxTags,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !value.some((t) => t.label.toLowerCase() === s.toLowerCase()),
  );

  const addTag = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      if (maxTags && value.length >= maxTags) return;
      if (value.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) return;

      onChange([...value, { id: crypto.randomUUID(), label: trimmed }]);
      setInput("");
      setShowSuggestions(false);
    },
    [value, onChange, maxTags],
  );

  const removeTag = useCallback(
    (id: string) => {
      onChange(value.filter((t) => t.id !== id));
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && input) {
        e.preventDefault();
        addTag(input);
      } else if (e.key === "Backspace" && !input && value.length > 0) {
        removeTag(value[value.length - 1].id);
      }
    },
    [input, value, addTag, removeTag],
  );

  const handleSuggestionClick = useCallback(
    (s: string) => {
      addTag(s);
      setShowSuggestions(false);
    },
    [addTag],
  );

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-primary/10 text-xs text-primary border border-primary/20"
            >
              {tag.label}
              <button
                onClick={() => removeTag(tag.id)}
                className="text-primary/60 hover:text-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className={cn(
            "flex h-9 w-full border border-border bg-background/40 px-3 py-1",
            "font-courier text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30",
          )}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && input && filteredSuggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 py-1 rounded border border-border bg-background/95 shadow-lg max-h-40 overflow-auto">
            {filteredSuggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={() => handleSuggestionClick(s)}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-primary/10 transition-colors"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Helper text */}
      {maxTags && (
        <span className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </span>
      )}
    </div>
  );
}