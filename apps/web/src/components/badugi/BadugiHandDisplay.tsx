"use client";

import { cn } from "@/lib/utils";
import React from "react";

// ============================================================================
// Types
// ============================================================================

export interface BadugiCardData {
  rank: string;
  suit: string;
}

export interface BadugiPlayerData {
  name: string;
  cards: (BadugiCardData | null)[];  // null = empty slot (partial hand)
  equity: number;
  isHero: boolean;
}

interface BadugiHandDisplayProps {
  hero: BadugiPlayerData;
  villain: BadugiPlayerData;
  className?: string;
}

// ============================================================================
// Suit helpers
// ============================================================================

const SUIT_SYMBOLS: Record<string, string> = {
  h: "♥", d: "♦", c: "♣", s: "♠",
};
const SUIT_IS_RED: Record<string, boolean> = {
  h: true, d: true, c: false, s: false,
};

// ============================================================================
// Badugi Card
// ============================================================================

function BadugiCard({ card }: { card: BadugiCardData | null }) {
  // Empty slot
  if (card === null) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: 72, height: 100, borderRadius: 10,
          border: "2px dashed #3a3a5a",
          flexShrink: 0, opacity: 0.7,
        }}
      />
    );
  }

  const isRed = SUIT_IS_RED[card.suit] ?? false;
  const sym = SUIT_SYMBOLS[card.suit] || card.suit;

  return (
    <div
      style={{
        width: 72, height: 100, borderRadius: 10,
        background: "linear-gradient(180deg, #23233a 0%, #1c1c2d 100%)",
        border: "1px solid #3a3a5a",
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.06),
          inset 0 -14px 22px rgba(0,0,0,0.35),
          0 6px 14px rgba(0,0,0,0.28)
        `,
        position: "relative", flexShrink: 0,
        color: isRed ? "#ff4d5a" : "#e6e6e6",
        userSelect: "none",
      }}
    >
      {/* Rank top-left */}
      <span
        style={{
          position: "absolute", top: 7, left: 9,
          fontSize: 26, fontWeight: 700, lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {card.rank}
      </span>
      {/* Suit bottom-right */}
      <span
        style={{
          position: "absolute", bottom: 6, right: 9,
          fontSize: 28, lineHeight: 1,
        }}
      >
        {sym}
      </span>
    </div>
  );
}

// ============================================================================
// Player Hand (4 cards + name + equity)
// ============================================================================

function BadugiPlayer({ player, side }: { player: BadugiPlayerData; side: "top" | "bottom" }) {
  return (
    <div className={cn("player", player.isHero ? "hero" : "villain")} style={{ position: "relative" }}>
      <div
        className="hand"
        style={{
          display: "flex", gap: 8, justifyContent: "center", alignItems: "center",
        }}
      >
        {player.cards.map((card, i) => (
          <BadugiCard key={i} card={card} />
        ))}
      </div>
      <div
        style={{
          textAlign: "center", marginTop: 12,
          fontSize: 12, letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: "0.1em" }}>
          {player.name}
        </span>
        <span style={{ color: "#9aa0b5", fontWeight: 500 }}>
          {" · "}{player.equity.toFixed(0)}% equity
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Badugi Hand Display (main export)
// ============================================================================

export function BadugiHandDisplay({ hero, villain, className }: BadugiHandDisplayProps) {
  return (
    <div className={cn("w-full max-w-[360px]", className)}>
      <div
        className="badugi-table"
        style={{
          background: "#1a1a2e",
          borderRadius: 24, padding: "22px 18px 26px",
          boxShadow: `
            0 30px 60px rgba(0,0,0,0.55),
            0 2px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.04),
            inset 0 0 0 1px rgba(255,255,255,0.05)
          `,
          border: "1px solid #2a2b46",
          position: "relative",
        }}
      >
        {/* Purple radial gradient overlay */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 24,
            background: "radial-gradient(120% 80% at 50% 0%, rgba(82,78,144,0.18), transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Game label */}
        <div
          style={{
            textAlign: "center", color: "#6d7292",
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            marginBottom: 14,
            position: "relative", zIndex: 1,
          }}
        >
          Badugi
        </div>

        {/* Villain (top) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <BadugiPlayer player={villain} side="top" />
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1, margin: "22px 10px",
            background: "linear-gradient(90deg, transparent, rgba(90,95,130,0.5), transparent)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              width: 44, height: 1,
              background: "rgba(154,160,181,0.15)",
              filter: "blur(3px)",
            }}
          />
        </div>

        {/* Hero (bottom) */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <BadugiPlayer player={hero} side="bottom" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers: create default badugi hands
// ============================================================================

export function makeBadugiHand(
  upCards: Array<{ rank: string; suit: string }>,
  equity: number,
  name: string,
  isHero: boolean = false
): BadugiPlayerData {
  const cards: (BadugiCardData | null)[] = upCards.slice(0, 4).map(c => ({ rank: c.rank, suit: c.suit }));
  while (cards.length < 4) cards.push(null);
  return { name, cards, equity, isHero };
}

export default BadugiHandDisplay;
