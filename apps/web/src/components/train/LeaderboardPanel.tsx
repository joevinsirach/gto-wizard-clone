"use client";

/**
 * Live leaderboard panel with WebSocket update support.
 * 
 * Features:
 * - Real-time ranking updates via WebSocket
 * - Animated transitions when rankings change
 * - Highlight for current user
 * - Score, accuracy, and EV loss metrics
 * - Position change indicators (up/down arrows)
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import { cn } from '@/lib/utils';

export interface LeaderboardPanelProps {
  /** Quiz session ID */
  quizSessionId: string;
  /** Current user ID for highlighting */
  userId: string;
  /** Optional className for styling */
  className?: string;
  /** Number of top users to highlight */
  topNHilight?: number;
  /** Callback when user ranking changes significantly */
  onRankChange?: (newRank: number, oldRank: number) => void;
}

interface RankChange {
  userId: string;
  change: number; // positive = moved up, negative = moved down
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  accuracy: number;
  correct_count: number;
  avg_ev_loss: number;
  avg_time: number;
}

function PositionChangeIndicator({ change }: { change: number }) {
  if (change === 0) return null;
  
  const isPositive = change > 0;
  
  return (
    <div className={cn(
      "flex items-center gap-0.5 text-xs",
      isPositive ? "text-green-500" : "text-red-500"
    )}>
      {isPositive ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      )}
      <span>{Math.abs(change)}</span>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
  rankChange,
  topNHighlight,
  rank,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  rankChange: number;
  topNHighlight: number;
  rank: number;
}) {
  const isTop = rank <= topNHighlight;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-all",
      isCurrentUser && "bg-poker-gold/20 border border-poker-gold/50",
      !isCurrentUser && "bg-gray-800/50 hover:bg-gray-800",
      isTop && !isCurrentUser && "bg-yellow-900/20"
    )}>
      {/* Rank */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
        rank === 1 && "bg-yellow-500 text-black",
        rank === 2 && "bg-gray-400 text-black",
        rank === 3 && "bg-amber-600 text-white",
        rank > 3 && "bg-gray-700 text-gray-300"
      )}>
        {rank}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate",
            isCurrentUser ? "text-poker-gold" : "text-foreground"
          )}>
            {entry.user_name}
            {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
          </span>
          {rankChange !== 0 && (
            <PositionChangeIndicator change={rankChange} />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{entry.correct_count} correct</span>
          <span>{(entry.accuracy * 100).toFixed(0)}% accurate</span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className={cn(
          "font-bold font-mono",
          isTop ? "text-yellow-400" : "text-foreground"
        )}>
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {entry.avg_ev_loss > 0 ? `-${entry.avg_ev_loss.toFixed(2)}` : '0.00'} EV
        </div>
      </div>
    </div>
  );
}

function AnimatedLeaderboard({
  entries,
  userId,
  topNHighlight,
}: {
  entries: LeaderboardEntry[];
  userId: string;
  topNHighlight: number;
}) {
  const [displayedEntries, setDisplayedEntries] = useState<LeaderboardEntry[]>([]);
  const [prevEntries, setPrevEntries] = useState<Map<string, LeaderboardEntry>>(new Map());

  useEffect(() => {
    // Track previous positions for rank change animation
    const prevMap = new Map<string, LeaderboardEntry>();
    displayedEntries.forEach((e, i) => prevMap.set(e.user_id, { ...e, rank: i + 1 }));
    setPrevEntries(prevMap);
    setDisplayedEntries(entries);
  }, [entries]);

  return (
    <div className="space-y-2">
      {displayedEntries.map((entry, index) => {
        const prevEntry = prevEntries.get(entry.user_id);
        const prevRank = prevEntry?.rank || entry.rank;
        const rankChange = prevRank - entry.rank;
        
        return (
          <LeaderboardRow
            key={entry.user_id}
            entry={entry}
            isCurrentUser={entry.user_id === userId}
            rankChange={rankChange}
            topNHighlight={topNHighlight}
            rank={index + 1}
          />
        );
      })}
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-12 h-12 mb-4 text-gray-600"
      >
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M2 12h7m5 0h7M12 2v7m0 5v7" />
        <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24" />
      </svg>
      <p className="text-muted-foreground">No participants yet</p>
      <p className="text-sm text-muted-foreground mt-1">Be the first to join!</p>
    </div>
  );
}

export function LeaderboardPanel({
  quizSessionId,
  userId,
  className,
  topNHilight = 3,
  onRankChange,
}: LeaderboardPanelProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleLeaderboardUpdate = useCallback((event: { leaderboard: LeaderboardEntry[]; timestamp: string }) => {
    setLastUpdated(event.timestamp);
  }, []);

  const handleUserAnswered = useCallback((event: { user_id: string; is_correct: boolean }) => {
    // Could trigger a subtle animation or sound effect here
    console.log('User answered:', event);
  }, []);

  const {
    isConnected,
    leaderboard,
    joinSession,
  } = useQuizSocket({
    quizSessionId,
    userId,
    autoConnect: true,
    onLeaderboardUpdate: handleLeaderboardUpdate as any,
    onAnswer: handleUserAnswered as any,
  });

  // Notify parent of rank changes
  useEffect(() => {
    if (!onRankChange || leaderboard.entries.length === 0) return;

    const userEntry = leaderboard.entries.find(e => e.user_id === userId);
    if (userEntry) {
      // Get previous rank from displayed entries
      const currentRank = leaderboard.entries.indexOf(userEntry) + 1;
      onRankChange(currentRank, currentRank); // Would need to track previous rank properly
    }
  }, [leaderboard, userId, onRankChange]);

  const sortedEntries = useMemo(() => {
    return [...leaderboard.entries].sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) return b.score - a.score;
      // Then by accuracy
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      // Then by avg ev loss (lower is better)
      return a.avg_ev_loss - b.avg_ev_loss;
    });
  }, [leaderboard.entries]);

  return (
    <div className={cn("bg-gray-900/80 backdrop-blur rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-poker-gold"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
          <h3 className="font-semibold text-foreground">Leaderboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"
          )} />
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Live
            </span>
          )}
        </div>
      </div>

      {/* Leaderboard content */}
      <div className="max-h-96 overflow-y-auto">
        {sortedEntries.length > 0 ? (
          <AnimatedLeaderboard
            entries={sortedEntries}
            userId={userId}
            topNHighlight={topNHilight}
          />
        ) : (
          <EmptyLeaderboard />
        )}
      </div>

      {/* Footer stats */}
      {sortedEntries.length > 0 && (
        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-poker-gold">
                {sortedEntries[0]?.score.toLocaleString() || 0}
              </div>
              <div className="text-xs text-muted-foreground">Leader</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {((sortedEntries.find(e => e.user_id === userId)?.accuracy || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Your Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {sortedEntries.length}
              </div>
              <div className="text-xs text-muted-foreground">Players</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPanel;
