"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// === Types ===

interface QuizOption {
  action: string;
  ev: number;
  frequency: number;
}

interface QuizSpot {
  id: string;
  game_type: string;
  category: string;
  difficulty: string;
  position: string;
  hero_hand: string;
  board: string | null;
  pot_size: number;
  stack_depth: number;
  gto_action: string;
  gto_frequency: number;
  gto_ev: number;
  options: QuizOption[];
  street: string;
  explanation: string | null;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string | null;
  score: number;
  accuracy: number;
  correct_count: number;
  total_solves: number;
  avg_ev_loss: number;
}

interface UserStatsData {
  total_solves: number;
  correct_count: number;
  accuracy: number;
  current_streak: number;
  max_streak: number;
  points: number;
  level: number;
  avg_ev_loss: number;
}

// === Constants ===

const SUIT_SYMBOLS: Record<string, string> = {
  h: "♥",
  d: "♦",
  c: "♣",
  s: "♠",
};

const SUIT_COLORS: Record<string, string> = {
  h: "text-red-400",
  d: "text-red-400",
  c: "text-gray-100",
  s: "text-gray-100",
};

function generateUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("quiz_user_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("quiz_user_id", id);
  }
  return id;
}

// === Card Display ===

function Card({ rank, suit, size = "md" }: { rank: string; suit: string; size?: "md" | "lg" }) {
  const w = size === "lg" ? "w-14" : "w-10";
  const h = size === "lg" ? "h-20" : "h-14";
  const fs = size === "lg" ? "text-lg" : "text-sm";
  const suitFs = size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div
      className={cn(
        w,
        h,
        "bg-white rounded-lg flex flex-col items-center justify-center shadow-lg border border-gray-300",
      )}
    >
      <div className={cn(fs, "font-bold leading-none", SUIT_COLORS[suit] || "text-gray-100")}>
        {rank}
      </div>
      <div className={cn(suitFs, "leading-none mt-0.5", SUIT_COLORS[suit] || "text-gray-100")}>
        {SUIT_SYMBOLS[suit] || suit}
      </div>
    </div>
  );
}

function BoardCards({ board }: { board: string | null }) {
  if (!board) return null;

  const cards: { rank: string; suit: string }[] = [];
  for (let i = 0; i < board.length - 1; i += 2) {
    const rank = board[i];
    const suit = board[i + 1]?.toLowerCase() || "";
    cards.push({ rank, suit });
  }

  if (cards.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 my-4">
      {cards.map((c, i) => (
        <Card key={i} rank={c.rank} suit={c.suit} />
      ))}
    </div>
  );
}

function HandDisplay({ hand }: { hand: string }) {
  // Parse hand like "AKs", "AA", "KQo", "A9"
  const isSuited = hand.toLowerCase().endsWith("s");
  const isPair = hand[0] === hand[1];
  const display = isPair ? hand.slice(0, 2) : isSuited ? hand.slice(0, 2) + "s" : hand.slice(0, 2) + "o";

  return (
    <div className="inline-flex items-center gap-3 bg-gray-800/80 border border-gray-700 rounded-xl px-6 py-3">
      <span className="text-3xl font-bold tracking-wider text-white">{display}</span>
    </div>
  );
}

// === Action Button ===

function ActionButton({
  action,
  frequency,
  ev,
  isGto,
  isSelected,
  isCorrect,
  answered,
  disabled,
  onClick,
}: {
  action: string;
  frequency: number;
  ev: number | null;
  isGto: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  answered: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left",
        isSelected && answered
          ? isCorrect
            ? "bg-green-900/20 border-green-500/50"
            : "bg-red-900/20 border-red-500/50"
          : isGto && answered
            ? "bg-green-900/10 border-green-500/30 ring-1 ring-green-500/30"
            : "bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800",
        disabled && !isSelected ? "opacity-40" : "opacity-100",
      )}
    >
      <div className="flex items-center gap-3">
        {answered && isGto && <span className="text-green-400 text-sm font-bold">✓</span>}
        {answered && isSelected && !isGto && <span className="text-red-400 text-sm font-bold">✗</span>}
        <span className="font-semibold text-white text-sm capitalize">{action}</span>
        {!answered && (
          <span className="text-xs text-gray-400 ml-1">{frequency}%</span>
        )}
      </div>
      <div className="text-xs text-gray-400">
        {answered && ev !== null ? (
          <span className={cn("font-medium", ev >= 0 ? "text-green-400" : "text-red-400")}>
            EV: {ev >= 0 ? "+" : ""}{ev.toFixed(2)}
          </span>
        ) : (
          <span>EV: —</span>
        )}
      </div>
    </button>
  );
}

// === Main Page Component ===

export default function QuizPage() {
  // Filter state
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([]);

  // Spot state
  const [spot, setSpot] = useState<QuizSpot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answer state
  const [answered, setAnswered] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Session stats (in-memory)
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
  });

  // User stats from API
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userId, setUserId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"play" | "stats">("play");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Init
  useEffect(() => {
    setUserId(generateUserId());

    // Fetch categories
    fetch("/api/v1/quiz/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) setAvailableCategories(data.categories);
        if (data.difficulties) setAvailableDifficulties(data.difficulties);
      })
      .catch(() => {
        setAvailableCategories(["3-bet pot", "open raise", "c-bet", "paired board", "icm", "draws"]);
        setAvailableDifficulties(["beginner", "intermediate", "advanced"]);
      });
  }, []);

  // Fetch spot
  const fetchSpot = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswered(false);
    setSelectedAction(null);

    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (difficulty !== "all") params.set("difficulty", difficulty);

      const res = await fetch(`/api/v1/quiz/random?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("No quiz spots match your filters. Try different categories.");
          setSpot(null);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: QuizSpot = await res.json();
      setSpot(data);
    } catch (err: any) {
      console.error("Failed to fetch spot:", err);
      setError("Failed to load quiz spot. Check that the API is running.");
      setSpot(null);
    } finally {
      setLoading(false);
    }
  }, [category, difficulty]);

  // Handle answer
  const handleAnswer = useCallback(
    async (action: string) => {
      if (answered || !spot) return;
      setSelectedAction(action);
      setAnswered(true);
      setSubmitting(true);

      const isCorrect = action === spot.gto_action;

      setSessionStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        bestStreak: isCorrect
          ? Math.max(prev.bestStreak, prev.streak + 1)
          : prev.bestStreak,
      }));

      // Submit to API
      try {
        const res = await fetch("/api/v1/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spot.id,
            user_id: userId,
            selected_action: action,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          // Refresh stats
          fetchUserStats(userId);
        }
      } catch {
        // API submission is non-critical; continue locally
      } finally {
        setSubmitting(false);
      }
    },
    [answered, spot, userId],
  );

  // Fetch user stats
  const fetchUserStats = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/v1/quiz/stats/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setUserStats({
          total_solves: data.total_solves,
          correct_count: data.correct_count,
          accuracy: data.accuracy,
          current_streak: data.current_streak,
          max_streak: data.max_streak,
          points: data.points,
          level: data.level,
          avg_ev_loss: data.avg_ev_loss,
        });
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (userId) params.set("user_id", userId);
      const res = await fetch(`/api/v1/quiz/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.entries || []);
      }
    } catch {
      // Non-critical
    } finally {
      setLeaderboardLoading(false);
    }
  }, [userId]);

  // Switch to stats tab and fetch leaderboard
  const openStats = useCallback(() => {
    setActiveTab("stats");
    fetchLeaderboard();
    if (userId) fetchUserStats(userId);
  }, [userId, fetchLeaderboard, fetchUserStats]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">Quiz Training</h1>
          <p className="text-gray-400 mt-1 text-sm">Test your GTO knowledge with real poker spots</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("play")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "play"
                ? "bg-poker-gold text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
            )}
          >
            Play
          </button>
          <button
            onClick={openStats}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "stats"
                ? "bg-poker-gold text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700",
            )}
          >
            Stats & Leaderboard
          </button>
        </div>
      </div>

      {activeTab === "play" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Levels</option>
                {availableDifficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchSpot}
                disabled={loading}
                className="px-5 py-2 bg-poker-gold text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Loading..." : "New Spot"}
              </button>
            </div>
          </div>

          {/* Main content: 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spot Display */}
            <div className="lg:col-span-2">
              {error ? (
                <div className="border border-gray-800 rounded-lg p-8 bg-gray-900/50 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchSpot}
                    className="mt-4 px-4 py-2 bg-poker-gold text-gray-900 rounded-lg font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              ) : !spot && !loading ? (
                <div className="border border-gray-800 rounded-lg p-12 bg-gray-900/50 text-center">
                  <div className="text-5xl mb-4 opacity-50">🧠</div>
                  <h2 className="text-xl font-semibold text-gray-300 mb-2">
                    Ready to Test Your Skills?
                  </h2>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Select filters above and click &quot;New Spot&quot; to get a random GTO training
                    spot. Compare your action against the solver&apos;s recommendation.
                  </p>
                </div>
              ) : loading ? (
                <div className="border border-gray-800 rounded-lg p-12 bg-gray-900/50 text-center">
                  <div className="text-4xl mb-4 animate-pulse">🎲</div>
                  <p className="text-gray-400">Finding a spot...</p>
                </div>
              ) : spot ? (
                <div className="border border-gray-800 rounded-lg bg-gray-900/50 overflow-hidden">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 p-4 border-b border-gray-800">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-900/30 text-blue-400 border border-blue-800/30">
                      {spot.category}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold border",
                        spot.difficulty === "beginner"
                          ? "bg-green-900/30 text-green-400 border-green-800/30"
                          : spot.difficulty === "intermediate"
                            ? "bg-yellow-900/30 text-yellow-400 border-yellow-800/30"
                            : "bg-red-900/30 text-red-400 border-red-800/30",
                      )}
                    >
                      {spot.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs bg-gray-800 text-gray-400">
                      {spot.position}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs bg-gray-800 text-gray-400 capitalize">
                      {spot.street}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs bg-gray-800 text-gray-400">
                      {spot.game_type.toUpperCase()}
                    </span>
                  </div>

                  {/* Hero Hand + Board */}
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                        Your Hand
                      </div>
                      <HandDisplay hand={spot.hero_hand} />
                    </div>

                    <BoardCards board={spot.board} />

                    {/* Game Info */}
                    <div className="flex justify-center gap-6 mt-4 mb-6 text-sm text-gray-400">
                      <span>
                        Pot: <b className="text-white">{spot.pot_size}bb</b>
                      </span>
                      <span>
                        Stack: <b className="text-white">{spot.stack_depth}bb</b>
                      </span>
                      <span>
                        Position: <b className="text-white">{spot.position}</b>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="text-center mb-4">
                      <div className="text-sm font-semibold text-gray-200 mb-3">
                        {answered
                          ? spot.explanation || "GTO Solution"
                          : "What's the GTO play?"}
                      </div>
                      <div className="space-y-2 max-w-md mx-auto">
                        {spot.options.map((opt) => (
                          <ActionButton
                            key={opt.action}
                            action={opt.action}
                            frequency={opt.frequency}
                            ev={answered ? opt.ev : null}
                            isGto={opt.action === spot.gto_action}
                            isSelected={selectedAction === opt.action}
                            isCorrect={answered && selectedAction === opt.action ? opt.action === spot.gto_action : false}
                            answered={answered}
                            disabled={answered || submitting}
                            onClick={() => handleAnswer(opt.action)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Result feedback */}
                    {answered && (
                      <div className="mt-6 text-center">
                        <div
                          className={cn(
                            "text-lg font-bold mb-2",
                            selectedAction === spot.gto_action
                              ? "text-green-400"
                              : "text-red-400",
                          )}
                        >
                          {selectedAction === spot.gto_action
                            ? "✓ Correct!"
                            : `✗ GTO: ${spot.gto_action}`}
                        </div>
                        <button
                          onClick={fetchSpot}
                          disabled={loading}
                          className="px-6 py-2.5 bg-poker-gold text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {loading ? "Loading..." : "Next Spot →"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Session Stats Sidebar */}
            <div className="space-y-4">
              <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-5">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Session Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">{sessionStats.total}</div>
                    <div className="text-xs text-gray-400">Spots</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-400">
                      {sessionStats.total > 0
                        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-yellow-400">
                      {sessionStats.streak}
                    </div>
                    <div className="text-xs text-gray-400">Streak</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-400">
                      {sessionStats.bestStreak}
                    </div>
                    <div className="text-xs text-gray-400">Best</div>
                  </div>
                </div>

                {/* Accuracy bar */}
                {sessionStats.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Session Accuracy</span>
                      <span>{Math.round((sessionStats.correct / sessionStats.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${(sessionStats.correct / sessionStats.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* User Stats from API */}
              {userStats && (
                <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-5">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Lifetime Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-white">{userStats.level}</div>
                      <div className="text-xs text-gray-400">Level</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-poker-gold">{userStats.points}</div>
                      <div className="text-xs text-gray-400">Points</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-400">
                        {userStats.total_solves > 0
                          ? Math.round(userStats.accuracy * 100)
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-gray-400">Accuracy</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-yellow-400">
                        {userStats.max_streak}
                      </div>
                      <div className="text-xs text-gray-400">Best Streak</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Stats Detail */}
          <div className="lg:col-span-2">
            <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
              {userStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{userStats.total_solves}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Spots Solved</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(userStats.accuracy * 100)}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Overall Accuracy</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.current_streak}</div>
                    <div className="text-xs text-gray-400 mt-1">Current Streak</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{userStats.points}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Points</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {userId ? "Complete a few spots to see your stats." : "Loading..."}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className="border border-gray-800 rounded-lg bg-gray-900/50 p-5">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Leaderboard
              </h3>
              {leaderboardLoading ? (
                <div className="text-center py-6 text-gray-500 animate-pulse">Loading...</div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                        entry.user_id === userId
                          ? "bg-poker-gold/10 border border-poker-gold/30"
                          : "bg-gray-800/30",
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          entry.rank === 1
                            ? "bg-yellow-500 text-gray-900"
                            : entry.rank === 2
                              ? "bg-gray-400 text-gray-900"
                              : entry.rank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-gray-700 text-gray-300",
                        )}
                      >
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {entry.user_name || entry.user_id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.correct_count}/{entry.total_solves} solves
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-poker-gold">{entry.score}</div>
                        <div className="text-xs text-gray-500">{Math.round(entry.accuracy)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No leaderboard data yet.
                  <br />
                  <span className="text-xs">Complete spots to appear here!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
