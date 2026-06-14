"use client";

import { useState, useEffect, useCallback } from "react";
import { variantApi } from "@/lib/api";
import type { VariantInfo, EquityResult } from "@/lib/api";
import { BadugiHandDisplay, makeBadugiHand } from "@/components/badugi";
import type { BadugiPlayerData } from "@/components/badugi";

export default function BadugiEquityPage() {
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [heroRange, setHeroRange] = useState("A2,AK");
  const [villainRange, setVillainRange] = useState("KQ,KJ");
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { variantApi.get("badugi").then(setVariant); }, []);

  const calculate = useCallback(async () => {
    if (!heroRange || !villainRange) return;
    setLoading(true); setError(null);
    try {
      const r = await variantApi.equity("badugi", heroRange, villainRange);
      if (r) setResult(r); else setError("API returned no data");
    } catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  }, [heroRange, villainRange]);

  const heroHand: BadugiPlayerData | null = result
    ? makeBadugiHand(
        [{ rank: "A", suit: "s" }, { rank: "2", suit: "h" }, { rank: "3", suit: "d" }, { rank: "4", suit: "c" }],
        result.hero_equity, "Hero", true
      )
    : null;

  const villainHand: BadugiPlayerData | null = result
    ? makeBadugiHand(
        [{ rank: "K", suit: "h" }, { rank: "7", suit: "h" }, { rank: "5", suit: "s" }],
        result.villain_equity ?? (100 - result.hero_equity), "Villain", false
      )
    : null;

  if (!variant) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading variant...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">draw</span>
            <span className="text-gray-600">·</span>
            <span className="text-[11px] text-green-500 font-semibold">4 cards · no board</span>
          </div>
          <h1 className="text-2xl font-bold">Badugi</h1>
          <p className="text-sm text-gray-400 mt-1">Badugi. Best 1-4 card rainbow hand wins.</p>
        </div>

        {/* Visual Badugi hand display */}
        {heroHand && villainHand && (
          <div className="flex justify-center">
            <BadugiHandDisplay hero={heroHand} villain={villainHand} />
          </div>
        )}

        {/* Input card */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Hero Range</label>
              <input className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                placeholder="A2,AK" value={heroRange} onChange={e => setHeroRange(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Villain Range</label>
              <input className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                placeholder="KQ,KJ" value={villainRange} onChange={e => setVillainRange(e.target.value)} />
            </div>
          </div>
          <button className="px-6 py-2.5 rounded-md border-none font-bold text-sm cursor-pointer bg-green-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
            onClick={calculate} disabled={loading || !heroRange || !villainRange}>
            {loading ? "Calculating..." : "Calculate Equity"}
          </button>
        </div>

        {/* Results */}
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
