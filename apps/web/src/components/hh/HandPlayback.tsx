/**
 * HandPlayback — step-by-step hand history player.
 * Fetches a hand from GET /api/v1/hh/hands/{hand_id} and renders each street
 * with Previous/Next navigation, pot updates, and a GTO comparison sidebar.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import { api, type HHHand } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export type StreetName = "preflop" | "flop" | "turn" | "river";

export interface HHAction {
  type: "fold" | "check" | "call" | "bet" | "raise" | "all-in" | "post" | "ante";
  player: string;
  amount?: number; // in big blinds (or pot units)
  street: StreetName;
  potAfter?: number;
}

export interface HHPlayer {
  name: string;
  seat: number;
  stack: number;       // big blinds
  cards?: [HHCard, HHCard];
  isHero?: boolean;
}

export interface HHCard {
  rank: string; // "A","K","Q","J","T","9"…"2"
  suit: string; // "h","d","c","s"
}

export interface GTOComparison {
  recommendedAction: string;
  evDiff: number;   // bb vs GTO
  equity: number;   // hand equity %
}

export interface HandDetail {
  id: string;
  hand_id: string;
  gameType: string;
  limit: string;
  date: string;
  hero: string;
  buttonSeat: number;
  players: HHPlayer[];
  actions: HHAction[];
  board: HHCard[];
  pot: number;
  result?: {
    showdown: boolean;
    pot: number;
    winner?: string;
    summary?: string;
  };
  gtoComparison?: {
    [player: string]: GTOComparison;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STREET_ORDER: StreetName[] = ["preflop", "flop", "turn", "river"];

function suitColor(suit: string): string {
  return ["h", "d"].includes(suit) ? "text-red-500" : "text-zinc-800 dark:text-zinc-200";
}

function rankDisplay(r: string): string {
  return r === "T" ? "10" : r;
}

function parseCards(raw: unknown): HHCard[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((c: unknown) => {
    if (typeof c === "object" && c !== null) {
      const card = c as Record<string, unknown>;
      return { rank: String(card.rank ?? "?"), suit: String(card.suit ?? "?") };
    }
    return { rank: "?", suit: "?" };
  });
}

function buildFrames(detail: HandDetail) {
  const frames: Array<{
    street: StreetName;
    board: HHCard[];
    pot: number;
    actionIdx: number;    // which action is active, -1 = before first action
    players: HHPlayer[];  // players with their hole cards visible
  }> = [];

  // Preflop start
  frames.push({
    street: "preflop",
    board: [],
    pot: detail.actions[0]?.potAfter ?? detail.pot ?? 0,
    actionIdx: -1,
    players: detail.players,
  });

  let prevStreetIdx = 0;
  for (let i = 0; i < detail.actions.length; i++) {
    const a = detail.actions[i];
    const streetIdx = STREET_ORDER.indexOf(a.street);

    // Snapshot when street changes (before first action of street)
    if (streetIdx !== prevStreetIdx) {
      const prev = frames[frames.length - 1];
      const newBoard =
        a.street === "flop" ? detail.board.slice(0, 3) :
        a.street === "turn" ? detail.board.slice(0, 4) :
        a.street === "river" ? detail.board.slice(0, 5) :
        prev.board;
      frames.push({
        street: a.street,
        board: newBoard,
        pot: a.potAfter ?? prev.pot,
        actionIdx: i,
        players: detail.players,
      });
      prevStreetIdx = streetIdx;
    }

    // Snapshot after each action
    frames.push({
      street: a.street,
      board: detail.board.slice(0, a.street === "river" ? 5 : a.street === "turn" ? 4 : a.street === "flop" ? 3 : 0),
      pot: a.potAfter ?? frames[frames.length - 1]?.pot ?? 0,
      actionIdx: i,
      players: detail.players,
    });
  }

  return frames;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function CardPip({ card }: { card: HHCard }) {
  return (
    <span className={cn("font-bold text-lg", suitColor(card.suit))}>
      {rankDisplay(card.rank)}
      <span className="text-xs">{card.suit}</span>
    </span>
  );
}

function CardSlot({ card, hidden = false }: { card?: HHCard; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className="w-10 h-14 rounded border border-dashed border-border bg-secondary/30 flex items-center justify-center">
        <span className="text-muted-foreground/50">?</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-14 rounded border-2 border-amber-600/60 bg-amber-950/30 flex items-center justify-center">
      <CardPip card={card} />
    </div>
  );
}

interface BoardViewProps {
  cards: HHCard[];
  street: StreetName;
}

function BoardView({ cards, street }: BoardViewProps) {
  const labels: Partial<Record<StreetName, string>> = {
    flop: "Flop",
    turn: "Turn",
    river: "River",
  };

  return (
    <div className="flex flex-col gap-1">
      {street !== "preflop" && (
        <>
          {/* Flop */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 font-mono uppercase">{labels["flop"]}</span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <CardSlot key={`flop-${i}`} card={cards[i]} hidden={street === "preflop"} />
              ))}
            </div>
          </div>

          {/* Turn */}
          {street !== "flop" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 font-mono uppercase">{labels["turn"]}</span>
              <CardSlot card={cards[3]} hidden={street === "preflop" || street === "flop"} />
            </div>
          )}

          {/* River */}
          {street === "river" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 font-mono uppercase">{labels["river"]}</span>
              <CardSlot card={cards[4]} hidden={false} />
            </div>
          )}
        </>
      )}
      {street === "preflop" && (
        <span className="text-xs text-muted-foreground italic">no community cards</span>
      )}
    </div>
  );
}

interface PlayerRowProps {
  player: HHPlayer;
  isHero: boolean;
  isActionOn: boolean;
  lastAction?: HHAction;
  gto?: GTOComparison;
}

function PlayerRow({ player, isHero, isActionOn, lastAction, gto }: PlayerRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded border transition-colors",
        isActionOn ? "border-amber-500/50 bg-amber-950/20" :
        isHero ? "border-blue-500/30 bg-blue-950/10" :
        "border-border/40 bg-transparent",
      )}
    >
      <div className="w-20 truncate text-sm">
        {player.name}
        {isHero && <span className="ml-1 text-blue-400 text-xs">(H)</span>}
      </div>

      <div className="flex gap-1">
        <CardSlot card={player.cards?.[0]} hidden={!isHero && !player.cards} />
        <CardSlot card={player.cards?.[1]} hidden={!isHero && !player.cards} />
        {!player.cards && <CardSlot card={undefined} hidden={false} />}
        {!player.cards && <CardSlot card={undefined} hidden={false} />}
      </div>

      <div className="ml-auto text-right">
        <div className="text-sm tabular-nums">
          {player.stack.toFixed(1)}
          <span className="text-muted-foreground text-xs ml-1">bb</span>
        </div>
        {gto && (
          <div className={cn("text-xs tabular-nums", gto.evDiff >= 0 ? "text-green-500" : "text-red-500")}>
            {gto.evDiff >= 0 ? "+" : ""}{gto.evDiff.toFixed(2)} bb vs GTO
          </div>
        )}
        {lastAction && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {lastAction.type === "bet" || lastAction.type === "raise"
              ? `${lastAction.type} ${lastAction.amount?.toFixed(1)}`
              : lastAction.type}
          </div>
        )}
      </div>
    </div>
  );
}

interface GTOSidebarProps {
  gtoComparison?: HandDetail["gtoComparison"];
  currentPlayer?: string;
  heroName?: string;
}

function GTOSidebar({ gtoComparison, currentPlayer, heroName }: GTOSidebarProps) {
  if (!gtoComparison || Object.keys(gtoComparison).length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-4">No GTO data available</div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
        GTO Comparison
      </h3>
      {Object.entries(gtoComparison).map(([player, data]) => (
        <div
          key={player}
          className={cn(
            "rounded border p-2",
            player === currentPlayer ? "border-amber-500/40 bg-amber-950/10" :
            player === heroName ? "border-blue-500/30 bg-blue-950/10" :
            "border-border/40 bg-transparent",
          )}
        >
          <div className="text-sm font-medium">{player}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Recommended: <span className="text-emerald-400">{data.recommendedAction}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            EV Diff:{" "}
            <span className={cn(data.evDiff >= 0 ? "text-green-500" : "text-red-500")}>
              {data.evDiff >= 0 ? "+" : ""}{data.evDiff.toFixed(2)} bb
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Equity: <span>{data.equity.toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export interface HandPlaybackProps {
  handId: string;
}

export function HandPlayback({ handId }: HandPlaybackProps) {
  const [detail, setDetail] = useState<HandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);

  // Fetch hand detail
  useEffect(() => {
    if (!handId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getHand(handId).then(
      (hand: HHHand) => {
        if (cancelled) return;

        // Build the full detail from the HHHand response
        // The backend returns flat hand data; reconstruct detailed structure
        const detail: HandDetail = {
          id: hand.hand_id,
          hand_id: hand.hand_id,
          gameType: hand.game_type ?? "No Limit Hold'em",
          limit: hand.stakes_small != null && hand.stakes_big != null
            ? `$${hand.stakes_small}/${hand.stakes_big}`
            : "—",
          date: hand.timestamp ?? hand.created_at ?? "",
          hero: hand.hero_name ?? "",
          buttonSeat: hand.button_position ?? 0,
          players: [],  // populated below
          actions: [],
          board: [],
          pot: hand.pot ?? 0,
          result: undefined,
          gtoComparison: undefined,
        };

        // If the backend returns a full hand with actions/players/board in the response,
        // merge them here. The current api.getHand only returns the flat HHHand row.
        // We use a secondary fetch for the full hand detail.
        return fetch(`/api/v1/hh/hands/${encodeURIComponent(handId)}`, {
          headers: {
            "Content-Type": "application/json",
            ...(window.__HERMES_SESSION_TOKEN__
              ? { "X-Hermes-Session-Token": window.__HERMES_SESSION_TOKEN__ }
              : {}),
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
            return res.json();
          })
          .then((fullHand: HandDetail) => {
            if (cancelled) return;
            setDetail(fullHand);
            setLoading(false);
          });
      },
      (err) => {
        if (cancelled) return;
        setError(String(err));
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [handId]);

  const frames = useMemo(() => detail ? buildFrames(detail) : [], [detail]);

  const totalFrames = frames.length;
  const currentFrame = frames[frameIdx] ?? frames[0];
  const currentActionIdx = currentFrame ? currentFrame.actionIdx : -1;
  const currentAction = currentActionIdx >= 0 && detail ? detail.actions[currentActionIdx] : undefined;

  const goToStreet = useCallback(
    (street: StreetName) => {
      const idx = frames.findIndex((f) => f.street === street);
      if (idx >= 0) setFrameIdx(idx);
    },
    [frames],
  );

  const prevAction = useCallback(() => {
    setFrameIdx((i) => Math.max(0, i - 1));
  }, []);

  const nextAction = useCallback(() => {
    setFrameIdx((i) => Math.min(totalFrames - 1, i + 1));
  }, [totalFrames]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-muted-foreground text-sm">Loading hand #{handId}…</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !detail) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center">
          <p className="text-destructive text-sm">Failed to load hand: {error ?? "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 w-full">
      {/* Main player area */}
      <div className="flex-1 min-w-0">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Hand #{detail.hand_id}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {detail.gameType} {detail.limit} &middot; {detail.date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  Pot&nbsp;
                  <span className="text-amber-400 tabular-nums">
                    {currentFrame?.pot.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-xs ml-1">bb</span>
                </div>
              </div>
            </div>

            {/* Street tabs */}
            <div className="flex gap-1 mt-2">
              {STREET_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => goToStreet(s)}
                  className={cn(
                    "px-3 py-1 rounded text-xs capitalize transition-colors",
                    currentFrame?.street === s
                      ? "bg-amber-600/20 text-amber-400 border border-amber-600/40"
                      : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Board */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Board</p>
              <BoardView cards={currentFrame?.board ?? []} street={currentFrame?.street ?? "preflop"} />
            </div>

            {/* Players */}
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Players</p>
              <div className="space-y-1.5">
                {detail.players.map((p) => {
                  const lastAction =
                    currentActionIdx >= 0 && detail.actions[currentActionIdx]?.player === p.name
                      ? currentAction
                      : undefined;
                  const gto = detail.gtoComparison?.[p.name];
                  return (
                    <PlayerRow
                      key={p.name}
                      player={p}
                      isHero={p.name === detail.hero}
                      isActionOn={currentAction?.player === p.name}
                      lastAction={lastAction}
                      gto={gto}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action log */}
            <div className="border-t border-border/40 pt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Step {frameIdx + 1} / {totalFrames}
                </span>
                {currentAction && (
                  <span className="font-mono">
                    {currentAction.player} {currentAction.type}
                    {currentAction.amount != null ? ` ${currentAction.amount}` : ""}
                  </span>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button ghost size="sm" onClick={() => setFrameIdx(0)} disabled={frameIdx === 0}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button ghost size="sm" onClick={prevAction} disabled={frameIdx === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1 text-center text-xs text-muted-foreground">
                  {currentAction
                    ? `${currentAction.player} ${currentAction.type}${currentAction.amount != null ? ` ${currentAction.amount}` : ""}`
                    : "Start of hand"}
                </div>

                <Button ghost size="sm" onClick={nextAction} disabled={frameIdx >= totalFrames - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button ghost size="sm" onClick={() => setFrameIdx(totalFrames - 1)} disabled={frameIdx >= totalFrames - 1}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GTO Comparison Sidebar */}
      <div className="w-64 shrink-0">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">GTO Analysis</CardTitle>
          </CardHeader>
          <GTOSidebar
            gtoComparison={detail.gtoComparison}
            currentPlayer={currentAction?.player}
            heroName={detail.hero}
          />
        </Card>
      </div>
    </div>
  );
}