"use client";

import { cn } from "@/lib/utils";
import React from "react";

// ============================================================================
// Types
// ============================================================================

export interface StudCardData {
  rank?: string;
  suit?: string;
  faceUp: boolean;
}

export interface StudPlayerData {
  name: string;
  cards: StudCardData[];
  equity: number;
  isHero: boolean;
}

interface StudHandDisplayProps {
  hero: StudPlayerData;
  villain: StudPlayerData;
  className?: string;
}

// ============================================================================
// Suit Display Helpers
// ============================================================================

const SUIT_SYMBOLS: Record<string, string> = {
  h: "\u2665", d: "\u2666", c: "\u2663", s: "\u2660",
};
const SUIT_IS_RED: Record<string, boolean> = {
  h: true, d: true, c: false, s: false,
};

// ============================================================================
// Stud Card Component
// ============================================================================

function StudCard({ card }: { card: StudCardData }) {
  // Card width/height responsive classes
  if (!card.faceUp) {
    return (
      <div
        className="card-down shrink-0 rounded-lg select-none"
        style={{
          width: 80, height: 112,
          background: "#2d3748",
          backgroundImage: `repeating-linear-gradient(45deg, #252f40 0px, #252f40 3px, #2d3748 3px, #2d3748 6px, #344054 6px, #344054 9px, #2d3748 9px, #2d3748 12px)`,
          border: "1.5px solid #4a5568",
          borderRadius: 8,
          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 3px rgba(0,0,0,0.5), 0 6px 12px rgba(0,0,0,0.5)`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute", inset: 6, borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.05)",
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 5px)`,
          }}
        />
      </div>
    );
  }

  const isRed = SUIT_IS_RED[card.suit || ""] ?? false;
  const sym = SUIT_SYMBOLS[card.suit || ""] || card.suit || "?";
  const rank = card.rank || "?";

  return (
    <div
      className="shrink-0 select-none"
      style={{
        width: 80, height: 112, borderRadius: 8,
        background: "#f7fafc",
        border: "1.5px solid #1a202c",
        color: isRed ? "#e53e3e" : "#1a202c",
        boxShadow: `0 6px 12px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)`,
        position: "relative", flexShrink: 0,
      }}
    >
      {/* Rank top-left */}
      <span style={{ position: "absolute", top: 6, left: 7, fontSize: 15, fontWeight: 800, lineHeight: 1, fontFamily: "'SF Mono', Monaco, monospace", letterSpacing: -0.5 }}>
        {rank}
      </span>
      {/* Center suit */}
      <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 38, lineHeight: 1 }}>
        {sym}
      </span>
      {/* Rank bottom-right (rotated) */}
      <span style={{ position: "absolute", bottom: 6, right: 7, fontSize: 15, fontWeight: 800, lineHeight: 1, fontFamily: "'SF Mono', Monaco, monospace", letterSpacing: -0.5, transform: "rotate(180deg)" }}>
        {rank}
      </span>
    </div>
  );
}

// ============================================================================
// Player Hand (7 cards + info)
// ============================================================================

function PlayerHand({ player, side }: { player: StudPlayerData; side: "top" | "bottom" }) {
  return (
    <div className="flex flex-col items-center gap-4" style={{ zIndex: 2, position: "relative" }}>
      {/* Card row */}
      <div className="flex justify-center gap-[14px] w-full" style={{ flexDirection: "row" }}>
        {player.cards.map((card, i) => (
          <StudCard key={i} card={card} />
        ))}
      </div>
      {/* Player info */}
      <div className="text-center flex flex-col gap-[2px]">
        <div className="text-[11px] tracking-[1.8px] uppercase text-gray-400 font-semibold">
          {player.name}
        </div>
        <div
          className="text-[30px] font-extrabold leading-none tracking-[-0.8px] text-white"
          style={{ textShadow: player.isHero ? "0 0 20px rgba(102,126,234,0.3), 0 2px 12px rgba(0,0,0,0.6)" : "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          {player.equity.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stud Hand Display (main export)
// ============================================================================

export function StudHandDisplay({ hero, villain, className }: StudHandDisplayProps) {
  return (
    <div className={cn("w-full max-w-[900px]", className)} style={{ perspective: 1200 }}>
      <div
        className="relative"
        style={{
          background: "#1a1a2e",
          borderRadius: 28,
          padding: "48px 36px 40px",
          transform: "rotateX(10deg)",
          transformStyle: "preserve-3d",
          boxShadow: `
            inset 0 0 120px rgba(0,0,0,0.75),
            inset 0 0 60px rgba(0,0,0,0.5),
            inset 0 1px 1px rgba(255,255,255,0.05),
            0 30px 60px rgba(0,0,0,0.6),
            0 15px 25px rgba(0,0,0,0.4)
          `,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Radial vignette overlay */}
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Villain (top) */}
        <PlayerHand player={villain} side="top" />

        {/* Divider */}
        <div
          className="relative mx-auto my-9"
          style={{
            height: 1, maxWidth: 640,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)",
          }}
        >
          <div
            style={{
              position: "absolute", left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              width: 80, height: 80,
              background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
              borderRadius: "50%", filter: "blur(10px)",
            }}
          />
        </div>

        {/* Hero (bottom) */}
        <PlayerHand player={hero} side="bottom" />
      </div>
    </div>
  );
}

// ============================================================================
// Helper: create a default Stud hand (2 down, 4 up, 1 down)
// ============================================================================

export function makeDefaultStudHand(
  upCards: Array<{ rank: string; suit: string }>,
  equity: number,
  name: string,
  isHero: boolean = false
): StudPlayerData {
  const cards: StudCardData[] = [
    { faceUp: false },
    { faceUp: false },
    ...upCards.slice(0, 4).map((c) => ({ rank: c.rank, suit: c.suit, faceUp: true })),
    { faceUp: false },
  ];
  // Pad to 7 if needed
  while (cards.length < 7) {
    cards.push({ faceUp: false });
  }
  return { name, cards: cards.slice(0, 7), equity, isHero };
}

export default StudHandDisplay;
