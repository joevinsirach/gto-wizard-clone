"use client";

import { useState, useEffect, useCallback } from "react";
import { variantApi } from "@/lib/api";
import type { VariantInfo, EquityResult } from "@/lib/api";
import { StudHandDisplay, makeDefaultStudHand } from "@/components/stud";
import type { StudPlayerData } from "@/components/stud";
import { CardSelectorGrid, selectedCardsToRange, cardsToHandDisplay } from "@/components/CardSelector";
import type { CardSelection } from "@/components/CardSelector";

const MAX_RAZZ_CARDS = 7;

export default function RazzEquityPage() {
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [heroCards, setHeroCards] = useState<CardSelection[]>([]);
  const [villainCards, setVillainCards] = useState<CardSelection[]>([]);
  const [heroRangeText, setHeroRangeText] = useState("");
  const [villainRangeText, setVillainRangeText] = useState("");
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRangeInput, setUseRangeInput] = useState(false);

  useEffect(() => { variantApi.get("razz").then(setVariant); }, []);

  const getHeroRange = useCallback(() => {
    if (useRangeInput) return heroRangeText;
    return selectedCardsToRange(heroCards) || "A2,A3";
  }, [useRangeInput, heroRangeText, heroCards]);

  const getVillainRange = useCallback(() => {
    if (useRangeInput) return villainRangeText;
    return selectedCardsToRange(villainCards) || "KQ,JT";
  }, [useRangeInput, villainRangeText, villainCards]);

  const calculate = useCallback(async () => {
    const hero = getHeroRange();
    const villain = getVillainRange();
    if (!hero || !villain) return;
    setLoading(true); setError(null);
    try {
      const r = await variantApi.equity("razz", hero, villain);
      if (r) setResult(r); else setError("API returned no data");
    } catch (e: unknown) { setError(String(e)); }
    finally { setLoading(false); }
  }, [getHeroRange, getVillainRange]);

  // Build stud hand display from selected cards
  const handDisplayCards = cardsToHandDisplay(heroCards);
  const heroHand: StudPlayerData | null = handDisplayCards.length >= 3 && result
    ? makeDefaultStudHand(handDisplayCards, result.hero_equity, "Hero", true)
    : null;

  const villHandDisplayCards = cardsToHandDisplay(villainCards);
  const villainHand: StudPlayerData | null = villHandDisplayCards.length >= 3 && result
    ? makeDefaultStudHand(villHandDisplayCards, result.villain_equity ?? (100 - result.hero_equity), "Villain", false)
    : null;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">stud</span>
            <span className="text-gray-600">·</span>
            <span className="text-[11px] text-green-500 font-semibold">7 cards · no board</span>
          </div>
          <h1 className="text-2xl font-bold">Razz</h1>
          <p className="text-sm text-gray-400 mt-1">Ace-to-five lowball stud. Select up to 7 cards per player.</p>
        </div>

        {/* Visual Hand Display */}
        {heroHand && villainHand && (
          <div className="flex justify-center">
            <StudHandDisplay hero={heroHand} villain={villainHand} />
          </div>
        )}

        {/* Card selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSelectorGrid
            maxCards={MAX_RAZZ_CARDS}
            selected={heroCards}
            onChange={setHeroCards}
            label="Hero Cards (up to 7)"
          />
          <CardSelectorGrid
            maxCards={MAX_RAZZ_CARDS}
            selected={villainCards}
            onChange={setVillainCards}
            label="Villain Cards (up to 7)"
          />
        </div>

        {/* Toggle: range text input */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseRangeInput(!useRangeInput)}
            className="text-[11px] text-gray-400 hover:text-gray-200 underline underline-offset-2"
          >
            {useRangeInput ? "Use card selector" : "Or enter ranges manually"}
          </button>
        </div>

        {useRangeInput && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Hero Range</label>
                <input className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                  placeholder="A2,A3" value={heroRangeText} onChange={e => setHeroRangeText(e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Villain Range</label>
                <input className="w-full px-3 py-2.5 rounded-md border border-gray-700 bg-[#16213e] text-white text-sm font-mono outline-none focus:border-green-500 transition-colors"
                  placeholder="KQ,JT" value={villainRangeText} onChange={e => setVillainRangeText(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <button className="px-6 py-2.5 rounded-md border-none font-bold text-sm cursor-pointer bg-green-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-colors"
          onClick={calculate} disabled={loading || (!useRangeInput && heroCards.length < 2 && villainCards.length < 2)}>
          {loading ? "Calculating..." : "Calculate Equity"}
        </button>

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
