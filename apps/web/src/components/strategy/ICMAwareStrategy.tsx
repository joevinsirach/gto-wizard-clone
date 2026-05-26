"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ICMAwareStrategyProps {
  bubbleFactor: number;
  icmEquity: number;
  chipEquity: number;
  recommendedAction: "push" | "fold" | "call";
  confidence: "high" | "medium" | "low";
  explanation: string;
  handAdjustments?: Record<string, string>;
  className?: string;
}

function getConfidenceColor(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-red-400";
  }
}

function getConfidenceBg(confidence: "high" | "medium" | "low"): string {
  switch (confidence) {
    case "high":
      return "bg-green-500/20 border-green-500/30";
    case "medium":
      return "bg-yellow-500/20 border-yellow-500/30";
    case "low":
      return "bg-red-500/20 border-red-500/30";
  }
}

function getBubblePressureLevel(bf: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (bf > 1.5) {
    return {
      label: "Critical",
      color: "text-red-400",
      bgColor: "bg-red-500/20 border-red-500/30",
    };
  } else if (bf > 1.3) {
    return {
      label: "High",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20 border-orange-500/30",
    };
  } else if (bf > 1.15) {
    return {
      label: "Moderate",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20 border-yellow-500/30",
    };
  } else {
    return {
      label: "Normal",
      color: "text-green-400",
      bgColor: "bg-green-500/20 border-green-500/30",
    };
  }
}

function getActionColor(action: "push" | "fold" | "call"): string {
  switch (action) {
    case "push":
      return "text-green-400 bg-green-500/20";
    case "fold":
      return "text-red-400 bg-red-500/20";
    case "call":
      return "text-blue-400 bg-blue-500/20";
  }
}

export function ICMAwareStrategy({
  bubbleFactor,
  icmEquity,
  chipEquity,
  recommendedAction,
  confidence,
  explanation,
  handAdjustments = {},
  className,
}: ICMAwareStrategyProps) {
  const [showDetails, setShowDetails] = useState(false);

  const pressure = getBubblePressureLevel(bubbleFactor);
  const equityDiff = icmEquity - chipEquity;
  const equityDiffPercent = (equityDiff * 100).toFixed(2);

  return (
    <div
      className={cn(
        "border border-gray-800 rounded-lg p-4 bg-gray-900/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-poker-gold">
            ICM-Aware Strategy
          </h3>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium border",
              pressure.bgColor,
              pressure.color
            )}
          >
            {pressure.label}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-muted-foreground hover:text-white transition-colors"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Main Recommendation */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "px-4 py-2 rounded-lg font-bold text-lg uppercase",
            getActionColor(recommendedAction)
          )}
        >
          {recommendedAction}
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            Confidence:{" "}
            <span className={getConfidenceColor(confidence)}>{confidence}</span>
          </div>
          <div className="text-xs text-muted-foreground">{explanation}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-muted-foreground mb-1">
            Bubble Factor
          </div>
          <div className="text-lg font-mono font-bold">
            {bubbleFactor.toFixed(3)}
            <span className="text-xs text-muted-foreground ml-1">x</span>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-muted-foreground mb-1">ICM Equity</div>
          <div className="text-lg font-mono font-bold">
            {(icmEquity * 100).toFixed(1)}
            <span className="text-xs text-muted-foreground ml-1">%</span>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-muted-foreground mb-1">Chip Equity</div>
          <div className="text-lg font-mono font-bold">
            {(chipEquity * 100).toFixed(1)}
            <span className="text-xs text-muted-foreground ml-1">%</span>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-xs text-muted-foreground mb-1">ICM Adjustment</div>
          <div
            className={cn(
              "text-lg font-mono font-bold",
              equityDiff >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {equityDiff >= 0 ? "+" : ""}
            {equityDiffPercent}%
          </div>
        </div>
      </div>

      {/* Hand Adjustments */}
      {Object.keys(handAdjustments).length > 0 && (
        <div className="border-t border-gray-800 pt-4 mt-4">
          <div className="text-sm font-medium mb-2">Hand Adjustments</div>
          <div className="space-y-1">
            {Object.entries(handAdjustments).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed ICM Analysis */}
      {showDetails && (
        <div className="border-t border-gray-800 pt-4 mt-4 space-y-3">
          <div className="text-sm font-medium">ICM Analysis Details</div>

          <div className="bg-gray-800/30 rounded p-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Raw Chip Equity:</span>{" "}
                {(chipEquity * 100).toFixed(2)}%
              </div>
              <div>
                <span className="text-muted-foreground">ICM Equity:</span>{" "}
                {(icmEquity * 100).toFixed(2)}%
              </div>
              <div>
                <span className="text-muted-foreground">Difference:</span>{" "}
                <span className={equityDiff >= 0 ? "text-green-400" : "text-red-400"}>
                  {equityDiff >= 0 ? "+" : ""}
                  {equityDiffPercent}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Bubble Factor:</span>{" "}
                <span className={pressure.color}>{bubbleFactor.toFixed(3)}x</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="mb-2">
              Bubble factor &gt; 1.0 means your chips are worth more than their
              face value due to prize pool structure. Higher bubble factor = more
              valuable chips = tighter ranges recommended.
            </p>
            <p>
              When bubble factor &lt; 1.0, chips are worth less than face value
              (rare, usually in satellite situations), allowing for looser play.
            </p>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-muted-foreground">
        <span>ICM-adjusted recommendation</span>
        <span>
          {bubbleFactor > 1.3
            ? "Play tight"
            : bubbleFactor > 1.15
            ? "Slight caution"
            : "Standard play"}
        </span>
      </div>
    </div>
  );
}

export default ICMAwareStrategy;
