"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { QuizCard, Action, QuizOption } from "@/components/train/QuizCard";
import { SpotCategoryFilter } from "@/components/train/SpotCategoryFilter";
import { DifficultySelector } from "@/components/train/DifficultySelector";
import { useQuizApi, QuizSpot } from "@/hooks/useQuizApi";

// Convert API spot to QuizCard format
interface QuizQuestion {
  id: string;
  hand: string;
  board?: string;
  potSize: number;
  stackDepth: number;
  position: string;
  correctAction: Action;
  gtoFrequency: number;
  gtoEV: number;
  options: QuizOption[];
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  explanation?: string;
}

function spotToQuestion(spot: QuizSpot): QuizQuestion {
  // Build options array from API format
  const options: QuizOption[] = [];
  if (spot.options) {
    for (const [action, opts] of Object.entries(spot.options)) {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          options.push({
            action: opt.action as Action,
            ev: opt.ev,
            frequency: opt.frequency,
          });
        }
      }
    }
  }
  // Fallback options if none derived
  if (options.length === 0) {
    options.push(
      { action: "raise", ev: spot.gto_ev, frequency: spot.gto_frequency },
      { action: "call", ev: spot.gto_ev * 0.8, frequency: 0.15 },
      { action: "fold", ev: 0, frequency: 0.05 }
    );
  }

  return {
    id: spot.id,
    hand: spot.hero_hand,
    board: spot.board || undefined,
    potSize: spot.pot_size,
    stackDepth: spot.stack_depth,
    position: spot.position,
    correctAction: spot.gto_action as Action,
    gtoFrequency: spot.gto_frequency,
    gtoEV: spot.gto_ev,
    options,
    category: spot.category,
    difficulty: spot.difficulty as "easy" | "medium" | "hard",
    explanation: spot.explanation || undefined,
  };
}

interface SessionStats {
  totalQuestions: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  totalEvLoss: number;
  categoryAccuracy: Record<string, { correct: number; total: number }>;
  difficultyAccuracy: Record<string, { correct: number; total: number }>;
  history: Array<{
    timestamp: number;
    accuracy: number;
    streak: number;
    evLoss: number;
  }>;
}

const INITIAL_STATS: SessionStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalEvLoss: 0,
  categoryAccuracy: {},
  difficultyAccuracy: {},
  history: [],
};

export default function TrainPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);

  // Filter questions based on category and difficulty
  const filteredQuestions = useMemo(() => {
    return SAMPLE_QUESTIONS.filter((q) => {
      if (selectedCategory && q.category !== selectedCategory) return false;
      if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [selectedCategory, selectedDifficulty]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Calculate accuracy
  const accuracy = stats.totalQuestions > 0
    ? (stats.correctAnswers / stats.totalQuestions) * 100
    : 0;

  // Handle answer
  const handleAnswer = useCallback(
    (action: Action, isCorrect: boolean, evLoss: number) => {
      if (!currentQuestion) return;

      setStats((prev) => {
        const newStats = { ...prev };
        
        // Update totals
        newStats.totalQuestions += 1;
        if (isCorrect) {
          newStats.correctAnswers += 1;
          newStats.currentStreak += 1;
          newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
        } else {
          newStats.currentStreak = 0;
        }
        newStats.totalEvLoss += evLoss;

        // Update category accuracy
        const category = currentQuestion.category || "Unknown";
        if (!newStats.categoryAccuracy[category]) {
          newStats.categoryAccuracy[category] = { correct: 0, total: 0 };
        }
        newStats.categoryAccuracy[category].total += 1;
        if (isCorrect) {
          newStats.categoryAccuracy[category].correct += 1;
        }

        // Update difficulty accuracy
        const difficulty = currentQuestion.difficulty || "medium";
        if (!newStats.difficultyAccuracy[difficulty]) {
          newStats.difficultyAccuracy[difficulty] = { correct: 0, total: 0 };
        }
        newStats.difficultyAccuracy[difficulty].total += 1;
        if (isCorrect) {
          newStats.difficultyAccuracy[difficulty].correct += 1;
        }

        // Add to history
        newStats.history.push({
          timestamp: Date.now(),
          accuracy: (newStats.correctAnswers / newStats.totalQuestions) * 100,
          streak: newStats.currentStreak,
          evLoss: evLoss,
        });

        return newStats;
      });
    },
    [currentQuestion]
  );

  // Next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowReview(true);
    }
  }, [currentQuestionIndex, filteredQuestions.length]);

  // Reset session
  const resetSession = useCallback(() => {
    setStats(INITIAL_STATS);
    setCurrentQuestionIndex(0);
    setShowReview(false);
    setSessionActive(true);
  }, []);

  // Get weak spots (categories with low accuracy)
  const weakSpots = useMemo(() => {
    return Object.entries(stats.categoryAccuracy)
      .filter(([, data]) => data.total >= 2) // At least 2 questions
      .map(([category, data]) => ({
        category,
        accuracy: (data.correct / data.total) * 100,
        total: data.total,
      }))
      .filter((spot) => spot.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [stats.categoryAccuracy]);

  // Chart data
  const chartData = useMemo(() => {
    return stats.history.map((entry, index) => ({
      question: index + 1,
      accuracy: entry.accuracy,
      evLoss: entry.evLoss,
    }));
  }, [stats.history]);

  // Categories for filter (from API or static fallback)
  const categories = useMemo(() => {
    // Use static categories if API not loaded yet
    return ["3-bet pot", "open-raise pot", "overcard board", "monoboard", "paired board", "wet board", "straight completed"] as string[];
  }, []);

  // Difficulties for selector
  const difficulties = ["easy", "medium", "hard"] as const;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">Training Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master GTO poker decisions
          </p>
        </div>
        <button
          onClick={() => setShowReview(!showReview)}
          className={cn(
            "px-4 py-2 rounded-lg font-semibold transition-colors",
            showReview
              ? "bg-poker-gold text-black hover:bg-yellow-400"
              : "bg-gray-800 text-white hover:bg-gray-700"
          )}
        >
          {showReview ? "Continue Training" : "Review Mode"}
        </button>
      </div>

      {/* Filters */}
      {!showReview && (
        <div className="flex flex-wrap gap-4 mb-6">
          <SpotCategoryFilter
            categories={categories}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
          <DifficultySelector
            difficulties={difficulties}
            selected={selectedDifficulty}
            onChange={setSelectedDifficulty}
          />
        </div>
      )}

      {showReview ? (
        /* Review Mode */
        <div className="space-y-6">
          <div className="bg-gray-900/80 backdrop-blur rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-poker-gold">Session Review</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-poker-gold">{stats.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{accuracy.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">-{stats.totalEvLoss.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total EV Loss</div>
              </div>
            </div>

            {/* Weak Spots */}
            {weakSpots.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-red-400">Weak Spots</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {weakSpots.map((spot) => (
                    <div
                      key={spot.category}
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                    >
                      <div className="font-semibold text-red-400">{spot.category}</div>
                      <div className="text-2xl font-bold mt-1">{spot.accuracy.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {spot.total} questions answered
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accuracy Over Time Chart */}
            {chartData.length > 1 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Accuracy Over Time</h3>
                <div className="h-64 bg-gray-800/30 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="question" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#d4af37"
                        fill="#d4af37"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Category Performance</h3>
              <div className="space-y-2">
                {Object.entries(stats.categoryAccuracy).map(([category, data]) => {
                  const catAccuracy = (data.correct / data.total) * 100;
                  return (
                    <div key={category} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{category}</span>
                        <span className={cn(
                          "font-bold",
                          catAccuracy >= 70 ? "text-green-400" : "text-red-400"
                        )}>
                          {catAccuracy.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            catAccuracy >= 70 ? "bg-green-500" : "bg-red-500"
                          )}
                          style={{ width: `${catAccuracy}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {data.correct} / {data.total} correct
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={resetSession}
            className="w-full py-4 bg-poker-gold text-black rounded-xl font-bold text-lg hover:bg-yellow-400 transition-colors"
          >
            Start New Session
          </button>
        </div>
      ) : sessionActive && currentQuestion ? (
        /* Active Quiz */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/80 backdrop-blur rounded-xl p-6 border border-gray-800">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                  </span>
                  <span className="text-sm font-semibold text-poker-gold">
                    Streak: {stats.currentStreak} 🔥
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-poker-gold to-yellow-400 transition-all duration-500"
                    style={{
                      width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quiz Card */}
              <QuizCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                showFeedback={true}
              />
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800">
              <h3 className="font-semibold mb-4 text-poker-gold">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className={cn(
                    "font-bold",
                    accuracy >= 70 ? "text-green-400" : accuracy >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {accuracy.toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-bold text-yellow-400">{stats.currentStreak}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Best Streak</span>
                  <span className="font-bold text-poker-gold">{stats.bestStreak}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">EV Loss</span>
                  <span className="font-bold text-red-400">-{stats.totalEvLoss.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Progress Chart */}
            {chartData.length > 1 && (
              <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-4 text-poker-gold">Progress</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="question" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#d4af37"
                        strokeWidth={2}
                        dot={{ fill: "#d4af37", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Weak Spots */}
            {weakSpots.length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-4 text-red-400">Weak Spots</h3>
                <div className="space-y-2">
                  {weakSpots.slice(0, 3).map((spot) => (
                    <div
                      key={spot.category}
                      className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg"
                    >
                      <span className="text-sm">{spot.category}</span>
                      <span className="text-sm font-bold text-red-400">
                        {spot.accuracy.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Breakdown */}
            {Object.keys(stats.difficultyAccuracy).length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800">
                <h3 className="font-semibold mb-4 text-poker-gold">Difficulty</h3>
                <div className="space-y-2">
                  {(["easy", "medium", "hard"] as const).map((diff) => {
                    const data = stats.difficultyAccuracy[diff];
                    if (!data) return null;
                    const diffAccuracy = (data.correct / data.total) * 100;
                    return (
                      <div key={diff} className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm capitalize px-2 py-1 rounded",
                          diff === "easy" && "bg-green-500/20 text-green-400",
                          diff === "medium" && "bg-yellow-500/20 text-yellow-400",
                          diff === "hard" && "bg-red-500/20 text-red-400"
                        )}>
                          {diff}
                        </span>
                        <span className="text-sm font-mono">
                          {data.correct}/{data.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No questions available */
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-8 border border-gray-800 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters to see more questions.
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedDifficulty(null);
            }}
            className="px-6 py-3 bg-poker-gold text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}