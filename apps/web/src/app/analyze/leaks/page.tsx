/**
 * Leaks — expected value (EV) loss report by spot category.
 * Visualizes the player's biggest leaks compared to GTO baseline.
 */

"use client";

import Link from "next/link";
import { ArrowLeft, TrendingDown, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { LeakChart, MOCK_LEAKS, type LeakEntry } from "@/components/hh";
import { Button } from "@/nous-research/ui/ui/components/button";

// Sorted by delta (leak size), worst first
const SORTED_LEAKS = [...MOCK_LEAKS].sort((a, b) => b.delta - a.delta);

const TOTAL_LEAK_BB = MOCK_LEAKS.reduce((sum, l) => (l.delta > 0 ? l.delta : 0), 0);
const TOTAL_HANDS = 1247; // would come from API in production

function LeakRow({ entry, rank }: { entry: LeakEntry; rank: number }) {
  const isPositiveLeak = entry.delta > 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          rank === 1
            ? "bg-red-500/20 text-red-400"
            : rank === 2
              ? "bg-orange-500/20 text-orange-400"
              : "bg-secondary text-muted-foreground"
        }`}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{entry.category}</span>
          {isPositiveLeak && (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {entry.amount.toFixed(2)} bb/100 actual &middot; {entry.expected.toFixed(2)} bb/100 expected
        </div>
      </div>

      <div className="text-right">
        <div
          className={`font-mono font-semibold text-sm ${
            isPositiveLeak ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {isPositiveLeak ? "+" : ""}
          {entry.delta.toFixed(2)} bb/100
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {isPositiveLeak
            ? `${((entry.delta / (entry.expected || 1)) * 100).toFixed(0)}% above baseline`
            : "below baseline (good)"}
        </div>
      </div>
    </div>
  );
}

export default function LeaksPage() {
  const bigLeaks = SORTED_LEAKS.filter((l) => l.delta > 0.5);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/analyze/hands">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Hands
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-poker-gold">Leak Report</h1>
          <p className="text-sm text-muted-foreground">
            Expected value analysis across {TOTAL_HANDS.toLocaleString()} hands
          </p>
        </div>
      </div>

      {/* Summary banner */}
      <Card className="mb-6 border-red-500/30 bg-red-950/10">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">
              Total EV Loss: {TOTAL_LEAK_BB.toFixed(1)} bb/100
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {bigLeaks.length} significant leak categories &middot; estimated{" "}
              <span className="text-red-400 font-mono">
                ~{(TOTAL_LEAK_BB * (TOTAL_HANDS / 100)).toFixed(1)} bb
              </span>{" "}
              total EV loss in this dataset
            </p>
          </div>
          <Link href="/analyze">
            <Button variant="outline" size="sm" className="border-poker-gold/50 text-poker-gold hover:bg-poker-gold/10">
              Re-analyze
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart — takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Leak by Category (bb/100)</CardTitle>
            <CardDescription>
              Positive values = leaking above expected baseline &middot; Negative = playing under baseline (good)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeakChart data={MOCK_LEAKS} />
          </CardContent>
        </Card>

        {/* Top leaks sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Biggest Leaks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40">
              {bigLeaks.slice(0, 4).map((leak, i) => (
                <LeakRow key={leak.category} entry={leak} rank={i + 1} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-400" />
                Above Baseline (Good)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40">
              {SORTED_LEAKS.filter((l) => l.delta <= 0.5).map((leak, i) => (
                <LeakRow key={leak.category} entry={leak} rank={i + 1} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed breakdown table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Full Breakdown</CardTitle>
          <CardDescription>
            All spot categories with actual vs expected rates and EV delta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actual (bb/100)
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expected (bb/100)
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Delta
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verdict
                </th>
              </tr>
            </thead>
            <tbody>
              {SORTED_LEAKS.map((entry) => {
                const isLeak = entry.delta > 0.5;
                const isMild = entry.delta > 0 && entry.delta <= 0.5;
                return (
                  <tr
                    key={entry.category}
                    className="border-b border-border/40 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">{entry.category}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{entry.amount.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {entry.expected.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        entry.delta > 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {entry.delta > 0 ? "+" : ""}
                      {entry.delta.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isLeak ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400 font-medium">
                          LEAK
                        </span>
                      ) : isMild ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 font-medium">
                          mild
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 font-medium">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bigLeaks.slice(0, 3).map((leak) => (
              <div key={leak.category} className="flex items-start gap-3 p-3 rounded bg-secondary/40">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Focus on{" "}
                    <span className="text-poker-gold">{leak.category.replace(/_/g, " ")}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You&apos;re losing{" "}
                    <span className="text-red-400 font-mono">
                      +{leak.delta.toFixed(2)} bb/100
                    </span>{" "}
                    above expected. Review GTO solutions for this spot type and practice with lower-stakes scenarios
                    to build the correct frequency.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Link href="/analyze/hands">
          <Button variant="outline" className="gap-1.5">
            View Hands
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/analyze">
          <Button className="bg-poker-gold text-gray-900 hover:bg-poker-gold/90 font-semibold gap-1.5">
            Upload New HH
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}