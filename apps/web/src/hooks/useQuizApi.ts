"use client";

/**
 * React hook for Quiz API calls.
 * 
 * Provides interface for:
 * - Fetching random quiz spots
 * - Submitting answers
 * - Getting user stats
 * - Getting available categories
 * 
 * Usage:
 *   const { spot, fetchRandomSpot, submitAnswer, stats, isLoading } = useQuizApi();
 */

import { useState, useCallback } from "react";

export interface QuizOption {
  action: "raise" | "call" | "fold";
  ev: number;
  frequency: number;
}

export interface QuizSpot {
  id: string;
  game_type: string;
  category: string;
  difficulty: string;
  position: string;
  hero_hand: string;
  board: string | null;
  turn: string | null;
  river: string | null;
  pot_size: number;
  stack_depth: number;
  gto_action: string;
  gto_frequency: number;
  gto_ev: number;
  options: Record<string, QuizOption[]>;
  street: string;
  explanation: string | null;
}

export interface QuizAnswerRequest {
  spot_id: string;
  user_id: string;
  user_name?: string;
  selected_action: "raise" | "call" | "fold";
  time_taken_ms?: number;
  session_id?: string;
}

export interface QuizAnswerResponse {
  is_correct: boolean;
  ev_loss: number;
  gto_action: string;
  gto_frequency: number;
  gto_ev: number;
  user_accuracy: number;
  current_streak: number;
  points_earned: number;
  total_points: number;
}

export interface UserStats {
  user_id: string;
  total_solves: number;
  correct_count: number;
  accuracy: number;
  current_streak: number;
  max_streak: number;
  points: number;
  level: number;
  avg_ev_loss: number;
  weak_spots: Record<string, { correct: number; total: number }>;
  accuracy_history: number[];
}

export interface Category {
  category: string;
  count?: number;
}

interface UseQuizApiReturn {
  // Current data
  spot: QuizSpot | null;
  stats: UserStats | null;
  categories: Category[];
  // Loading states
  isLoadingSpot: boolean;
  isSubmitting: boolean;
  isLoadingStats: boolean;
  isLoadingCategories: boolean;
  // Errors
  spotError: string | null;
  submitError: string | null;
  statsError: string | null;
  categoriesError: string | null;
  // Actions
  fetchRandomSpot: (category?: string, difficulty?: string) => Promise<QuizSpot | null>;
  submitAnswer: (answer: QuizAnswerRequest) => Promise<QuizAnswerResponse | null>;
  fetchUserStats: (userId: string) => Promise<UserStats | null>;
  fetchCategories: () => Promise<Category[]>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function useQuizApi(): UseQuizApiReturn {
  const [spot, setSpot] = useState<QuizSpot | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoadingSpot, setIsLoadingSpot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [spotError, setSpotError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const fetchRandomSpot = useCallback(async (
    category?: string,
    difficulty?: string
  ): Promise<QuizSpot | null> => {
    setIsLoadingSpot(true);
    setSpotError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);

      const url = `${API_BASE}/api/v1/quiz/random${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to fetch spot" }));
        throw new Error(err.detail || "Failed to fetch spot");
      }

      const data: QuizSpot = await res.json();
      // Normalize options from API format if needed
      if (data.options && typeof data.options === "object") {
        const normalizedOptions: Record<string, QuizOption[]> = {};
        for (const [key, value] of Object.entries(data.options)) {
          if (Array.isArray(value)) {
            normalizedOptions[key] = value as QuizOption[];
          }
        }
        data.options = normalizedOptions;
      }

      setSpot(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSpotError(msg);
      setSpot(null);
      return null;
    } finally {
      setIsLoadingSpot(false);
    }
  }, []);

  const submitAnswer = useCallback(async (
    answer: QuizAnswerRequest
  ): Promise<QuizAnswerResponse | null> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to submit answer" }));
        throw new Error(err.detail || "Failed to submit answer");
      }

      const data: QuizAnswerResponse = await res.json();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSubmitError(msg);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const fetchUserStats = useCallback(async (
    userId: string
  ): Promise<UserStats | null> => {
    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/quiz/stats/${userId}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to fetch stats" }));
        throw new Error(err.detail || "Failed to fetch stats");
      }

      const data: UserStats = await res.json();
      setStats(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatsError(msg);
      setStats(null);
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    setIsLoadingCategories(true);
    setCategoriesError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/quiz/categories`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to fetch categories" }));
        throw new Error(err.detail || "Failed to fetch categories");
      }

      const data = await res.json();
      const cats = data.categories?.map((c: string) => ({ category: c })) || [];
      setCategories(cats);
      return cats;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCategoriesError(msg);
      setCategories([]);
      return [];
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  return {
    spot,
    stats,
    categories,
    isLoadingSpot,
    isSubmitting,
    isLoadingStats,
    isLoadingCategories,
    spotError,
    submitError,
    statsError,
    categoriesError,
    fetchRandomSpot,
    submitAnswer,
    fetchUserStats,
    fetchCategories,
  };
}

export default useQuizApi;
