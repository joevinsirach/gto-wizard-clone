"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PlayerStack {
  id: string;
  name: string;
  chips: number;
  isShortStack?: boolean;
  isBigStack?: boolean;
}

interface ChipStackPanelProps {
  players?: PlayerStack[];
  onPlayersChange?: (players: PlayerStack[]) => void;
  totalChips?: number;
  className?: string;
}

const POSITION_LABELS: Record<string, string> = {
  btn: "Button",
  sb: "Small Blind",
  bb: "Big Blind",
  co: "Cutoff",
  mp: "Middle Position",
  utg: "Under the Gun",
};

const POSITION_ORDER = ["utg", "mp", "co", "btn", "sb", "bb"];

export function ChipStackPanel({
  players = [],
  onPlayersChange,
  totalChips = 10000,
  className,
}: ChipStackPanelProps) {
  const [localPlayers, setLocalPlayers] = useState<PlayerStack[]>(
    players.length > 0
      ? players
      : [
          { id: "1", name: "Player 1", chips: 2000, isBigStack: true },
          { id: "2", name: "Player 2", chips: 1500 },
          { id: "3", name: "Player 3", chips: 3000, isBigStack: true },
          { id: "4", name: "Player 4", chips: 1200, isShortStack: true },
          { id: "5", name: "Player 5", chips: 1500 },
          { id: "6", name: "Player 6", chips: 800, isShortStack: true },
        ]
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const totalStacked = localPlayers.reduce((sum, p) => sum + p.chips, 0);

  const handleChipChange = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      const newPlayers = localPlayers.map((p) =>
        p.id === id ? { ...p, chips: numValue } : p
      );
      setLocalPlayers(newPlayers);
      onPlayersChange?.(newPlayers);
    }
  };

  const handleNameChange = (id: string, name: string) => {
    const newPlayers = localPlayers.map((p) =>
      p.id === id ? { ...p, name } : p
    );
    setLocalPlayers(newPlayers);
    onPlayersChange?.(newPlayers);
  };

  const addPlayer = () => {
    const newPlayer: PlayerStack = {
      id: Date.now().toString(),
      name: `Player ${localPlayers.length + 1}`,
      chips: Math.floor(totalChips / (localPlayers.length + 1)),
    };
    const newPlayers = [...localPlayers, newPlayer];
    setLocalPlayers(newPlayers);
    onPlayersChange?.(newPlayers);
  };

  const removePlayer = (id: string) => {
    if (localPlayers.length <= 2) return;
    const newPlayers = localPlayers.filter((p) => p.id !== id);
    setLocalPlayers(newPlayers);
    onPlayersChange?.(newPlayers);
  };

  const sortedPlayers = [...localPlayers].sort((a, b) => b.chips - a.chips);

  return (
    <div className={cn("border border-gray-800 rounded-lg p-4 bg-gray-900/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-poker-gold">Chip Stacks</h3>
        <span className="text-sm text-muted-foreground">
          Total: {totalStacked.toLocaleString()} chips
        </span>
      </div>

      <div className="space-y-2">
        {localPlayers.map((player, index) => {
          const stackPercentage = (player.chips / totalChips) * 100;
          const isLeading = sortedPlayers[0]?.id === player.id;
          const isShort = stackPercentage < 15;

          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded transition-colors",
                isShort
                  ? "bg-red-900/20 border border-red-800/30"
                  : "bg-gray-800/50 hover:bg-gray-800"
              )}
            >
              <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-1 focus:ring-poker-gold rounded px-1 w-24"
                  />
                  {isLeading && (
                    <span className="px-1.5 py-0.5 rounded bg-poker-gold/20 text-poker-gold text-xs font-semibold">
                      CHIP LEADER
                    </span>
                  )}
                  {isShort && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-semibold">
                      SHORT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isShort
                          ? "bg-gradient-to-r from-red-600 to-red-400"
                          : "bg-gradient-to-r from-blue-600 to-blue-400"
                      )}
                      style={{ width: `${Math.min(stackPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                    {player.chips.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => removePlayer(player.id)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                disabled={localPlayers.length <= 2}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={addPlayer}
          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
        >
          + Add Player
        </button>
        <div className="text-sm text-muted-foreground">
          {localPlayers.length} players remaining
        </div>
      </div>
    </div>
  );
}

export default ChipStackPanel;
