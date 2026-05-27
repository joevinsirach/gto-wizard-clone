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
