"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { QuizCard, QuizQuestion } from "@/components/train/QuizCard";
import Link from "next/link";

// Sample missed spots - in production this would come from API/hooks
const SAMPLE_MISSED_SPOTS: QuizQuestion[] = [
  {
    id: "review-1",
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
    explanation: "With top two pair on a dry board, calling allows you to extract value from worse hands while keeping your range balanced. The key insight is that raising would thin out your value range and make you more readable.",
  },
  {
    id: "review-2",
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
    explanation: "Facing a raise with a gutshot straight draw and backdoor flush, the pot odds don't justify calling. The math shows you need at least 25% equity to call, but you only have about 18% here. Folding preserves your stack for better spots.",
  },
  {
    id: "review-3",
    hand: "QJs",
    board: "Kd5s2h",
    potSize: 65,
    stackDepth: 120,
    position: "BTN",
    correctAction: "call",
    gtoFrequency: 0.60,
    gtoEV: 0.55,
    options: [
      { action: "raise", ev: 0.45, frequency: 0.30 },
      { action: "call", ev: 0.55, frequency: 0.60 },
      { action: "fold", ev: 0, frequency: 0.10 },
    ],
    category: "Post-flop",
    difficulty: "medium",
    explanation: "With a flush draw and overcard, calling is optimal as you have good equity against their calling range and can realize your equity cheaply. Raising would commit you too deeply with a hand that needs to see more cards.",
  },
];

interface ReviewStats {
  totalReviewed: number;
  remaining: number;
  mastered: number;
}

export default function ReviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [mastered, setMastered] = useState<Set<string>>(new Set());

  const missedSpots = SAMPLE_MISSED_SPOTS;
  const currentSpot = missedSpots[currentIndex];
  
  const stats: ReviewStats = {
    totalReviewed: reviewed.size,
    remaining: missedSpots.length - reviewed.size,
    mastered: mastered.size,
  };

  const handleAnswer = (action: string, isCorrect: boolean, evLoss: number) => {
    setReviewed((prev) => new Set([...prev, currentSpot.id]));
    if (isCorrect) {
      setMastered((prev) => new Set([...prev, currentSpot.id]));
    }
  };

  const goToNext = () => {
    if (currentIndex < missedSpots.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const resetProgress = () => {
    setReviewed(new Set());
    setMastered(new Set());
    setCurrentIndex(0);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/train"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-poker-gold">Review Mode</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-9">
            Revisit missed spots with GTO explanations
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-gray-800 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Mastered</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-poker-gold">
            {currentIndex + 1} / {missedSpots.length}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          {missedSpots.map((spot, i) => {
            const isReviewed = reviewed.has(spot.id);
            const isMastered = mastered.has(spot.id);
            const isCurrent = i === currentIndex;
            
            return (
              <div
                key={spot.id}
                className={cn(
                  "h-full transition-all",
                  isMastered
                    ? "bg-green-500"
                    : isReviewed
                    ? "bg-blue-500"
                    : isCurrent
                    ? "bg-poker-gold"
                    : "bg-gray-700"
                )}
                style={{ width: `${100 / missedSpots.length}%` }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{stats.remaining} remaining</span>
          <span>{stats.mastered} mastered</span>
        </div>
      </div>

      {/* Current Spot */}
      {currentSpot ? (
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-6 border border-gray-800">
          {/* Spot Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                currentSpot.difficulty === "easy" && "bg-green-500/20 text-green-400",
                currentSpot.difficulty === "medium" && "bg-yellow-500/20 text-yellow-400",
                currentSpot.difficulty === "hard" && "bg-red-500/20 text-red-400"
              )}>
                {currentIndex + 1}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Missed Spot</div>
                <div className="font-semibold">{currentSpot.category}</div>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded text-sm font-semibold capitalize",
              currentSpot.difficulty === "easy" && "bg-green-500/20 text-green-400",
              currentSpot.difficulty === "medium" && "bg-yellow-500/20 text-yellow-400",
              currentSpot.difficulty === "hard" && "bg-red-500/20 text-red-400"
            )}>
              {currentSpot.difficulty}
            </div>
          </div>

          {/* Quiz Card */}
          <QuizCard
            key={currentSpot.id}
            question={currentSpot}
            onAnswer={handleAnswer}
            showFeedback={true}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-800">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2",
                currentIndex === 0
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2">
              {missedSpots.map((spot, i) => (
                <button
                  key={spot.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i === currentIndex
                      ? "bg-poker-gold scale-125"
                      : mastered.has(spot.id)
                      ? "bg-green-500"
                      : reviewed.has(spot.id)
                      ? "bg-blue-500"
                      : "bg-gray-700 hover:bg-gray-600"
                  )}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              disabled={currentIndex === missedSpots.length - 1}
              className={cn(
                "px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2",
                currentIndex === missedSpots.length - 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-poker-gold text-black hover:bg-yellow-400"
              )}
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* All spots reviewed */
        <div className="bg-gray-900/80 backdrop-blur rounded-xl p-8 border border-gray-800 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Review Complete!</h2>
          <p className="text-muted-foreground mb-6">
            You've reviewed all your missed spots.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.mastered}</div>
              <div className="text-sm text-muted-foreground">Mastered</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {missedSpots.length - stats.mastered}
              </div>
              <div className="text-sm text-muted-foreground">Need More Practice</div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetProgress}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Reset Progress
            </button>
            <Link
              href="/train"
              className="px-6 py-3 bg-poker-gold text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Back to Training
            </Link>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          GTO Study Tips
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Focus on understanding <strong className="text-foreground">why</strong> a play is correct, not just memorizing answers</li>
          <li>• Pay attention to the EV difference between options - it shows the cost of mistakes</li>
          <li>• Review difficult spots multiple times until the correct play becomes intuitive</li>
          <li>• Consider pot odds, implied odds, and reverse implied odds in each spot</li>
        </ul>
      </div>
    </div>
  );
}