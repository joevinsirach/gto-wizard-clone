/**
 * Analyze — Hand History Viewer.
 * Paste a PokerStars / GGPoker hand history to see a structured,
 * street-by-street breakdown with board, actions and pot tracking.
 */

"use client";

import { useMemo, useState } from "react";
import {
  HandViewer,
  type HandHistory,
  type Action,
  type ActionType,
  type Player,
  type HHCard,
  type StreetName,
} from "@/components/hh";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// PokerStars HH parser
// ---------------------------------------------------------------------------

const RANK_MAP: Record<string, string> = {
  A: "A", K: "K", Q: "Q", J: "J", T: "T",
  "9": "9", "8": "8", "7": "7", "6": "6", "5": "5",
  "4": "4", "3": "3", "2": "2",
};

const SUIT_MAP: Record<string, string> = {
  h: "h", d: "d", c: "c", s: "s",
  "♥": "h", "♦": "d", "♣": "c", "♠": "s",
};

function parseCard(token: string): HHCard | null {
  const t = token.trim().replace(/[♥♦♣♠]/g, (m) => SUIT_MAP[m] ?? m);
  const rank = RANK_MAP[t[0]?.toUpperCase()];
  const suit = t[1]?.toLowerCase();
  if (rank && (suit === "h" || suit === "d" || suit === "c" || suit === "s")) {
    return { rank, suit };
  }
  return null;
}

function parseCards(text: string): HHCard[] {
  // Match patterns like "Ah", "Kd", "10s", "♥A" etc.
  const tokens = text.match(/[AKQJT2-9][hdcs♥♦♣♠]/g) ?? [];
  return tokens.map(parseCard).filter((c): c is HHCard => c !== null);
}

/** Very simple PokerStars-format parser. Handles the most common patterns. */
function parseHandHistory(raw: string): HandHistory | null {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  // --- Header line ---
  // "PokerStars Hand #12345678901:  Hold'em No Limit ($0.50/$1.00) - 2024/01/15 12:00:00 ET"
  const header = lines[0];
  const handIdMatch = header.match(/Hand #(\d+)/);
  const handId = handIdMatch?.[1] ?? "unknown";

  const gameType = header.includes("Hold'em") ? "Hold'em" :
    header.includes("Omaha") ? "Omaha" : "Hold'em";
  const limit = header.includes("No Limit") ? "No Limit" :
    header.includes("Pot Limit") ? "Pot Limit" : "Fixed Limit";

  const dateMatch = header.match(/-\s+(\d{4}\/\d{2}\/\d{2})/);
  const date = dateMatch?.[1] ?? new Date().toISOString().slice(0, 10);

  // --- Players ---
  // "Seat 1: PlayerName ($100.00 in chips)"
  const players: Player[] = [];
  let buttonSeat = 1;
  const seatToName: Record<string, string> = {};

  for (const line of lines) {
    const seatMatch = line.match(/^Seat\s+(\d+):\s+(.+?)\s+\([\d.]+ in chips\)/);
    if (seatMatch) {
      const seat = parseInt(seatMatch[1]);
      const name = seatMatch[2].trim();
      seatToName[seat] = name;
      continue;
    }
    if (line.startsWith("Button is seat")) {
      const m = line.match(/seat #(\d+)/);
      if (m) buttonSeat = parseInt(m[1]);
    }
  }

  // If no "Button is seat" line, try "Dealt to" or just use seat 1
  if (Object.keys(seatToName).length > 0) {
    for (const [seat, name] of Object.entries(seatToName)) {
      players.push({
        name,
        seat: parseInt(seat),
        stack: 100,
        isHero: false,
      });
    }
  } else {
    // Fallback: try to extract player names from "Player: action" patterns
    const nameSet = new Set<string>();
    for (const line of lines) {
      const m = line.match(/^([^:]+):\s+(folds|checks|calls|bets|raises|posts)/);
      if (m) nameSet.add(m[1].trim());
    }
    let seat = 1;
    for (const name of nameSet) {
      players.push({ name, seat: seat++, stack: 100, isHero: false });
    }
  }

  if (players.length < 2) return null;

  // Mark hero (first "Dealt to" line)
  for (const line of lines) {
    const dealtMatch = line.match(/Dealt to (.+?)\s+\[/);
    if (dealtMatch) {
      const heroName = dealtMatch[1].trim();
      const hero = players.find((p) => p.name === heroName);
      if (hero) hero.isHero = true;
      break;
    }
  }

  // --- Actions ---
  const actions: Action[] = [];
  let pot = 0;
  let currentStreet: StreetName = "preflop";
  let boardCards: HHCard[] = [];

  // Detect board cards from summary lines
  // "Board [Ks Kc 3h 7d Ah]"
  const boardLine = lines.find((l) => l.startsWith("Board ["));
  if (boardLine) {
    const boardMatch = boardLine.match(/Board\s+\[(.+?)\]/);
    if (boardMatch) {
      boardCards = parseCards(boardMatch[1]);
    }
  }

  const STREET_NAMES: StreetName[] = ["preflop", "flop", "turn", "river"];

  for (const line of lines) {
    // Street transitions
    const flopMatch = line.match(/^\*\*\* FLOP \*\*\* \[(.+?)\]/);
    if (flopMatch) {
      currentStreet = "flop";
      const flopCards = parseCards(flopMatch[1]);
      boardCards = [...flopCards];
      continue;
    }
    const turnMatch = line.match(/^\*\*\* TURN \*\*\* \[.+?\] \[(.+?)\]/);
    if (turnMatch) {
      currentStreet = "turn";
      const turnCard = parseCard(turnMatch[1]);
      if (turnCard) boardCards = [...boardCards.slice(0, 3), turnCard];
      continue;
    }
    const riverMatch = line.match(/^\*\*\* RIVER \*\*\* \[.+?\] \[(.+?)\]/);
    if (riverMatch) {
      currentStreet = "river";
      const riverCard = parseCard(riverMatch[1]);
      if (riverCard) boardCards = [...boardCards.slice(0, 4), riverCard];
      continue;
    }

    // Skip non-action lines
    if (line.startsWith("***") || line.startsWith("Board") || line.startsWith("Seat")
      || line.startsWith("PokerStars") || line.startsWith("Button")
      || line.startsWith("Dealt to") || line.startsWith("Total pot")
      || line.startsWith("Rake") || line.startsWith("*** SUMMARY ***")
      || line.startsWith("Table ")) continue;

    // Player actions: "PlayerName: folds", "PlayerName: bets 10", etc.
    const actionMatch = line.match(/^(.+?):\s+(folds?|checks?|calls?|bets?|raises?|posts?|antes?)\s*([\d.]*)/);
    if (actionMatch) {
      const playerName = actionMatch[1].trim();
      const raw = actionMatch[2].toLowerCase();
      const amount = actionMatch[3] ? parseFloat(actionMatch[3]) : undefined;

      // Normalize to ActionType singular
      const actionMap: Record<string, ActionType> = {
        fold: "fold", folds: "fold",
        check: "check", checks: "check",
        call: "call", calls: "call",
        bet: "bet", bets: "bet",
        raise: "raise", raises: "raise",
        post: "post", posts: "post",
        ante: "ante", antes: "ante",
      };
      const actionType = actionMap[raw] ?? (raw as ActionType);

      // Skip blinds posting as primary actions (they're setup, not decisions)
      if (actionType === "post") {
        pot += amount ?? 0;
        continue;
      }

      actions.push({
        type: actionType,
        player: playerName,
        amount,
        street: currentStreet,
        potAfter: pot,
      });

      if (actionType === "bet" || actionType === "raise") {
        pot += amount ?? 0;
      } else if (actionType === "call") {
        pot += amount ?? 0;
      }
    }
  }

  // Attach board cards to hero's hole cards if we found "Dealt to"
  for (const line of lines) {
    const dealtMatch = line.match(/Dealt to (.+?)\s+\[(.+?)\]/);
    if (dealtMatch) {
      const heroName = dealtMatch[1].trim();
      const cards = parseCards(dealtMatch[2]);
      const hero = players.find((p) => p.name === heroName);
      if (hero && cards.length >= 2) {
        hero.cards = [cards[0], cards[1]];
      }
      break;
    }
  }

  // If no actions parsed, return null
  if (actions.length === 0) return null;

  return {
    id: handId,
    gameType,
    limit,
    date,
    hero: players.find((p) => p.isHero)?.name ?? players[0].name,
    buttonSeat,
    players,
    actions,
    result: {
      showdown: lines.some((l) => l.includes("showed") || l.includes("collected")),
      pot,
    },
  };
}

// ---------------------------------------------------------------------------
// Sample hand for quick demo
// ---------------------------------------------------------------------------

const SAMPLE_HAND = `PokerStars Hand #24987654321:  Hold'em No Limit ($0.50/$1.00) - 2026/06/19 14:30:00 ET
Table 'Andromeda' 6-max Seat #1 is the button
Seat 1: Hero ($100.00 in chips)
Seat 2: Villain1 ($98.50 in chips)
Seat 3: Villain2 ($102.00 in chips)
Seat 4: Villain3 ($99.00 in chips)
Seat 5: Villain4 ($100.50 in chips)
Seat 6: Villain5 ($97.00 in chips)
Hero: posts small blind $0.50
Villain1: posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Ah Kh]
Villain2: folds
Villain3: raises $3.00 to $3.00
Villain4: folds
Villain5: calls $3.00
Hero: calls $2.50
Villain1: folds
*** FLOP *** [Ks 7c 3d]
Hero: checks
Villain3: bets $4.50
Villain5: folds
Hero: calls $4.50
*** TURN *** [Ks 7c 3d] [5h]
Hero: checks
Villain3: bets $8.00
Hero: calls $8.00
*** RIVER *** [Ks 7c 3d 5h] [2s]
Hero: checks
Villain3: bets $16.00
Hero: folds
*** SUMMARY ***
Total pot $48.00 | Rake $2.00
Board [Ks 7c 3d 5h 2s]
Seat 3: Villain3 collected ($46.00)`;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HandViewerPage() {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hand = useMemo<HandHistory | null>(() => {
    if (!raw.trim()) return null;
    setError(null);
    try {
      const parsed = parseHandHistory(raw);
      if (!parsed) {
        setError("Could not parse hand history. Make sure it's in PokerStars format.");
      }
      return parsed;
    } catch (e) {
      setError(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }, [raw]);

  const handleLoadSample = () => {
    setRaw(SAMPLE_HAND);
    setError(null);
  };

  const handleClear = () => {
    setRaw("");
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-poker-gold">Hand History Viewer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a PokerStars or GGPoker hand history below to see a structured street-by-street breakdown.
        </p>
      </div>

      {/* Input area */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-poker-gold" />
              Hand History Input
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                className="text-xs"
              >
                Load Sample
              </Button>
              {raw && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Paste a hand history here, e.g.:\n\nPokerStars Hand #123456789: Hold'em No Limit ($0.50/$1.00) - ...\n...\n*** FLOP *** [Ks 7c 3d]\nHero: checks\n...`}
            className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500 resize-y"
            spellCheck={false}
          />
          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Hand viewer */}
      {hand ? (
        <HandViewer hand={hand} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Paste a hand history above to view the structured breakdown.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Supports PokerStars and GGPoker text format.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="mt-4"
            >
              Try with sample hand
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
