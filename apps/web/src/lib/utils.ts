export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatBoard(boardString: string): {
  flop: [string, string, string] | null;
  turn: string | null;
  river: string | null;
} {
  const cards: string[] = [];
  for (let i = 0; i < boardString.length - 1; i += 2) {
    cards.push(boardString.slice(i, i + 2));
  }
  return {
    flop: cards.length >= 3 ? [cards[0], cards[1], cards[2]] : null,
    turn: cards.length >= 4 ? cards[3] : null,
    river: cards.length >= 5 ? cards[4] : null,
  };
}

export function parseHand(hand: string): { rank1: string; rank2: string; suited: boolean } {
  const ranks = hand.match(/[AKQJT2-9]/g);
  if (!ranks || ranks.length < 2) return { rank1: '', rank2: '', suited: false };
  
  return {
    rank1: ranks[0],
    rank2: ranks[1],
    suited: hand.toLowerCase().includes('s'),
  };
}

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const SUITS = ['h', 'd', 'c', 's'] as const;

export function getHand(row: number, col: number): string {
  const rank1 = RANKS[row];
  const rank2 = RANKS[col];
  if (row === col) return `${rank1}${rank2}`;
  if (col > row) return `${rank1}${rank2}s`;
  return `${rank1}${rank2}o`;
}

export function getHandIndex(hand: string): { row: number; col: number } | null {
  const ranks = hand.match(/[AKQJT2-9]/g);
  if (!ranks || ranks.length < 2) return null;
  
  const rank1 = ranks[0];
  const rank2 = ranks[1];
  const row = RANKS.indexOf(rank1 as typeof RANKS[number]);
  const col = RANKS.indexOf(rank2 as typeof RANKS[number]);
  
  if (row === -1 || col === -1) return null;
  return { row, col };
}