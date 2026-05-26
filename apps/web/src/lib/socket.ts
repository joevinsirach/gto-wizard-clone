/**
 * Socket.io client singleton for real-time quiz communication.
 * 
 * This module provides a singleton instance of the Socket.io client
 * that can be used throughout the application for WebSocket communication.
 * 
 * Usage:
 *   import { socket } from '@/lib/socket';
 *   
 *   // Connect to quiz session
 *   socket.emit('join_quiz_session', { quiz_session_id, user_id });
 *   
 *   // Listen for events
 *   socket.on('quiz:leaderboard_update', (data) => {
 *     console.log('Leaderboard updated:', data);
 *   });
 */

import { io, Socket } from 'socket.io-client';

// Socket.io connection URL - defaults to current origin with /api prefix
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Quiz namespace for quiz-specific events
const QUIZ_NAMESPACE = '/quiz';

// Event type definitions
export interface QuizUserAnsweredEvent {
  quiz_session_id: string;
  user_id: string;
  question_id: string;
  selected_action: 'raise' | 'call' | 'fold';
  is_correct: boolean;
  ev_loss: number;
  time_taken: number;
  timestamp: string;
}

export interface QuizProgressEvent {
  quiz_session_id: string;
  question_index: number;
  total_questions: number;
  time_remaining: number | null;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  accuracy: number;
  correct_count: number;
  avg_ev_loss: number;
  avg_time: number;
}

export interface LeaderboardUpdateEvent {
  quiz_session_id: string;
  leaderboard: LeaderboardEntry[];
  timestamp: string;
}

export interface QuizCompleteEvent {
  quiz_session_id: string;
  final_leaderboard: LeaderboardEntry[];
  session_stats: {
    total_participants: number;
    total_questions: number;
    avg_accuracy: number;
    completed_at: string;
  };
  timestamp: string;
}

export interface QuizUserJoinedEvent {
  quiz_session_id: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface QuestionStartEvent {
  quiz_session_id: string;
  question_id: string;
  question: {
    hand: string;
    board?: string;
    pot_size: number;
    stack_depth: number;
    position: string;
    options: Array<{
      action: 'raise' | 'call' | 'fold';
      ev: number;
      frequency: number;
    }>;
  };
  time_limit: number | null;
  timestamp: string;
}

export interface QuizSyncStateEvent {
  quiz_session_id: string;
  leaderboard: LeaderboardEntry[];
  timestamp: string;
}

// Event map for type-safe event handling
export interface QuizEvents {
  'quiz:user_answered': QuizUserAnsweredEvent;
  'quiz:progress': QuizProgressEvent;
  'quiz:leaderboard_update': LeaderboardUpdateEvent;
  'quiz:complete': QuizCompleteEvent;
  'quiz:user_joined': QuizUserJoinedEvent;
  'quiz:question_start': QuestionStartEvent;
  'quiz:sync_state': QuizSyncStateEvent;
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
}

// Socket.io client singleton
class SocketClient {
  private static _instance: Socket | null = null;
  private static _quizSocket: Socket | null = null;

  /**
   * Get the general purpose socket instance.
   * Used for solver progress and other non-quiz events.
   */
  static getInstance(): Socket {
    if (!SocketClient._instance) {
      SocketClient._instance = io(SOCKET_URL, {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      SocketClient._instance.on('connect', () => {
        console.log('[Socket] Connected to server');
      });

      SocketClient._instance.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      SocketClient._instance.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
      });
    }
    return SocketClient._instance;
  }

  /**
   * Get or create a socket specifically for quiz events.
   * Uses a separate namespace for quiz-specific communication.
   */
  static getQuizSocket(): Socket {
    if (!SocketClient._quizSocket) {
      const url = SOCKET_URL || window.location.origin;
      SocketClient._quizSocket = io(`${url}${QUIZ_NAMESPACE}`, {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
          // Auth can be added here if needed
        },
      });

      SocketClient._quizSocket.on('connect', () => {
        console.log('[QuizSocket] Connected to quiz namespace');
      });

      SocketClient._quizSocket.on('disconnect', (reason) => {
        console.log('[QuizSocket] Disconnected:', reason);
      });

      SocketClient._quizSocket.on('connect_error', (error) => {
        console.error('[QuizSocket] Connection error:', error);
      });
    }
    return SocketClient._quizSocket;
  }

  /**
   * Disconnect and cleanup all socket instances.
   */
  static disconnectAll(): void {
    if (SocketClient._instance) {
      SocketClient._instance.disconnect();
      SocketClient._instance = null;
    }
    if (SocketClient._quizSocket) {
      SocketClient._quizSocket.disconnect();
      SocketClient._quizSocket = null;
    }
  }
}

// Export singleton accessors
export const socket = SocketClient.getInstance();
export const quizSocket = SocketClient.getQuizSocket();

// Export convenience methods
export const connectToQuiz = (quizSessionId: string, userId?: string) => {
  const socket = SocketClient.getQuizSocket();
  socket.emit('join_quiz_session', { quiz_session_id: quizSessionId, user_id: userId });
  return socket;
};

export const disconnectFromQuiz = () => {
  const socket = SocketClient.getQuizSocket();
  socket.emit('leave_quiz_session');
};

export const emitQuizAnswer = (
  quizSessionId: string,
  userId: string,
  questionId: string,
  selectedAction: 'raise' | 'call' | 'fold'
) => {
  const socket = SocketClient.getQuizSocket();
  socket.emit('quiz_answer', {
    quiz_session_id: quizSessionId,
    user_id: userId,
    question_id: questionId,
    selected_action: selectedAction,
  });
};

export default socket;
