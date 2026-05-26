"use client";

import { useState, useCallback } from "react";

export interface ICMApiResult {
  player: string;
  equity: number;
  chip_equity: number;
  bubble_factor: number;
  ev: number;
}

export interface ICMCalculationResponse {
  results: ICMApiResult[];
  total_prize_pool: number;
  total_chips: number;
}

export interface ICMCalculationRequest {
  stacks: number[];
  prizes: number[];
  players?: string[];
  n_simulations?: number;
}

interface UseICMCalculatorResult {
  calculateICM: (request: ICMCalculationRequest) => Promise<void>;
  results: ICMApiResult[] | null;
  totalPrizePool: number | null;
  totalChips: number | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useICMCalculator(): UseICMCalculatorResult {
  const [results, setResults] = useState<ICMApiResult[] | null>(null);
  const [totalPrizePool, setTotalPrizePool] = useState<number | null>(null);
  const [totalChips, setTotalChips] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const calculateICM = useCallback(async (request: ICMCalculationRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/icm/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data: ICMCalculationResponse = await response.json();
      setResults(data.results);
      setTotalPrizePool(data.total_prize_pool);
      setTotalChips(data.total_chips);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ICM calculation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calculateICM,
    results,
    totalPrizePool,
    totalChips,
    loading,
    error,
    clearError,
  };
}
