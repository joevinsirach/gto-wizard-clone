"use client";

import { useState } from "react";
import { cn, formatBoard } from "@/lib/utils";
import { BoardCard } from "@/components/hh/BoardDisplay";

interface QuizQuestion {
  hand: string;
  board?: string;
  potSize: number;
  stackDepth: number;
  position: string;
  correctAction: "raise" | "call" | "fold";
  gtoFrequency: number;
  gtoEV: number;
  options: Array<{
    action: "raise" | "call" | "fold";
    ev: number;
    frequency: number;
  }>;
}

interface TrainQuizProps {
  question: QuizQuestion;
  onAnswer: (selectedAction: "raise" | "call" | "fold") => void;
  className?: string;
}

export function TrainQuiz({ question, onAnswer, className }: TrainQuizProps) {
  const [selected, setSelected] = useState<"raise" | "call" | "fold" | null>(null);
  const [showResult, setShowResult] = useState(false);

  const parsedBoard = question.board ? formatBoard(question.board) : null;

  const handleSelect = (action: "raise" | "call" | "fold") => {
    setSelected(action);
    setShowResult(true);
    onAnswer(action);
  };

  const isCorrect = selected === question.correctAction;
  const evLoss = selected ? question.gtoEV - (question.options.find(o => o.action === selected)?.ev || 0) : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Scenario info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded bg-poker-gold/20 text-poker-gold font-semibold">
            {question.hand}
          </span>
          <span className="text-sm text-muted-foreground">
            {question.position}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Pot: {question.potSize}bb</span>
          <span className="text-muted-foreground">Stack: {question.stackDepth}bb</span>
        </div>
      </div>

      {/* Board */}
      {parsedBoard && (
        <div className="flex justify-center gap-2">
          {parsedBoard.flop && parsedBoard.flop.map((card, i) => (
            <BoardCard
              key={`flop-${i}`}
              card={card ? { rank: card[0] as any, suit: card[1] as any } : null}
            />
          ))}
          {parsedBoard.turn && (
            <BoardCard
              card={{ rank: parsedBoard.turn[0] as any, suit: parsedBoard.turn[1] as any }}
            />
          )}
          {parsedBoard.river && (
            <BoardCard
              card={{ rank: parsedBoard.river[0] as any, suit: parsedBoard.river[1] as any }}
            />
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-4">
        {(["raise", "call", "fold"] as const).map((action) => {
          const option = question.options.find((o) => o.action === action);
          const isSelected = selected === action;
          const isCorrectAction = action === question.correctAction;

          let buttonClass = "relative";
          if (showResult) {
            if (isCorrectAction) {
              buttonClass += " ring-2 ring-green-500";
            } else if (isSelected && !isCorrect) {
              buttonClass += " ring-2 ring-red-500";
            }
          }

          return (
            <button
              key={action}
              onClick={() => !showResult && handleSelect(action)}
              disabled={showResult}
              className={cn(
                "py-6 px-4 rounded-lg font-semibold text-lg transition-all",
                action === "raise" && "bg-green-600 hover:bg-green-700 text-white",
                action === "call" && "bg-yellow-600 hover:bg-yellow-700 text-black",
                action === "fold" && "bg-red-600 hover:bg-red-700 text-white",
                showResult && "opacity-75 cursor-not-allowed",
                buttonClass
              )}
            >
              <div className="capitalize">{action}</div>
              {option && (
                <div className="text-sm font-normal mt-1 opacity-80">
                  {(option.frequency * 100).toFixed(0)}%
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Result */}
      {showResult && (
        <div
          className={cn(
            "p-4 rounded-lg text-center",
            isCorrect ? "bg-green-500/20 border border-green-500/50" : "bg-red-500/20 border border-red-500/50"
          )}
        >
          <div className="text-xl font-bold mb-2">
            {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
          </div>
          <div className="text-sm text-muted-foreground">
            {isCorrect ? (
              <span>GTO would {question.correctAction} with {(question.gtoFrequency * 100).toFixed(0)}% frequency</span>
            ) : (
              <span>
                The correct action was <span className="font-semibold capitalize">{question.correctAction}</span>. 
                Your choice cost you <span className="font-semibold text-red-400">{evLoss.toFixed(3)}</span> EV.
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
            {(["raise", "call", "fold"] as const).map((action) => {
              const opt = question.options.find((o) => o.action === action);
              return (
                <div key={action} className="text-center">
                  <div className="capitalize text-muted-foreground">{action}</div>
                  <div className="font-mono">EV: {opt?.ev.toFixed(3) || "N/A"}</div>
                  <div className="font-mono">Freq: {opt ? `${(opt.frequency * 100).toFixed(0)}%` : "N/A"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainQuiz;