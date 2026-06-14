/**
 * API client library - stub implementation
 * Real implementation should connect to the backend API
 */

export interface HHHand {
  id: string;
  hand_id: string;
  gameType: string;
  limit: string;
  date: string;
  players: Array<{
    name: string;
    seat: number;
    stack: number;
    cards?: [string, string];
    isHero?: boolean;
  }>;
  actions: Array<{
    type: string;
    player: string;
    amount?: number;
    street: string;
    potAfter?: number;
  }>;
  board?: string[];
  pot: number;
  winner?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export const api = {
  /**
   * Fetch a single hand by ID
   */
  async getHand(handId: string): Promise<HHHand | null> {
    try {
      const response = await fetch(`/api/v1/hh/hands/${handId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  /**
   * Fetch hand history list
   */
  async getHands(params?: {
    limit?: number;
    offset?: number;
    player?: string;
  }): Promise<HHHand[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.player) searchParams.set('player', params.player);

      const response = await fetch(`/api/v1/hh/hands?${searchParams}`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  /**
   * Generic fetch wrapper for API calls
   */
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },
};

export default api;


/** Variant metadata from the backend */
export interface VariantInfo {
  key: string
  name: string
  short_name: string
  category: "flop" | "stud" | "draw"
  hole_count: number
  board_count: number
  description: string
}

export interface EquityResult {
  hero_equity: number
  villain_equity: number | null
  iterations: number
  variant: string
  variant_name: string
}

/** Variant-specific API methods */
export const variantApi = {
  async list(): Promise<VariantInfo[]> {
    try {
      const res = await fetch("/api/v1/variants")
      if (!res.ok) return []
      const data = await res.json()
      return data.variants ?? []
    } catch { return [] }
  },

  async get(key: string): Promise<VariantInfo | null> {
    try {
      const res = await fetch(`/api/v1/variants/${key}`)
      if (!res.ok) return null
      return await res.json()
    } catch { return null }
  },

  async equity(key: string, hero: string, villain: string, board = "", iterations = 100000): Promise<EquityResult | null> {
    try {
      const res = await fetch(`/api/v1/variants/${key}/equity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero_range: hero, villain_range: villain, board, iterations }),
      })
      if (!res.ok) return null
      return await res.json()
    } catch { return null }
  },
}
