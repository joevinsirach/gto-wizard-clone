"use client";

import { useState, useCallback, useMemo, useRef } from "react";

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
  
  // Use ref to track request for abort handling
  const requestRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const calculateICM = useCallback(async (request: ICMCalculationRequest) => {
    // Abort any pending request
    if (requestRef.current) {
      requestRef.current.abort();
    }
    requestRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/icm/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: requestRef.current.signal,
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
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Silently ignore aborted requests
      }
      const message = err instanceof Error ? err.message : "ICM calculation failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    calculateICM,
    results,
    totalPrizePool,
    totalChips,
    loading,
    error,
    clearError,
  }), [calculateICM, results, totalPrizePool, totalChips, loading, error, clearError]);
}
