/**
 * BoardDisplay — renders poker board cards (flop, turn, river).
 * Supports styled card rendering with back-design for hidden cards.
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
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "T": "T",
  "J": "J",
  "Q": "Q",
  "K": "K",
  "A": "A",
};

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
  className?: string;
}

export function BoardDisplay({
  board,
  hidden = false,
  small = false,
  showLabels = true,
  className,
}: BoardDisplayProps) {
  const cards = [
    ...(board.flop ? board.flop : [null, null, null] as [null, null, null]),
    board.turn,
    board.river,
  ];

  const labels = showLabels ? ["Flop", "Turn", "River"] : [null, null, null];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-col gap-1.5">
        {/* Flop */}
        <div className="flex items-center gap-2">
          {showLabels && (
            <span className="text-xs text-muted-foreground w-8">Flop</span>
          )}
          <div className="flex gap-1.5">
            {cards.slice(0, 3).map((card, i) => (
              <BoardCard
                key={`flop-${i}`}
                card={card}
                hidden={hidden}
                small={small}
              />
            ))}
          </div>
        </div>

        {/* Turn */}
        <div className="flex items-center gap-2">
          {showLabels && (
            <span className="text-xs text-muted-foreground w-8">Turn</span>
          )}
          <BoardCard card={cards[3]} hidden={hidden} small={small} />
        </div>

        {/* River */}
        <div className="flex items-center gap-2">
          {showLabels && (
            <span className="text-xs text-muted-foreground w-8">River</span>
          )}
          <BoardCard card={cards[4]} hidden={hidden} small={small} />
        </div>
      </div>
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

  const toSuitChar = (s: string): Suit => s as Suit;
  const toRankChar = (r: string): Rank => r as Rank;

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