"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { QuizCard, Action, QuizQuestion } from "@/components/train/QuizCard";
import { useQuizApi, QuizSpot } from "@/hooks/useQuizApi";

// ── Types ──────────────────────────────────────────────────────────────────

type TrainerMode = "timed" | "untimed" | "assessment";

interface TrainerStats {
  total: number;
  correct: number;
  streak: number;
  bestStreak: number;
  evLoss: number;
  startTime: number;
  times: number[];
}

const INITIAL_STATS: TrainerStats = {
  total: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  evLoss: 0,
  startTime: 0,
  times: [],
};

const TIMED_DURATION = 60; // seconds
const SESSION_SIZE = 10; // questions per assessment

// ── Demo fallback ──────────────────────────────────────────────────────────

function makeDemoQuestion(index: number): QuizQuestion {
  const demos: QuizQuestion[] = [
    {
      id: `demo-${index}-1`,
      hand: "AA",
      board: "KsQdJh",
      potSize: 100,
      stackDepth: 200,
      position: "BTN",
      correctAction: "raise",
      gtoFrequency: 0.85,
      gtoEV: 1.45,
      options: [
        { action: "raise", ev: 1.45, frequency: 0.85 },
        { action: "call", ev: 1.20, frequency: 0.10 },
        { action: "fold", ev: 0, frequency: 0.05 },
      ],
      category: "Pre-flop",
      difficulty: "easy",
      explanation: "With AA on a coordinated board, raising builds the pot and extracts value.",
    },
    {
      id: `demo-${index}-2`,
      hand: "KK",
      board: "Ah7d2c",
      potSize: 80,
      stackDepth: 150,
      position: "CO",
      correctAction: "call",
      gtoFrequency: 0.70,
      gtoEV: 0.95,
      options: [
        { action: "raise", ev: 0.80, frequency: 0.20 },
        { action: "call", ev: 0.95, frequency: 0.70 },
        { action: "fold", ev: 0, frequency: 0.10 },
      ],
      category: "Post-flop",
      difficulty: "medium",
      explanation: "Top two pair on a dry board — calling keeps your range balanced.",
    },
    {
      id: `demo-${index}-3`,
      hand: "JT",
      board: "QdKsTc",
      potSize: 120,
      stackDepth: 100,
      position: "SB",
      correctAction: "fold",
      gtoFrequency: 0.55,
      gtoEV: -0.15,
      options: [
        { action: "raise", ev: -0.45, frequency: 0.25 },
        { action: "call", ev: -0.20, frequency: 0.20 },
        { action: "fold", ev: -0.15, frequency: 0.55 },
      ],
      category: "Post-flop",
      difficulty: "hard",
      explanation: "Gutshot straight draw with backdoor flush — pot odds don't justify calling.",
    },
    {
      id: `demo-${index}-4`,
      hand: "55",
      board: "6s7s8d",
      potSize: 60,
      stackDepth: 180,
      position: "MP",
      correctAction: "call",
      gtoFrequency: 0.65,
      gtoEV: 0.72,
      options: [
        { action: "raise", ev: 0.60, frequency: 0.25 },
        { action: "call", ev: 0.72, frequency: 0.65 },
        { action: "fold", ev: 0, frequency: 0.10 },
      ],
      category: "Post-flop",
      difficulty: "medium",
      explanation: "Middle set on a connected board — calling balances your range.",
    },
    {
      id: `demo-${index}-5`,
      hand: "AK",
      board: "Kd9d2h",
      potSize: 90,
      stackDepth: 160,
      position: "BTN",
      correctAction: "raise",
      gtoFrequency: 0.80,
      gtoEV: 1.25,
      options: [
        { action: "raise", ev: 1.25, frequency: 0.80 },
        { action: "call", ev: 1.05, frequency: 0.15 },
        { action: "fold", ev: 0, frequency: 0.05 },
      ],
      category: "Post-flop",
      difficulty: "easy",
      explanation: "Top pair top kicker on a dry board — charge draw-heavy hands.",
    },
  ];
  return demos[index % demos.length];
}

function spotToQuestion(spot: QuizSpot): QuizQuestion {
  const options: { action: Action; ev: number; frequency: number }[] = [];
  if (spot.options) {
    for (const [, opts] of Object.entries(spot.options)) {
      if (Array.isArray(opts)) options.push(...opts);
    }
  }
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

// ── Mode config ────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<TrainerMode, { label: string; description: string; icon: string }> = {
  timed: { label: "Timed Drill", description: `${TIMED_DURATION}s — answer as many as you can`, icon: "⏱" },
  untimed: { label: "Practice", description: "No clock — focus on accuracy", icon: "🎯" },
  assessment: { label: "Assessment", description: `${SESSION_SIZE} questions — test your skill`, icon: "📊" },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function TrainerPage() {
  const [mode, setMode] = useState<TrainerMode | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [stats, setStats] = useState<TrainerStats>(INITIAL_STATS);
  const [sessionOver, setSessionOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMED_DURATION);
  const [questionIndex, setQuestionIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(0);
  const demoCounterRef = useRef(0);

  const { spot, isLoadingSpot, fetchRandomSpot, submitAnswer } = useQuizApi();

  // ── Timer (timed mode) ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "timed" || sessionOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSessionOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, sessionOver, questionIndex]);

  // ── Fetch from API ─────────────────────────────────────────────────────
  const loadNextQuestion = useCallback(async () => {
    questionStartRef.current = Date.now();
    try {
      const apiSpot = await fetchRandomSpot();
      if (apiSpot) {
        setQuestion(spotToQuestion(apiSpot));
        return;
      }
    } catch {
      // fall through to demo
    }
    // Demo fallback
    const idx = demoCounterRef.current++;
    setQuestion(makeDemoQuestion(idx));
  }, [fetchRandomSpot]);

  // ── Start session ──────────────────────────────────────────────────────
  const startSession = useCallback(
    (selectedMode: TrainerMode) => {
      setMode(selectedMode);
      setSessionOver(false);
      setQuestionIndex(0);
      setStats({ ...INITIAL_STATS, startTime: Date.now() });
      setTimeLeft(TIMED_DURATION);
      demoCounterRef.current = Math.floor(Math.random() * 100);
      loadNextQuestion();
    },
    [loadNextQuestion]
  );

  // ── Handle answer ──────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (action: Action, isCorrect: boolean, evLoss: number) => {
      if (!question) return;

      const timeTaken = Date.now() - questionStartRef.current;

      // Submit to API
      submitAnswer({
        spot_id: question.id,
        user_id: "local-user",
        selected_action: action,
        time_taken_ms: timeTaken,
      }).catch(() => {});

      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        streak: isCorrect ? prev.streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
        evLoss: prev.evLoss + evLoss,
        times: [...prev.times, timeTaken],
      }));

      // In assessment mode, check if session is done
      if (mode === "assessment") {
        const nextIdx = questionIndex + 1;
        if (nextIdx >= SESSION_SIZE) {
          setSessionOver(true);
          return;
        }
        setQuestionIndex(nextIdx);
      }

      // Load next question
      loadNextQuestion();
    },
    [question, mode, questionIndex, submitAnswer, loadNextQuestion]
  );

  // ── Reset ──────────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setMode(null);
    setQuestion(null);
    setSessionOver(false);
    setQuestionIndex(0);
    setTimeLeft(TIMED_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────
  const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  const avgTime =
    stats.times.length > 0
      ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length / 1000
      : 0;

  // ── Mode selection screen ──────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-poker-gold mb-2">
              Trainer
            </h1>
            <p className="text-gray-400">
              Choose a training mode to sharpen your GTO skills
            </p>
          </div>

          <div className="grid gap-4">
            {(Object.keys(MODE_CONFIG) as TrainerMode[]).map((m) => {
              const cfg = MODE_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => startSession(m)}
                  className="group relative bg-gray-900/80 hover:bg-gray-800/80 border border-gray-800 hover:border-poker-gold/50 rounded-xl p-6 text-left transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-foreground group-hover:text-poker-gold transition-colors">
                        {cfg.label}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {cfg.description}
                      </div>
                    </div>
                    <div className="text-gray-600 group-hover:text-poker-gold transition-colors text-xl">
                      →
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center text-xs text-gray-600">
            Questions sourced from quiz API when available, with built-in demo spots as fallback.
          </div>
        </div>
      </div>
    );
  }

  // ── Session over screen ────────────────────────────────────────────────
  if (sessionOver) {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const grade =
      accuracy >= 80 ? "Excellent" : accuracy >= 60 ? "Good" : accuracy >= 40 ? "Needs Work" : "Keep Practicing";
    const gradeColor =
      accuracy >= 80
        ? "text-green-400"
        : accuracy >= 60
          ? "text-yellow-400"
          : accuracy >= 40
            ? "text-orange-400"
            : "text-red-400";

    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">
              {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "👍" : accuracy >= 40 ? "📈" : "💪"}
            </div>
            <h2 className="text-2xl font-bold text-poker-gold mb-1">Session Complete</h2>
            <div className={cn("text-xl font-bold", gradeColor)}>{grade}</div>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Accuracy" value={`${accuracy.toFixed(0)}%`} color="text-poker-gold" />
              <StatBox label="Correct" value={`${stats.correct}/${stats.total}`} color="text-green-400" />
              <StatBox label="Best Streak" value={`${stats.bestStreak}`} color="text-yellow-400" />
              <StatBox label="EV Lost" value={`-${stats.evLoss.toFixed(2)}`} color="text-red-400" />
              {mode === "timed" && (
                <>
                  <StatBox label="Time" value={`${Math.floor(elapsed)}s`} color="text-blue-400" />
                  <StatBox
                    label="Q/Min"
                    value={`${(stats.total / (elapsed / 60)).toFixed(1)}`}
                    color="text-purple-400"
                  />
                </>
              )}
              {mode !== "timed" && (
                <>
                  <StatBox
                    label="Avg Time"
                    value={`${avgTime.toFixed(1)}s`}
                    color="text-blue-400"
                  />
                  <StatBox
                    label="Total EV"
                    value={`${(stats.evLoss === 0 ? 0 : -stats.evLoss).toFixed(2)}`}
                    color="text-purple-400"
                  />
                </>
              )}
            </div>

            {stats.evLoss > 0 && (
              <div className="pt-2 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-1">EV Loss Breakdown</div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                    style={{ width: `${Math.min(100, (stats.evLoss / stats.total) * 50)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => startSession(mode)}
              className="flex-1 py-3 bg-poker-gold text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {MODE_CONFIG[mode].icon} Again
            </button>
            <button
              onClick={resetSession}
              className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Change Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session ─────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-900/80 border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg">{MODE_CONFIG[mode].icon}</span>
            <span className="font-bold text-poker-gold">{MODE_CONFIG[mode].label}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {mode === "timed" && (
              <div
                className={cn(
                  "font-mono font-bold text-lg tabular-nums",
                  timeLeft <= 10 ? "text-red-400" : timeLeft <= 30 ? "text-yellow-400" : "text-green-400"
                )}
              >
                {timeLeft}s
              </div>
            )}
            {mode === "assessment" && (
              <div className="text-gray-400">
                <span className="text-poker-gold font-bold">{questionIndex + 1}</span>
                <span className="mx-1">/</span>
                <span>{SESSION_SIZE}</span>
              </div>
            )}
            <div className="text-gray-400">
              <span className="text-green-400 font-bold">{stats.correct}</span>
              <span className="mx-1">/</span>
              <span>{stats.total}</span>
            </div>
            {stats.streak > 0 && (
              <div className="text-yellow-400 font-bold">🔥 {stats.streak}</div>
            )}
            <button
              onClick={resetSession}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 text-xs transition-colors"
            >
              End
            </button>
          </div>
        </div>
      </div>

      {/* Timer bar (timed mode) */}
      {mode === "timed" && (
        <div className="h-1 bg-gray-800">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-linear",
              timeLeft <= 10 ? "bg-red-500" : timeLeft <= 30 ? "bg-yellow-500" : "bg-green-500"
            )}
            style={{ width: `${(timeLeft / TIMED_DURATION) * 100}%` }}
          />
        </div>
      )}

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          {isLoadingSpot && !question ? (
            <div className="text-center text-gray-500 py-20">
              <div className="text-4xl mb-4 animate-pulse">♠</div>
              <div>Loading training spot...</div>
            </div>
          ) : question ? (
            <QuizCard
              key={question.id + questionIndex}
              question={question}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={cn("text-xl font-bold", color)}>{value}</div>
    </div>
  );
}
