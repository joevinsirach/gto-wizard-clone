"use client";

import { useState, useEffect, useCallback } from "react";
import { variantApi } from "@/lib/api";
import type { VariantInfo, EquityResult } from "@/lib/api";
import { gtoTheme } from "@/styles/gto-tokens";
import { StudHandDisplay, makeDefaultStudHand } from "@/components/stud";
import type { StudPlayerData } from "@/components/stud";

export default function StudEquityPage() {
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [heroRange, setHeroRange] = useState("AA,KK");
  const [villainRange, setVillainRange] = useState("AKs,QQ");
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { variantApi.get("stud").then(setVariant); }, []);

  const calculate = useCallback(async () => {
    if (!heroRange || !villainRange) return;
    setLoading(true); setError(null);
    try {
      const r = await variantApi.equity("stud", heroRange, villainRange);
      if (r) setResult(r); else setError("API returned no data");
    } catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  }, [heroRange, villainRange]);

  // Build stud hand data from result
  const heroHand: StudPlayerData | null = result
    ? makeDefaultStudHand(
        [{ rank: "K", suit: "s" }, { rank: "3", suit: "h" }, { rank: "7", suit: "d" }, { rank: "J", suit: "c" }],
        result.hero_equity, "Hero", true
      )
    : null;

  const villainHand: StudPlayerData | null = result
    ? makeDefaultStudHand(
        [{ rank: "A", suit: "s" }, { rank: "9", suit: "h" }, { rank: "9", suit: "d" }, { rank: "Q", suit: "c" }],
        result.villain_equity ?? (100 - result.hero_equity), "Villain", false
      )
    : null;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">stud</span>
            <span className="text-gray-600">·</span>
            <span className="text-[11px] text-green-500 font-semibold">7 cards · no board</span>
          </div>
          <h1 className="text-2xl font-bold">Seven Card Stud</h1>
          <p className="text-sm text-gray-400 mt-1">Seven-card stud. 3 down, 4 up.</p>
        </div>

        {/* Visual Hand Display */}
        {heroHand && villainHand && (
          <div className="flex justify-center">
            <StudHandDisplay hero={heroHand} villain={villainHand} />
          </div>
        )}

        {/* Input card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Hero Range</label>
              <input
                className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                placeholder="AA,KK,AKs"
                value={heroRange}
                onChange={e => setHeroRange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Villain Range</label>
              <input
                className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                placeholder="QQ,JJ,TT"
                value={villainRange}
                onChange={e => setVillainRange(e.target.value)}
              />
            </div>
          </div>
          <button
            className="px-6 py-2.5 rounded-md border-none font-bold text-sm cursor-pointer bg-green-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
            onClick={calculate}
            disabled={loading || !heroRange || !villainRange}
          >
            {loading ? "Calculating..." : "Calculate Equity"}
          </button>
        </div>

        {/* Raw result display */}
        {result && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-5">
            <h3 className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-4">
              Results · {result.iterations.toLocaleString()} iterations
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold font-mono text-green-500">{result.hero_equity.toFixed(1)}%</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">Hero Equity</div>
              </div>
              {result.villain_equity !== null && (
                <div className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold font-mono text-white">{result.villain_equity.toFixed(1)}%</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">Villain Equity</div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
