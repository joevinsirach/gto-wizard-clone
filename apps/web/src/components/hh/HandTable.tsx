/**
 * HandTable — filterable, paginated table for hand histories and EV loss data.
 * Supports filtering by spot category, date range, and EV loss threshold.
 */

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TagInput, type Tag } from "./TagInput";

export interface HandRecord {
  id: string;
  created_at: string;
  spot_category: string | null;
  ev_loss: number | null;
  gto_action: string | null;
  user_action: string | null;
  hand_text: string;
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface HandTableProps {
  hands: HandRecord[];
  columns?: Column<HandRecord>[];
  pageSize?: number;
  className?: string;
}

type SortDir = "asc" | "desc" | null;

const SPOT_CATEGORIES = [
  "preflop_open", "preflop_3bet", "preflop_4bet", "preflop_call",
  "flop_cbet", "flop_check", "flop_donk", "flop_slowplay",
  "turn_cbet", "turn_check", "turn_donk",
  "river_cbet", "river_check", "river_donk", "river_shove",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatEV(ev: number | null): string {
  if (ev === null) return "—";
  const sign = ev >= 0 ? "+" : "";
  return `${sign}${ev.toFixed(2)}`;
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (!dir) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  if (dir === "asc") return <ArrowUp className="h-3 w-3 text-primary" />;
  return <ArrowDown className="h-3 w-3 text-primary" />;
}

export function HandTable({
  hands,
  columns: customColumns,
  pageSize = 20,
  className,
}: HandTableProps) {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterTags, setFilterTags] = useState<Tag[]>([]);
  const [evMin, setEvMin] = useState<string>("");
  const [evMax, setEvMax] = useState<string>("");

  const DEFAULT_COLUMNS: Column<HandRecord>[] = useMemo(
    () => [
      {
        key: "created_at",
        label: "Date",
        sortable: true,
        render: (h) => (
          <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
        ),
      },
      {
        key: "spot_category",
        label: "Spot",
        sortable: true,
        render: (h) => (
          <span
            className={cn(
              "inline-block px-1.5 py-0.5 rounded text-xs",
              h.spot_category
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {h.spot_category ?? "unknown"}
          </span>
        ),
      },
      {
        key: "ev_loss",
        label: "EV Loss",
        sortable: true,
        render: (h) => {
          const ev = h.ev_loss;
          if (ev === null) return <span className="text-muted-foreground">—</span>;
          return (
            <span
              className={cn(
                "font-mono",
                ev > 10 ? "text-red-500" : ev > 5 ? "text-orange-500" : "text-foreground",
              )}
            >
              {formatEV(ev)}
            </span>
          );
        },
      },
      {
        key: "gto_action",
        label: "GTO",
        render: (h) => (
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {h.gto_action ?? "—"}
          </span>
        ),
      },
      {
        key: "user_action",
        label: "User",
        render: (h) => (
          <span
            className={cn(
              "text-xs font-mono",
              h.user_action && h.gto_action && h.user_action !== h.gto_action
                ? "text-red-500"
                : "text-foreground",
            )}
          >
            {h.user_action ?? "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const columns = customColumns ?? DEFAULT_COLUMNS;

  // Filter
  const filtered = useMemo(() => {
    let result = hands;

    if (filterTags.length > 0) {
      const cats = new Set(filterTags.map((t) => t.label));
      result = result.filter((h) => h.spot_category && cats.has(h.spot_category));
    }

    if (evMin) {
      const min = parseFloat(evMin);
      if (!isNaN(min)) result = result.filter((h) => h.ev_loss !== null && h.ev_loss >= min);
    }
    if (evMax) {
      const max = parseFloat(evMax);
      if (!isNaN(max)) result = result.filter((h) => h.ev_loss !== null && h.ev_loss <= max);
    }

    return result;
  }, [hands, filterTags, evMin, evMax]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortCol];
      const bVal = (b as unknown as Record<string, unknown>)[sortCol];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => {
          if (d === "asc") return "desc";
          if (d === "desc") return null;
          return "asc";
        });
        return prev;
      }
      setSortDir("desc");
      return col;
    });
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filter by Spot Category
            </span>
            <TagInput
              value={filterTags}
              onChange={setFilterTags}
              suggestions={SPOT_CATEGORIES}
              placeholder="Filter by category..."
              maxTags={5}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">EV Loss Range:</label>
              <input
                type="number"
                value={evMin}
                onChange={(e) => setEvMin(e.target.value)}
                placeholder="Min"
                className="w-20 h-8 border border-border bg-background/40 px-2 py-1 text-xs rounded"
              />
              <span className="text-muted-foreground">—</span>
              <input
                type="number"
                value={evMax}
                onChange={(e) => setEvMax(e.target.value)}
                placeholder="Max"
                className="w-20 h-8 border border-border bg-background/40 px-2 py-1 text-xs rounded"
              />
            </div>

            {(filterTags.length > 0 || evMin || evMax) && (
              <button
                onClick={() => {
                  setFilterTags([]);
                  setEvMin("");
                  setEvMax("");
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Showing {pageData.length} of {sorted.length} hands
        </span>
        {sorted.length !== hands.length && (
          <span className="text-primary">
            ({hands.length} total)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  onClick={col.sortable ? () => handleSort(col.key as string) : undefined}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortCol === col.key && (
                      <SortIcon dir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  No hands match your filters
                </td>
              </tr>
            ) : (
              pageData.map((hand) => (
                <tr
                  key={hand.id}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-3 py-2">
                      {col.render
                        ? col.render(hand)
                         : String((hand as unknown as Record<string, unknown>)[col.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(0)}
            disabled={currentPage === 0}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}