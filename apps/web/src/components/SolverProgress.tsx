"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SolverProgressProps {
  jobId?: string;
  /** WebSocket URL - defaults to current origin with /api/v1/solver/ws/{jobId} */
  wsUrl?: string;
  className?: string;
  /** API base URL for constructing WebSocket URL */
  apiBase?: string;
}

interface SolverStatus {
  status: "queued" | "running" | "complete" | "error";
  progress: number;
  iterations: number;
  estimatedTimeRemaining?: number;
  error?: string;
  stage?: string;
  infosets?: number;
}

export function SolverProgress({
  jobId,
  wsUrl,
  className,
  apiBase,
}: SolverProgressProps) {
  const [status, setStatus] = useState<SolverStatus>({
    status: "queued",
    progress: 0,
    iterations: 0,
  });
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!jobId) return null;

    // Determine WebSocket URL
    let wsEndpoint: string;
    if (wsUrl) {
      wsEndpoint = wsUrl.includes("?")
        ? `${wsUrl}&jobId=${jobId}`
        : `${wsUrl}/${jobId}`;
    } else {
      // Default: construct from apiBase or current origin
      const base = apiBase || (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
      // Strip protocol and use ws://
      const wsBase = base.replace(/^https?/, "");
      wsEndpoint = `${wsBase}/api/v1/solver/ws/${jobId}`;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    try {
      ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        setConnected(true);
        // Subscribe to job progress
        ws?.send("subscribe");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === "status") {
            // Initial status from server
            setStatus({
              status: data.status || data.job_id ? "running" : "queued",
              progress: data.progress || 0,
              iterations: data.iterations || 0,
              estimatedTimeRemaining: data.estimatedTimeRemaining,
              error: data.error,
              stage: data.stage,
              infosets: data.infosets,
            });
          } else if (data.type === "solve:progress" || data.type === "progress") {
            // Progress update
            setStatus((prev) => ({
              ...prev,
              status: data.status || "running",
              progress: (data.progress || 0) / 100, // Backend sends 0-100, we use 0-1
              iterations: data.iteration || data.iterations || prev.iterations,
              stage: data.stage,
              infosets: data.infosets,
            }));
          } else if (data.type === "solve:complete" || data.type === "complete") {
            setStatus((prev) => ({
              ...prev,
              status: "complete",
              progress: 1,
            }));
          } else if (data.type === "solve:error" || data.type === "error") {
            setStatus((prev) => ({
              ...prev,
              status: "error",
              error: data.error || "Unknown error",
            }));
          } else if (data.type === "pong") {
            // Ping response - connection alive
          } else if (data.status) {
            // Fallback: direct status field
            setStatus({
              status: data.status || "running",
              progress: data.progress || 0,
              iterations: data.iterations || 0,
              estimatedTimeRemaining: data.estimatedTimeRemaining,
              error: data.error,
              stage: data.stage,
              infosets: data.infosets,
            });
          }
        } catch (e) {
          console.error("Failed to parse solver status:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Don't reconnect if job is complete
        const currentStatus = status.status;
        if (currentStatus !== "complete" && currentStatus !== "error") {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        // Let onclose handle reconnection
      };
    } catch (e) {
      console.error("WebSocket connection failed:", e);
    }

    return { ws, timeout: reconnectTimeout };
  }, [jobId, wsUrl, apiBase]);

  useEffect(() => {
    if (!jobId) return;

    const result = connect();
    
    return () => {
      if (result?.timeout) clearTimeout(result.timeout);
      result?.ws?.close();
    };
  }, [jobId, connect]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              connected
                ? status.status === "running"
                  ? "bg-blue-500 animate-pulse"
                  : status.status === "complete"
                  ? "bg-green-500"
                  : status.status === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
                : "bg-gray-500"
            )}
          />
          <span className="text-sm font-medium capitalize">{status.status}</span>
          {status.stage && (
            <span className="text-xs text-muted-foreground ml-2">
              ({status.stage})
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            status.status === "complete" ? "bg-green-500" : "bg-blue-500"
          )}
          style={{ width: `${status.progress * 100}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="space-x-4">
          <span>
            <span className="text-muted-foreground">Progress: </span>
            <span className="font-mono">{(status.progress * 100).toFixed(1)}%</span>
          </span>
          <span>
            <span className="text-muted-foreground">Iterations: </span>
            <span className="font-mono">{status.iterations.toLocaleString()}</span>
          </span>
          {status.infosets !== undefined && (
            <span>
              <span className="text-muted-foreground">Infosets: </span>
              <span className="font-mono">{status.infosets.toLocaleString()}</span>
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          ETA: {formatTime(status.estimatedTimeRemaining)}
        </span>
      </div>

      {/* Error message */}
      {status.error && (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
          {status.error}
        </div>
      )}
    </div>
  );
}

export default SolverProgress;