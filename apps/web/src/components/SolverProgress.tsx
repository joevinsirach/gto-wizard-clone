"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SolverProgressProps {
  jobId?: string;
  wsUrl?: string;
  className?: string;
}

interface SolverStatus {
  status: "queued" | "running" | "complete" | "error";
  progress: number;
  iterations: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

export function SolverProgress({
  jobId,
  wsUrl = "ws://localhost:8080/solver",
  className,
}: SolverProgressProps) {
  const [status, setStatus] = useState<SolverStatus>({
    status: "queued",
    progress: 0,
    iterations: 0,
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(`${wsUrl}?jobId=${jobId}`);

        ws.onopen = () => {
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setStatus({
              status: data.status || "running",
              progress: data.progress || 0,
              iterations: data.iterations || 0,
              estimatedTimeRemaining: data.estimatedTimeRemaining,
              error: data.error,
            });
          } catch (e) {
            console.error("Failed to parse solver status:", e);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        console.error("WebSocket connection failed:", e);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [jobId, wsUrl]);

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