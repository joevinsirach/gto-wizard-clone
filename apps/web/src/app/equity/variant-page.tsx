"use client";

import { useState, useEffect, useCallback } from "react";
import { variantApi } from "@/lib/api";
import type { VariantInfo, EquityResult } from "@/lib/api";
import { gtoTheme } from "@/styles/gto-tokens";

interface Props { variantKey: string }

export default function VariantEquityPage({ variantKey }: Props) {
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [heroRange, setHeroRange] = useState("");
  const [villainRange, setVillainRange] = useState("");
  const [board, setBoard] = useState("");
  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { variantApi.get(variantKey).then(setVariant); }, [variantKey]);

  const calculate = useCallback(async () => {
    if (!heroRange || !villainRange) return;
    setLoading(true); setError(null);
    try {
      const r = await variantApi.equity(variantKey, heroRange, villainRange, board);
      if (r) setResult(r); else setError("API returned no data");
    } catch (e: any) { setError(String(e)); }
    finally { setLoading(false); }
  }, [variantKey, heroRange, villainRange, board]);

  if (!variant) return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading variant...</div>
    </div>
  );

  return (
    <div style={{ background: gtoTheme.felt, minHeight: "100vh", color: "#fff" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: gtoTheme.text.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              {variant.category}
            </span>
            <span style={{ fontSize: 11, color: gtoTheme.text.muted }}>·</span>
            <span style={{ fontSize: 11, color: gtoTheme.greenAccent, fontWeight: 600 }}>
              {variant.hole_count} cards{variant.board_count > 0 ? " · " + variant.board_count + " board" : " · no board"}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{variant.name}</h1>
          {variant.description && (
            <p style={{ fontSize: 13, color: gtoTheme.text.secondary, marginTop: 4 }}>{variant.description}</p>
          )}
        </div>

        <div style={{ background: gtoTheme.surface, borderRadius: 8, border: "1px solid " + gtoTheme.border, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: gtoTheme.text.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Hero Range</label>
              <input style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid " + gtoTheme.border, background: gtoTheme.feltLight, color: "#fff", fontSize: 14, fontFamily: "monospace", outline: "none" }}
                placeholder="AA,KK,AKs" value={heroRange} onChange={e => setHeroRange(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: gtoTheme.text.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Villain Range</label>
              <input style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid " + gtoTheme.border, background: gtoTheme.feltLight, color: "#fff", fontSize: 14, fontFamily: "monospace", outline: "none" }}
                placeholder="QQ,JJ,TT" value={villainRange} onChange={e => setVillainRange(e.target.value)} />
            </div>
          </div>
          {variant.category === "flop" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: gtoTheme.text.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Board (optional)</label>
              <input style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid " + gtoTheme.border, background: gtoTheme.feltLight, color: "#fff", fontSize: 14, fontFamily: "monospace", outline: "none" }}
                placeholder="AhKhQh" value={board} onChange={e => setBoard(e.target.value)} />
            </div>
          )}
          <button style={{ padding: "10px 24px", borderRadius: 6, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", background: gtoTheme.greenAccent, color: "#000" }}
            onClick={calculate} disabled={loading || !heroRange || !villainRange}>
            {loading ? "Calculating..." : "Calculate Equity"}
          </button>
        </div>

        {result && (
          <div style={{ background: gtoTheme.surface, borderRadius: 8, border: "1px solid " + gtoTheme.border, padding: 20 }}>
            <h3 style={{ fontSize: 11, color: gtoTheme.text.muted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 16 }}>
              Results · {result.iterations.toLocaleString()} iterations
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ResultBox label="Hero Equity" value={result.hero_equity.toFixed(1) + "%"} color={gtoTheme.stat.positive} />
              {result.villain_equity !== null && <ResultBox label="Villain Equity" value={result.villain_equity.toFixed(1) + "%"} color={gtoTheme.text.primary} />}
            </div>
          </div>
        )}
        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 16 }}>{error}</p>}

        <div style={{ marginTop: 24, padding: 16, border: "1px dashed " + gtoTheme.border, borderRadius: 8, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: gtoTheme.text.muted, margin: 0 }}>
            ✦ Visual hand display coming next
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: gtoTheme.felt, borderRadius: 8, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color }}>{value}</div>
      <div style={{ fontSize: 10, color: gtoTheme.text.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{label}</div>
    </div>
  );
}
