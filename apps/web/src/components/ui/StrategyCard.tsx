"use client";

import { cn, formatBoard } from "@/lib/utils";
import { BoardCard } from "@/components/hh/BoardDisplay";

interface ActionDistribution {
  raise: number;
  call: number;
  fold: number;
}

interface StrategyCardProps {
  board?: string;
  potSize?: number;
  stackDepth?: number;
  position?: "BTN" | "SB" | "BB" | "CO" | "MP" | "UTG";
  actionDistribution?: ActionDistribution;
  evComparison?: {
    userEV: number;
    gtoEV: number;
    evLoss: number;
  };
  className?: string;
}

export function StrategyCard({
  board,
  potSize = 100,
  stackDepth = 100,
  position = "BTN",
  actionDistribution = { raise: 0.3, call: 0.5, fold: 0.2 },
  evComparison,
  className,
}: StrategyCardProps) {
  const parsedBoard = board ? formatBoard(board) : null;

  return (
    <div
      className={cn(
        "border border-gray-800 rounded-lg p-4 bg-gray-900/50 backdrop-blur",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-poker-gold/20 text-poker-gold text-xs font-semibold">
            {position}
          </span>
          <span className="text-sm text-muted-foreground">
            Stack: {stackDepth}bb
          </span>
        </div>
        <span className="text-lg font-bold text-poker-gold">
          {potSize}bb
        </span>
      </div>

      {/* Board */}
      {parsedBoard && (
        <div className="flex gap-1 mb-4">
          {parsedBoard.flop && parsedBoard.flop.map((card, i) => (
            <BoardCard
              key={`flop-${i}`}
              card={card ? { rank: card[0] as any, suit: card[1] as any } : null}
              small
            />
          ))}
          {parsedBoard.turn && (
            <BoardCard
              card={{ rank: parsedBoard.turn[0] as any, suit: parsedBoard.turn[1] as any }}
              small
            />
          )}
          {parsedBoard.river && (
            <BoardCard
              card={{ rank: parsedBoard.river[0] as any, suit: parsedBoard.river[1] as any }}
              small
            />
          )}
        </div>
      )}

      {/* Action Distribution */}
      <div className="space-y-2 mb-4">
        <div className="text-xs text-muted-foreground mb-2">Action Distribution</div>
        <ActionBar label="Raise" value={actionDistribution.raise} color="bg-green-500" />
        <ActionBar label="Call" value={actionDistribution.call} color="bg-yellow-500" />
        <ActionBar label="Fold" value={actionDistribution.fold} color="bg-red-500" />
      </div>

      {/* EV Comparison */}
      {evComparison && (
        <div className="pt-4 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Your EV</div>
              <div className="text-lg font-semibold text-blue-400">
                {evComparison.userEV.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">GTO EV</div>
              <div className="text-lg font-semibold text-green-400">
                {evComparison.gtoEV.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">EV Loss</div>
              <div className={`text-lg font-semibold ${evComparison.evLoss > 0 ? "text-red-400" : "text-green-400"}`}>
                {evComparison.evLoss > 0 ? "-" : ""}{Math.abs(evComparison.evLoss).toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono w-12 text-right">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export default StrategyCard;