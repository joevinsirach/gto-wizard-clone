/**
 * Enhanced BoardDisplay — renders poker board cards with texture analysis.
 * Supports styled card rendering, board texture labels (paired, suited, rainbow, connected).
 */

import { cn } from "@/lib/utils";

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface BoardCards {
  flop: [Card, Card, Card] | null;
  turn: Card | null;
  river: Card | null;
}

const SUIT_COLORS: Record<Suit, string> = {
  "♠": "text-foreground",
  "♥": "text-red-500",
  "♦": "text-orange-500",
  "♣": "text-foreground",
};

const RANK_DISPLAY: Record<Rank, string> = {
  "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  "T": "T", "J": "J", "Q": "Q", "K": "K", "A": "A",
};

// All 5 board cards for texture analysis (0-4: flop x3, turn, river)
export type BoardTextureCard = {
  rank: string;
  suit: string;
};

export type BoardTextureResult = {
  isPaired: boolean;       // any rank appears twice on board
  isTripled: boolean;      // any rank appears 3 times (possible on board)
  isSuited: boolean;       // 3+ cards of same suit
  isRainbow: boolean;      // all different suits
  isConnected: boolean;     // 3+ sequential ranks
  isDoubleConnected: boolean; // 4+ sequential ranks
  hasGaps: string;         // e.g. "JT9" (connected), "JT8" (1-gap), "J97" (1-gap)
  highCard: string;
  textures: string[];      // human-readable labels
};

export function analyzeBoardTexture(cards: BoardTextureCard[]): BoardTextureResult {
  if (!cards || cards.length === 0) {
    return {
      isPaired: false,
      isTripled: false,
      isSuited: false,
      isRainbow: false,
      isConnected: false,
      isDoubleConnected: false,
      hasGaps: "",
      highCard: "",
      textures: [],
    };
  }

  const ranks = cards.map((c) => c.rank);
  const suits = cards.map((c) => c.suit);

  // Count ranks and suits
  const rankCount: Record<string, number> = {};
  const suitCount: Record<string, number> = {};
  ranks.forEach((r) => { rankCount[r] = (rankCount[r] || 0) + 1; });
  suits.forEach((s) => { suitCount[s] = (suitCount[s] || 0) + 1; });

  const isPaired = Object.values(rankCount).some((v) => v >= 2);
  const isTripled = Object.values(rankCount).some((v) => v >= 3);
  const isSuited = Object.values(suitCount).some((v) => v >= 3);
  const isRainbow = Object.values(suitCount).every((v) => v === 1);

  // Rank ordering helpers
  const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
  const rankValues = ranks
    .map((r) => RANK_ORDER.indexOf(r))
    .sort((a, b) => a - b);

  const isConnected = rankValues.length >= 3 &&
    rankValues.slice(1).every((v, i) => v - rankValues[i] === 1);

  const isDoubleConnected = rankValues.length >= 4 &&
    rankValues.slice(1).every((v, i) => v - rankValues[i] === 1);

  // Determine gap pattern
  let gaps = "";
  if (rankValues.length >= 3) {
    if (isConnected) {
      gaps = "connected";
    } else if (isDoubleConnected) {
      gaps = "double-connected";
    } else {
      const diffs = rankValues.slice(1).map((v, i) => v - rankValues[i]);
      const oneGap = diffs.some((d) => d === 2);
      gaps = oneGap ? "1-gap" : "2+ gaps";
    }
  }

  const highCard = ranks.length > 0 ? [...ranks].sort((a, b) =>
    RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b)
  ).at(-1) ?? "" : "";

  // Build texture labels
  const textures: string[] = [];
  if (isTripled) textures.push("tripped board");
  else if (isPaired) textures.push("paired board");
  if (isSuited) textures.push("suited");
  if (isRainbow) textures.push("rainbow");
  if (isConnected) textures.push("connected");
  if (isDoubleConnected) textures.push("double-connected");
  if (gaps && gaps !== "connected" && gaps !== "double-connected") textures.push(gaps);
  if (highCard) textures.push(`high ${highCard}`);

  return {
    isPaired,
    isTripled,
    isSuited,
    isRainbow,
    isConnected,
    isDoubleConnected,
    hasGaps: gaps,
    highCard,
    textures,
  };
}

interface CardProps {
  card: Card | null;
  hidden?: boolean;
  small?: boolean;
  className?: string;
}

export function BoardCard({ card, hidden = false, small = false, className }: CardProps) {
  if (hidden || !card) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border-2 border-dashed border-border bg-secondary/30",
          small ? "w-8 h-10 text-xs" : "w-12 h-16 text-sm",
          className,
        )}
      >
        <span className="text-muted-foreground/50">?</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded border-2 border-border bg-background shadow-sm",
        small ? "w-8 h-10 text-xs" : "w-12 h-16 text-sm",
        className,
      )}
    >
      <span className={cn("font-bold leading-none", SUIT_COLORS[card.suit])}>
        {RANK_DISPLAY[card.rank]}
      </span>
      <span className={cn("leading-none mt-[-2px]", SUIT_COLORS[card.suit])}>
        {card.suit}
      </span>
    </div>
  );
}

interface BoardDisplayProps {
  board: BoardCards;
  hidden?: boolean;
  small?: boolean;
  showLabels?: boolean;
  showTexture?: boolean;
  className?: string;
}

export function BoardDisplay({
  board,
  hidden = false,
  small = false,
  showLabels = true,
  showTexture = false,
  className,
}: BoardDisplayProps) {
  const cards = [
    ...(board.flop ? board.flop : [null, null, null] as [null, null, null]),
    board.turn,
    board.river,
  ];

  const labels = showLabels ? ["Flop", "Turn", "River"] : [null, null, null];

  // Compute texture if requested
  const texture = showTexture
    ? analyzeBoardTexture(cards.filter((c): c is Card => c !== null) as BoardTextureCard[])
    : null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-col gap-1.5">
        {/* Flop */}
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground w-8">Flop</span>}
          <div className="flex gap-1.5">
            {cards.slice(0, 3).map((card, i) => (
              <BoardCard key={`flop-${i}`} card={card} hidden={hidden} small={small} />
            ))}
          </div>
        </div>

        {/* Turn */}
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground w-8">Turn</span>}
          <BoardCard card={cards[3]} hidden={hidden} small={small} />
        </div>

        {/* River */}
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground w-8">River</span>}
          <BoardCard card={cards[4]} hidden={hidden} small={small} />
        </div>
      </div>

      {/* Texture labels */}
      {texture && texture.textures.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {texture.textures.map((t) => (
            <span
              key={t}
              className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 capitalize"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact inline board for use in table cells
interface InlineBoardProps {
  board: BoardCards | null;
  className?: string;
}

export function InlineBoard({ board, className }: InlineBoardProps) {
  if (!board) return null;

  const formatCard = (card: Card | null) => {
    if (!card) return "..";
    return `${card.rank}${card.suit}`;
  };

  const parts: string[] = [];

  if (board.flop) {
    parts.push(
      `${formatCard(board.flop[0])} ${formatCard(board.flop[1])} ${formatCard(board.flop[2])}`,
    );
  }
  if (board.turn) parts.push(`| ${formatCard(board.turn)}`);
  if (board.river) parts.push(`| ${formatCard(board.river)}`);

  return (
    <span className={cn("font-mono text-xs text-muted-foreground", className)}>
      {parts.join(" ")}
    </span>
  );
}

// Board texture badge component for use in hand lists
interface BoardTextureBadgeProps {
  texture: BoardTextureResult;
  className?: string;
}

export function BoardTextureBadge({ texture, className }: BoardTextureBadgeProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {texture.textures.map((t) => (
        <span
          key={t}
          className="inline-block px-1 py-0.5 rounded text-[10px] bg-secondary/60 text-muted-foreground border border-border/50 capitalize"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
