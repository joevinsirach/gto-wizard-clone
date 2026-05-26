/**
 * Hands — paginated list of analyzed hands with filters.
 * Supports filtering by spot category, EV loss range, and search.
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Eye, Download } from "lucide-react";
import { HandTable, type HandRecord } from "@/components/hh";
import { Button } from "@/components/ui/button";
import { exportHandsToCSV, generateExportFilename } from "@/components/hh";

// Mock hands for demonstration — in production these come from API params / context
const MOCK_HANDS: HandRecord[] = [
  {
    id: "1",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    spot_category: "flop_cbet",
    ev_loss: 3.21,
    gto_action: "bet 0.67",
    user_action: "check",
    hand_text: "PokerStars Hand #123456789: Hero held KdQs...",
  },
  {
    id: "2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    spot_category: "turn_cbet",
    ev_loss: 8.45,
    gto_action: "bet 0.75",
    user_action: "fold",
    hand_text: "PokerStars Hand #123456790: Hero faced a 3-bet...",
  },
  {
    id: "3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    spot_category: "preflop_3bet",
    ev_loss: 1.12,
    gto_action: "raise 3.5",
    user_action: "call",
    hand_text: "PokerStars Hand #123456791: Hero flat-called 3-bet...",
  },
  {
    id: "4",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    spot_category: "river_shove",
    ev_loss: 12.33,
    gto_action: "check",
    user_action: "shove 45",
    hand_text: "PokerStars Hand #123456792: Hero checked river...",
  },
  {
    id: "5",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    spot_category: "flop_donk",
    ev_loss: 0.87,
    gto_action: "call",
    user_action: "fold",
    hand_text: "PokerStars Hand #123456793: Villain donked flop...",
  },
  {
    id: "6",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    spot_category: "river_donk",
    ev_loss: 4.55,
    gto_action: "bet 0.5",
    user_action: "check",
    hand_text: "PokerStars Hand #123456794: Hero checked back river...",
  },
  {
    id: "7",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    spot_category: "turn_check",
    ev_loss: 2.1,
    gto_action: "check",
    user_action: "bet 0.33",
    hand_text: "PokerStars Hand #123456795: Hero bet turn for value...",
  },
  {
    id: "8",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    spot_category: "preflop_4bet",
    ev_loss: 6.78,
    gto_action: "fold",
    user_action: "call",
    hand_text: "PokerStars Hand #123456796: Hero faced 4-bet...",
  },
];

export default function HandsPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_HANDS;
    const q = search.toLowerCase();
    return MOCK_HANDS.filter(
      (h) =>
        h.id.includes(q) ||
        h.spot_category?.toLowerCase().includes(q) ||
        h.hand_text.toLowerCase().includes(q),
    );
  }, [search]);

  const selectedHand = useMemo(
    () => MOCK_HANDS.find((h) => h.id === selectedId) ?? null,
    [selectedId],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/analyze">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Upload
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-poker-gold">Hands</h1>
          <p className="text-sm text-muted-foreground">
            {MOCK_HANDS.length} hands analyzed · sorted by EV loss
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportHandsToCSV(filtered, undefined, generateExportFilename("hands_export"))}
          className="gap-1.5 border-poker-gold/50 text-poker-gold hover:bg-poker-gold/10"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: table */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="border border-gray-800 rounded-lg p-3 bg-gray-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by hand ID, category, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Hand list */}
          <HandTable
            hands={filtered}
            pageSize={15}
            columns={[
              {
                key: "id",
                label: "ID",
                sortable: true,
                render: (h) => (
                  <span className="font-mono text-xs text-muted-foreground">#{h.id}</span>
                ),
              },
              {
                key: "created_at",
                label: "Date",
                sortable: true,
                render: (h) => {
                  try {
                    return (
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    );
                  } catch {
                    return <span className="text-xs text-muted-foreground">—</span>;
                  }
                },
              },
              {
                key: "spot_category",
                label: "Spot",
                sortable: true,
                render: (h) => (
                  <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">
                    {h.spot_category ?? "unknown"}
                  </span>
                ),
              },
              {
                key: "ev_loss",
                label: "EV Loss",
                sortable: true,
                render: (h) => {
                  if (h.ev_loss === null) return <span className="text-muted-foreground">—</span>;
                  return (
                    <span
                      className={`font-mono text-sm ${
                        h.ev_loss > 10
                          ? "text-red-500"
                          : h.ev_loss > 5
                            ? "text-orange-500"
                            : "text-foreground"
                      }`}
                    >
                      {h.ev_loss >= 0 ? "+" : ""}
                      {h.ev_loss.toFixed(2)}
                    </span>
                  );
                },
              },
              {
                key: "actions",
                label: "",
                render: (h) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedId(h.id)}
                      className="p-1.5 rounded hover:bg-secondary transition-colors"
                      title="View hand"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Right: hand viewer + stats */}
        <div className="flex flex-col gap-4">
          {selectedHand ? (
            <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Hand #{selectedHand.id}</h3>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </div>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap bg-secondary/40 rounded p-3 max-h-64 overflow-y-auto">
                {selectedHand.hand_text}
              </pre>
              <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Spot:</span>{" "}
                  <span className="font-medium">{selectedHand.spot_category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">EV Loss:</span>{" "}
                  <span className="font-mono font-medium text-red-400">
                    {selectedHand.ev_loss?.toFixed(2)} bb
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">GTO:</span>{" "}
                  <span className="font-mono text-emerald-400">{selectedHand.gto_action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Your play:</span>{" "}
                  <span className="font-mono text-red-400">{selectedHand.user_action}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-800 rounded-lg flex flex-col items-center justify-center p-8 text-center bg-gray-900/50">
              <Eye className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a hand from the table to preview it here.
              </p>
            </div>
          )}

          {/* Summary stats */}
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Session Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-red-400">
                  {MOCK_HANDS.reduce((sum, h) => sum + (h.ev_loss ?? 0), 0).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Total EV Loss (bb)</div>
              </div>
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-poker-gold">
                  {(
                    MOCK_HANDS.length > 0
                      ? MOCK_HANDS.reduce((sum, h) => sum + (h.ev_loss ?? 0), 0) / MOCK_HANDS.length
                      : 0
                  ).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Avg EV Loss (bb)</div>
              </div>
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-amber-400">
                  {MOCK_HANDS.filter((h) => (h.ev_loss ?? 0) > 5).length}
                </div>
                <div className="text-xs text-muted-foreground">Big Leaks (&gt;5bb)</div>
              </div>
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">{MOCK_HANDS.length}</div>
                <div className="text-xs text-muted-foreground">Total Hands</div>
              </div>
            </div>
          </div>

          <Link href="/analyze/leaks">
            <Button className="w-full bg-poker-gold text-gray-900 hover:bg-poker-gold/90 font-semibold">
              View Full Leak Report
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}