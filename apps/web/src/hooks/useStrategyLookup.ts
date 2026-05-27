"use client";

import { useState, useCallback } from "react";

/**
 * Strategy cell data structure
 */
export interface StrategyCell {
  action: string;
  frequency: number;
  ev: number;
}

/**
 * Lookup parameters for fetching strategy
 */
export interface LookupParams {
  board: string;
  stackDepth: number;
  position: string;
  street?: "preflop" | "flop" | "turn" | "river";
  betSize?: number;
}

/**
 * Response from strategy lookup API
 */
export interface StrategyLookupResponse {
  key: string;
  game_type: string;
  players: number;
  street: string;
  board: string;
  board_hash: string;
  bet_size: number;
  stack_depth: number;
  position: string;
  strategy: Record<string, StrategyCell>;
  status: string;
}

/**
 * Hook return type
 */
export interface UseStrategyLookupReturn {
  /** Fetch strategy data from API */
  lookupStrategy: (params: LookupParams) => Promise<Record<string, StrategyCell> | null>;
  /** Whether a lookup is in progress */
  loading: boolean;
  /** Error message if lookup failed */
  error: string | null;
  /** Last successful lookup result */
  lastResult: StrategyLookupResponse | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for looking up GTO strategy data from the API.
 * 
 * @param apiEndpoint - Base URL for the strategy lookup API
 * @returns Object with lookupStrategy function, loading state, and error
 * 
 * @example
 * ```tsx
 * const { lookupStrategy, loading, error } = useStrategyLookup();
 * 
 * const strategy = await lookupStrategy({
 *   board: "Kh8c3d",
 *   stackDepth: 100,
 *   position: "BTN",
 *   street: "river",
 *   betSize: 0.5,
 * });
 * ```
 */
export function useStrategyLookup(
  apiEndpoint: string = "/api/v1/strategy-lookup"
): UseStrategyLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StrategyLookupResponse | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const lookupStrategy = useCallback(
    async (params: LookupParams): Promise<Record<string, StrategyCell> | null> => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const queryParams = new URLSearchParams({
          board: params.board,
          stack_depth: params.stackDepth.toString(),
          position: params.position,
        });

        if (params.street) {
          queryParams.set("street", params.street);
        }
        if (params.betSize !== undefined) {
          queryParams.set("bet_size", params.betSize.toString());
        }

        const url = `${apiEndpoint}?${queryParams.toString()}`;
        
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.detail || 
              `Strategy not found for board=${params.board}, stack=${params.stackDepth}bb`
            );
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data: StrategyLookupResponse = await response.json();
        
        if (data.status !== "found") {
          throw new Error(`Strategy lookup returned status: ${data.status}`);
        }

        setLastResult(data);
        return data.strategy;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to lookup strategy";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint]
  );

  return {
    lookupStrategy,
    loading,
    error,
    lastResult,
    clearError,
  };
}

/**
 * Parse board string to determine street.
 * 
 * @param board - Board cards like "Kd7h2c" or "preflop"
 * @returns Street name: preflop, flop, turn, or river
 * 
 * @example
 * ```ts
 * parseBoardToStreet("Kd7h2c") // "flop"
 * parseBoardToStreet("Kd7h2c9s") // "turn"
 * parseBoardToStreet("Kd7h2c9s2d") // "river"
 * parseBoardToStreet("preflop") // "preflop"
 * ```
 */
export function parseBoardToStreet(board: string): "preflop" | "flop" | "turn" | "river" {
  if (!board || board.toLowerCase() === "preflop") {
    return "preflop";
  }

  // Remove spaces and count cards
  const cards = board.replace(" ", "");
  const numCards = cards.length / 2; // Each card is 2 chars

  switch (numCards) {
    case 3:
      return "flop";
    case 4:
      return "turn";
    case 5:
      return "river";
    default:
      return "flop";
  }
}

/**
 * Get common board presets for testing/demo.
 */
export function getCommonBoards(): Array<{ label: string; board: string; street: "flop" | "turn" | "river" }> {
  return [
    { label: "AK2 Rainbow", board: "AhKd2c", street: "flop" },
    { label: "AK2 Two-Tone", board: "AhKh2c", street: "flop" },
    { label: "AK2 Monotone", board: "AhKh2h", street: "flop" },
    { label: "QQ2 Rainbow", board: "QdQh2c", street: "flop" },
    { label: "QJ9 All", board: "QdJd9c", street: "flop" },
    { label: "T95 All", board: "Td9d5c", street: "flop" },
    { label: "KQ8r", board: "KcQh8c", street: "flop" },
    { label: "AK2 + Turn", board: "AhKd2c9s", street: "turn" },
    { label: "AK2 + Turn", board: "AhKd2c9d", street: "turn" },
    { label: "AK2 + River", board: "AhKd2c9s2d", street: "river" },
    { label: "QJ9 + Turn", board: "QdJd9cKs", street: "turn" },
    { label: "QJ9 + River", board: "QdJd9cKsTd", street: "river" },
  ];
}

/**
 * Get common positions for 6-max poker.
 */
export function getCommonPositions(): Array<{ value: string; label: string }> {
  return [
    { value: "BTN", label: "Button" },
    { value: "CO", label: "Cutoff" },
    { value: "HJ", label: "Hijack" },
    { value: "LJ", label: "Lojack" },
    { value: "SB", label: "Small Blind" },
    { value: "BB", label: "Big Blind" },
  ];
}

/**
 * Get common stack depths.
 */
export function getCommonStackDepths(): Array<{ value: number; label: string }> {
  return [
    { value: 50, label: "50bb" },
    { value: 75, label: "75bb" },
    { value: 100, label: "100bb" },
    { value: 125, label: "125bb" },
    { value: 150, label: "150bb" },
    { value: 200, label: "200bb" },
  ];
}

/**
 * Get common bet sizes.
 */
export function getCommonBetSizes(): Array<{ value: number; label: string }> {
  return [
    { value: 0.25, label: "25% pot" },
    { value: 0.33, label: "33% pot" },
    { value: 0.5, label: "50% pot" },
    { value: 0.67, label: "67% pot" },
    { value: 0.75, label: "75% pot" },
    { value: 1.0, label: "100% pot" },
  ];
}
