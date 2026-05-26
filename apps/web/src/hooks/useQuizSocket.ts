"use client";

/**
 * React hook for quiz WebSocket events.
 * 
 * Provides a convenient interface for React components to:
 * - Connect to quiz sessions
 * - Listen for real-time quiz updates
 * - Track connection status
 * 
 * Usage:
 *   const { 
 *     isConnected, 
 *     leaderboard, 
 *     onAnswer,
 *     onProgress,
 *     onLeaderboardUpdate,
 *     onQuizComplete,
 *     joinSession,
 *     leaveSession
 *   } = useQuizSocket(quizSessionId);
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { quizSocket, QuizSocket } from '@/lib/socket';
import type {
  QuizUserAnsweredEvent,
  QuizProgressEvent,
  LeaderboardUpdateEvent,
  LeaderboardEntry,
  QuizCompleteEvent,
  QuizUserJoinedEvent,
  QuestionStartEvent,
} from '@/lib/socket';

export interface UseQuizSocketOptions {
  /** Quiz session ID to connect to */
  quizSessionId?: string;
  /** User ID for authentication */
  userId?: string;
  /** User display name */
  userName?: string;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Callback when user answers */
  onAnswer?: (event: QuizUserAnsweredEvent) => void;
  /** Callback when quiz progress updates */
  onProgress?: (event: QuizProgressEvent) => void;
  /** Callback when leaderboard updates */
  onLeaderboardUpdate?: (event: LeaderboardUpdateEvent) => void;
  /** Callback when quiz completes */
  onQuizComplete?: (event: QuizCompleteEvent) => void;
  /** Callback when user joins session */
  onUserJoined?: (event: QuizUserJoinedEvent) => void;
  /** Callback when question starts */
  onQuestionStart?: (event: QuestionStartEvent) => void;
  /** Callback when sync state received (initial state on join) */
  onSyncState?: (leaderboard: LeaderboardEntry[]) => void;
}

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  lastUpdated: string | null;
}

export interface UseQuizSocketReturn {
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Current quiz session ID */
  sessionId: string | null;
  /** Current leaderboard state */
  leaderboard: LeaderboardState;
  /** Connection error if any */
  error: Error | null;
  /** Join a quiz session */
  joinSession: (sessionId: string, userId?: string) => void;
  /** Leave the current quiz session */
  leaveSession: () => void;
  /** Submit an answer */
  submitAnswer: (questionId: string, action: 'raise' | 'call' | 'fold') => void;
  /** Manually refresh leaderboard */
  refreshLeaderboard: () => void;
}

/**
 * Hook for managing quiz WebSocket connection and events.
 */
export function useQuizSocket(options: UseQuizSocketOptions = {}): UseQuizSocketReturn {
  const {
    quizSessionId,
    userId,
    userName,
    autoConnect = true,
    onAnswer,
    onProgress,
    onLeaderboardUpdate,
    onQuizComplete,
    onUserJoined,
    onQuestionStart,
    onSyncState,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(quizSessionId || null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardState>({
    entries: [],
    lastUpdated: null,
  });
  const [error, setError] = useState<Error | null>(null);
  
  const socketRef = useRef<QuizSocket | null>(null);

  // Handle connection status changes
  useEffect(() => {
    const socket = quizSocket;
    socketRef.current = socket as any;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      console.log('[useQuizSocket] Connected');
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('[useQuizSocket] Disconnected:', reason);
    };

    const handleConnectError = (err: Error) => {
      setError(err);
      console.error('[useQuizSocket] Connection error:', err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set initial connection state based on socket state
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  // Set up quiz event listeners
  useEffect(() => {
    const socket = quizSocket;

    const handlers: Array<{ event: string; handler: (data: any) => void }> = [];

    if (onAnswer) {
      const handler = (data: QuizUserAnsweredEvent) => {
        console.log('[useQuizSocket] Answer event:', data);
        onAnswer(data);
      };
      socket.on('quiz:user_answered', handler);
      handlers.push({ event: 'quiz:user_answered', handler });
    }

    if (onProgress) {
      const handler = (data: QuizProgressEvent) => {
        console.log('[useQuizSocket] Progress event:', data);
        onProgress(data);
      };
      socket.on('quiz:progress', handler);
      handlers.push({ event: 'quiz:progress', handler });
    }

    if (onLeaderboardUpdate) {
      const handler = (data: LeaderboardUpdateEvent) => {
        console.log('[useQuizSocket] Leaderboard update:', data);
        setLeaderboard({
          entries: data.leaderboard,
          lastUpdated: data.timestamp,
        });
        onLeaderboardUpdate(data);
      };
      socket.on('quiz:leaderboard_update', handler);
      handlers.push({ event: 'quiz:leaderboard_update', handler });
    }

    if (onQuizComplete) {
      const handler = (data: QuizCompleteEvent) => {
        console.log('[useQuizSocket] Quiz complete:', data);
        onQuizComplete(data);
      };
      socket.on('quiz:complete', handler);
      handlers.push({ event: 'quiz:complete', handler });
    }

    if (onUserJoined) {
      const handler = (data: QuizUserJoinedEvent) => {
        console.log('[useQuizSocket] User joined:', data);
        onUserJoined(data);
      };
      socket.on('quiz:user_joined', handler);
      handlers.push({ event: 'quiz:user_joined', handler });
    }

    if (onQuestionStart) {
      const handler = (data: QuestionStartEvent) => {
        console.log('[useQuizSocket] Question start:', data);
        onQuestionStart(data);
      };
      socket.on('quiz:question_start', handler);
      handlers.push({ event: 'quiz:question_start', handler });
    }

    if (onSyncState) {
      const handler = (data: { leaderboard: LeaderboardEntry[] }) => {
        console.log('[useQuizSocket] Sync state:', data);
        setLeaderboard({
          entries: data.leaderboard || [],
          lastUpdated: new Date().toISOString(),
        });
        onSyncState(data.leaderboard);
      };
      socket.on('quiz:sync_state', handler);
      handlers.push({ event: 'quiz:sync_state', handler });
    }

    return () => {
      handlers.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, [
    onAnswer,
    onProgress,
    onLeaderboardUpdate,
    onQuizComplete,
    onUserJoined,
    onQuestionStart,
    onSyncState,
  ]);

  // Auto-connect to session if autoConnect is enabled
  useEffect(() => {
    if (autoConnect && quizSessionId && socketRef.current) {
      joinSession(quizSessionId, userId);
    }
  }, [autoConnect, quizSessionId, userId]);

  /**
   * Join a quiz session.
   */
  const joinSession = useCallback((newSessionId: string, newUserId?: string) => {
    const socket = socketRef.current || quizSocket;
    const id = newUserId || userId;
    
    console.log('[useQuizSocket] Joining session:', newSessionId, 'user:', id);
    
    socket.emit('join_quiz_session', {
      quiz_session_id: newSessionId,
      user_id: id,
      user_name: userName,
    });
    
    setSessionId(newSessionId);
  }, [userId, userName]);

  /**
   * Leave the current quiz session.
   */
  const leaveSession = useCallback(() => {
    const socket = socketRef.current || quizSocket;
    
    console.log('[useQuizSocket] Leaving session:', sessionId);
    
    socket.emit('leave_quiz_session');
    
    setSessionId(null);
    setLeaderboard({ entries: [], lastUpdated: null });
  }, [sessionId]);

  /**
   * Submit an answer (emit to server).
   */
  const submitAnswer = useCallback((
    questionId: string,
    action: 'raise' | 'call' | 'fold'
  ) => {
    const socket = socketRef.current || quizSocket;
    
    if (!sessionId) {
      console.warn('[useQuizSocket] Cannot submit answer - no active session');
      return;
    }
    
    console.log('[useQuizSocket] Submitting answer:', { questionId, action });
    
    socket.emit('quiz_answer', {
      quiz_session_id: sessionId,
      user_id: userId,
      question_id: questionId,
      selected_action: action,
    });
  }, [sessionId, userId]);

  /**
   * Request leaderboard refresh.
   */
  const refreshLeaderboard = useCallback(() => {
    const socket = socketRef.current || quizSocket;
    
    if (!sessionId) {
      console.warn('[useQuizSocket] Cannot refresh leaderboard - no active session');
      return;
    }
    
    socket.emit('request_leaderboard', { quiz_session_id: sessionId });
  }, [sessionId]);

  return {
    isConnected,
    sessionId,
    leaderboard,
    error,
    joinSession,
    leaveSession,
    submitAnswer,
    refreshLeaderboard,
  };
}

export default useQuizSocket;
