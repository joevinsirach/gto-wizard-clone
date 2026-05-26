/**
 * Enhanced HandViewer — step-through playback for hand histories with GTO comparison.
 * Shows each street action with EV analysis, pot tracking, and GTO recommendations.
 */

import { useCallback, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  TrendingUp,
  TrendingDown,
  Scale,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared HH types
// ---------------------------------------------------------------------------

export type StreetName = "preflop" | "flop" | "turn" | "river";

export interface HHCard {
  rank: string; // "A", "K", "Q", "J", "T", "9", … "2"
  suit: string; // "h" | "d" | "c" | "s"
}

export interface Player {
  name: string;
  seat: number;
  stack: number; // big blinds
  cards?: [HHCard, HHCard];
  isHero?: boolean;
}

export type ActionType =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "all-in"
  | "post"
  | "ante";

export interface Action {
  type: ActionType;
  player: string;
  amount?: number; // big blinds, undefined for fold/check
  street: StreetName;
  potAfter?: number; // pot size after this action
  ev?: number;      // expected value at this decision point (bb)
  gtoAction?: ActionType;
  gtoEvDiff?: number; // EV difference vs GTO at this point (bb)
}

export interface HandState {
  players: Player[];
  board: HHCard[];
  pot: number;
  street: StreetName;
  actionOn?: string;
}

export interface HandHistory {
  id: string;
  gameType: string;
  limit: string;
  date: string;
  hero: string;
  buttonSeat: number;
  players: Player[];
  actions: Action[];
  result?: {
    showdown: boolean;
    pot: number;
    winner?: string;
    summary?: string;
  };
  gtoComparison?: {
    [player: string]: {
      action: ActionType;
      evDiff: number;
      equity: number;
    };
  };
  // Full decision analysis for hero
  decisions?: {
    [actionIndex: number]: {
      potBefore: number;
      potAfter: number;
      userAction: ActionType;
      gtoAction: ActionType;
      gtoEv: number;          // GTO expected value (bb)
      userEv: number;        // User's actual expected value (bb)
      evDiff: number;        // gtoEv - userEv (positive = user lost EV)
      userEquity: number;    // user's hand equity at this point
      gtoEquity: number;     // GTO's equity requirement for this action
      potOdds?: number;      // pot odds if calling
      recommendedAction?: ActionType;
    };
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function suitColor(suit: string): string {
  return ["h", "d"].includes(suit) ? "text-red-500" : "text-zinc-800 dark:text-zinc-200";
}

function rankDisplay(r: string): string {
  return r === "T" ? "10" : r;
}

const STREET_ORDER: StreetName[] = ["preflop", "flop", "turn", "river"];

function getBoardAtAction(actions: Action[], actionIdx: number): HHCard[] {
  let board: HHCard[] = [];
  for (let i = 0; i <= actionIdx; i++) {
    const a = actions[i];
    if (a.street === "flop" && a.type === "bet") board = board.slice(0, 3);
    if (a.street === "turn" && a.type === "bet") board = board.slice(0, 4);
    if (a.street === "river" && a.type === "bet") board = board.slice(0, 5);
  }
  return board;
}

function buildInitialState(hh: HandHistory): HandState[] {
  const frames: HandState[] = [];

  frames.push({
    players: hh.players,
    board: [],
    pot: hh.actions[0]?.potAfter ?? 0,
    street: "preflop",
  });

  let prevStreetIdx = 0;
  for (let i = 0; i < hh.actions.length; i++) {
    const a = hh.actions[i];
    const streetIdx = STREET_ORDER.indexOf(a.street);
    if (streetIdx !== prevStreetIdx) {
      const prev = frames[frames.length - 1];
      const newBoard =
        a.street === "flop"
          ? [prev.board[0], prev.board[1], prev.board[2]]
          : prev.board;
      frames.push({ ...prev, board: newBoard, street: a.street });
      prevStreetIdx = streetIdx;
    }
    frames.push({
      players: hh.players,
      board: getBoardAtAction(hh.actions, i),
      pot: a.potAfter ?? frames[frames.length - 1]?.pot ?? 0,
      street: a.street,
      actionOn: a.player,
    });
  }
  return frames;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CardPip({ card }: { card: HHCard }) {
  return (
    <span className={cn("font-mondwest font-bold text-lg", suitColor(card.suit))}>
      {rankDisplay(card.rank)}
      <span className="text-xs">{card.suit}</span>
    </span>
  );
}

function CardSlot({ card }: { card?: HHCard }) {
  return (
    <div
      className={cn(
        "w-10 h-14 rounded border flex items-center justify-center text-xs select-none",
        card
          ? "border-amber-600/60 bg-amber-950/30"
          : "border-border/40 bg-muted/30",
      )}
    >
      {card ? <CardPip card={card} /> : "—"}
    </div>
  );
}

function BoardRow({ cards }: { cards: HHCard[] }) {
  return (
    <div className="flex gap-2">
      {cards.length === 0 && (
        <span className="text-muted-foreground text-xs font-mondwest italic">
          no community cards
        </span>
      )}
      {cards.map((c, i) => (
        <CardSlot key={i} card={c} />
))}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <CardSlot key={`empty-${i}`} card={undefined} />
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  isActionOn,
  lastAction,
  evDiff,
}: {
  player: Player;
  isActionOn: boolean;
  lastAction?: Action;
  evDiff?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded border transition-colors",
        isActionOn
          ? "border-amber-500/50 bg-amber-950/20"
          : player.isHero
          ? "border-blue-500/30 bg-blue-950/10"
          : "border-border/40 bg-transparent",
      )}
    >
      <div className="w-20 truncate font-mondwest text-sm text-foreground">
        {player.name}
        {player.isHero && <span className="ml-1 text-blue-400 text-xs">(H)</span>}
      </div>

      <div className="flex gap-1">
        <CardSlot card={player.cards?.[0]} />
        <CardSlot card={player.cards?.[1]} />
      </div>

      <div className="ml-auto text-right">
        <div className="font-mondwest text-sm tabular-nums">
          {player.stack.toFixed(1)}
          <span className="text-muted-foreground text-xs ml-1">bb</span>
        </div>
        {evDiff !== undefined && (
          <div
            className={cn(
              "text-xs font-mondwest tabular-nums",
              evDiff > 0 ? "text-red-500" : "text-green-500",
            )}
          >
            {evDiff >= 0 ? "+" : ""}
            {evDiff.toFixed(2)} bb vs GTO
          </div>
        )}
        {lastAction && (
          <div className="text-xs text-muted-foreground font-mondwest mt-0.5">
            {lastAction.type === "bet" || lastAction.type === "raise"
              ? `${lastAction.type} ${lastAction.amount?.toFixed(1)}`
              : lastAction.type}
          </div>
        )}
      </div>
    </div>
  );
}

// Decision panel — shown when viewing a hero decision point
function DecisionPanel({
  decision,
  action,
}: {
  decision: NonNullable<HandHistory["decisions"]>[number];
  action: Action;
}) {
  const { userAction, gtoAction, evDiff, gtoEv, potOdds } = decision;
  const isOptimal = Math.abs(evDiff ?? 0) < 0.1;

  return (
    <div className="rounded border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Decision Analysis</span>
        {isOptimal && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
            GTO
          </span>
        )}
        {!isOptimal && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-medium">
            LEAK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Your action */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Your Play</span>
          <span
            className={cn(
              "font-mono font-semibold text-sm capitalize",
              userAction !== gtoAction ? "text-red-400" : "text-foreground",
            )}
          >
            {userAction}
            {action.amount != null && action.amount > 0 && ` ${action.amount}`}
          </span>
          <span className="text-muted-foreground font-mono">EV: —</span>
        </div>

        {/* GTO action */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">GTO</span>
          <span className="font-mono font-semibold text-sm text-emerald-400 capitalize">
            {gtoAction}
          </span>
          <span className="text-emerald-400 font-mono">
            {gtoEv != null ? `${gtoEv.toFixed(2)} bb` : "—"}
          </span>
        </div>
      </div>

      {/* EV diff highlight */}
      {evDiff != null && (
        <div
          className={cn(
            "flex items-center justify-between rounded px-2 py-1.5 text-xs",
            evDiff > 0 ? "bg-red-950/30" : "bg-emerald-950/30",
          )}
        >
          <span className="text-muted-foreground">EV Loss</span>
          <span
            className={cn(
              "font-mono font-bold tabular-nums",
              evDiff > 0 ? "text-red-400" : "text-emerald-400",
            )}
          >
            {evDiff > 0 ? "+" : ""}
            {evDiff.toFixed(2)} bb
          </span>
        </div>
      )}

      {/* Pot odds if applicable */}
      {potOdds != null && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Pot Odds</span>
          <span className="font-mono text-primary">{(potOdds * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HandViewer
// ---------------------------------------------------------------------------

export interface HandViewerProps {
  hand: HandHistory;
}

export function HandViewer({ hand }: HandViewerProps) {
  const [frameIdx, setFrameIdx] = useState(0);

  const frames = useMemo(() => buildInitialState(hand), [hand]);

  const current = frames[frameIdx] ?? frames[0];

  const streetFrames = useMemo(() => {
    const idxs: Record<StreetName, number[]> = { preflop: [], flop: [], turn: [], river: [] };
    frames.forEach((f, i) => idxs[f.street].push(i));
    return idxs;
  }, [frames]);

  const totalFrames = frames.length;
  const totalActions = hand.actions.length;

  // Which action this frame corresponds to
  const currentActionIdx = frameIdx > 0 ? frameIdx - 1 : -1;
  const currentAction = currentActionIdx >= 0 ? hand.actions[currentActionIdx] : undefined;

  // Get decision analysis if this is a hero decision
  const heroDecision =
    currentActionIdx >= 0 && hand.decisions
      ? hand.decisions[currentActionIdx]
      : undefined;

  const goToStreet = useCallback(
    (street: StreetName) => {
      const idxs = streetFrames[street];
      if (idxs.length > 0) setFrameIdx(idxs[0]);
    },
    [streetFrames],
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Hand #{hand.id}</CardTitle>
            <p className="text-xs text-muted-foreground font-mondwest mt-0.5">
              {hand.gameType} {hand.limit} · {hand.date}
            </p>
          </div>
          <div className="text-right">
            <div className="font-mondwest text-sm">
              Pot&nbsp;
              <span className="text-amber-400 tabular-nums">{current.pot.toFixed(1)}</span>
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
                "px-3 py-1 rounded text-xs font-mondwest capitalize transition-colors",
                current.street === s
                  ? "bg-amber-600/20 text-amber-400 border border-amber-600/40"
                  : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Board */}
        <div>
          <p className="text-xs text-muted-foreground font-mondwest mb-1.5 uppercase tracking-wider">
            Board
          </p>
          <BoardRow cards={current.board} />
        </div>

        {/* Decision analysis for current hero action */}
        {heroDecision && currentAction && (
          <DecisionPanel decision={heroDecision} action={currentAction} />
        )}

        <div className="border-t border-border/40 pt-3">
          <p className="text-xs text-muted-foreground font-mondwest mb-1.5 uppercase tracking-wider">
            Players
          </p>
          <div className="space-y-1.5">
            {current.players.map((p) => {
              const playerAction =
                currentActionIdx >= 0 && hand.actions[currentActionIdx]?.player === p.name
                  ? currentAction
                  : undefined;
              const evDiff: number | undefined =
                p.isHero && hand.gtoComparison?.[p.name]
                  ? hand.gtoComparison[p.name].evDiff
                  : undefined;

              return (
                <PlayerRow
                  key={p.name}
                  player={p}
                  isActionOn={p.name === current.actionOn}
                  lastAction={playerAction}
                  evDiff={evDiff}
                />
              );
            })}
          </div>
        </div>

        {/* Timeline scrubber */}
        <div className="border-t border-border/40 pt-3">
          <div className="flex justify-between text-xs text-muted-foreground font-mondwest mb-1.5">
            <span>
              Frame {frameIdx + 1} / {totalFrames}
            </span>
            <span>
              Action {currentActionIdx + 1} / {totalActions}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={frameIdx}
            onChange={(e) => setFrameIdx(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFrameIdx(0)}
            disabled={frameIdx === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFrameIdx((f) => Math.max(0, f - 1))}
            disabled={frameIdx === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 text-center text-xs font-mondwest text-muted-foreground">
            {currentAction
              ? `${currentAction.player} ${currentAction.type}${
                  currentAction.amount != null ? ` ${currentAction.amount}` : ""
                }`
              : "Start of hand"}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFrameIdx((f) => Math.min(totalFrames - 1, f + 1))}
            disabled={frameIdx === totalFrames - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFrameIdx(totalFrames - 1)}
            disabled={frameIdx === totalFrames - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
