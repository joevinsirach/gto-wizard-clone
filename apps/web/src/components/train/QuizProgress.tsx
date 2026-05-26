"use client";

/**
 * Real-time progress indicator for quiz sessions.
 * 
 * Displays:
 * - Current question number / total questions
 * - Progress bar
 * - Time remaining (if timed quiz)
 * - Live participant count
 * 
 * Updates are received via WebSocket events.
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import { cn } from '@/lib/utils';

export interface QuizProgressProps {
  /** Quiz session ID */
  quizSessionId: string;
  /** User ID for authentication */
  userId: string;
  /** Optional className for styling */
  className?: string;
  /** Callback when a question starts */
  onQuestionStart?: (questionIndex: number) => void;
  /** Callback when quiz completes */
  onQuizComplete?: () => void;
}

interface QuestionTimerProps {
  timeLimit: number | null;
  questionIndex: number;
}

function QuestionTimer({ timeLimit, questionIndex }: QuestionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimit);
  const [key, setKey] = useState(questionIndex);

  useEffect(() => {
    setKey(questionIndex);
    setTimeRemaining(timeLimit);
  }, [questionIndex, timeLimit]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timeRemaining, key]);

  if (timeLimit === null) return null;

  const percentage = timeLimit > 0 ? (timeRemaining || 0) / timeLimit : 0;
  const isLow = percentage < 0.2;

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-12 rounded-full border-2 border-poker-gold flex items-center justify-center">
        <span className={cn(
          "text-sm font-mono font-bold",
          isLow ? "text-red-500 animate-pulse" : "text-poker-gold"
        )}>
          {timeRemaining !== null ? Math.ceil(timeRemaining) : '--'}
        </span>
      </div>
      {percentage > 0 && (
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-100",
              isLow ? "bg-red-500" : "bg-poker-gold"
            )}
            style={{ width: `${percentage * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ParticipantCountProps {
  count: number;
}

function ParticipantCount({ count }: ParticipantCountProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <span>{count} participant{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

export function QuizProgress({
  quizSessionId,
  userId,
  className,
  onQuestionStart,
  onQuizComplete,
}: QuizProgressProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  const handleProgress = useCallback((event: { question_index: number; total_questions: number; time_remaining?: number }) => {
    setQuestionIndex(event.question_index);
    setTotalQuestions(event.total_questions);
    if (event.time_remaining !== undefined) {
      setTimeLimit(event.time_remaining);
    }
    onQuestionStart?.(event.question_index);
  }, [onQuestionStart]);

  const handleLeaderboardUpdate = useCallback((event: { leaderboard: Array<{ user_id: string }> }) => {
    setParticipantCount(event.leaderboard.length);
  }, []);

  const handleQuizComplete = useCallback(() => {
    onQuizComplete?.();
  }, [onQuizComplete]);

  const {
    isConnected,
    leaderboard,
    joinSession,
    leaveSession,
  } = useQuizSocket({
    quizSessionId,
    userId,
    autoConnect: true,
    onProgress: handleProgress as any,
    onLeaderboardUpdate: handleLeaderboardUpdate as any,
    onQuizComplete: handleQuizComplete as any,
  });

  const progressPercentage = totalQuestions > 0
    ? ((questionIndex) / totalQuestions) * 100
    : 0;

  return (
    <div className={cn("bg-gray-900/80 backdrop-blur rounded-lg p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-gray-500"
          )} />
          <span className="text-sm font-medium text-foreground">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <ParticipantCount count={participantCount || leaderboard.entries.length} />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-poker-gold to-yellow-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{Math.round(progressPercentage)}% complete</span>
          <span>{questionIndex} answered</span>
        </div>
      </div>

      {/* Timer (if applicable) */}
      <QuestionTimer
        timeLimit={timeLimit}
        questionIndex={questionIndex}
      />

      {/* Session info */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Session: {quizSessionId.slice(0, 8)}...
        </span>
        <button
          onClick={leaveSession}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default QuizProgress;
