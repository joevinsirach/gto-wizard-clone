"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BoardCard } from "@/components/hh/BoardDisplay";

export type Action = "raise" | "call" | "fold";

export interface QuizOption {
  action: Action;
  ev: number;
  frequency: number;
}

export interface QuizQuestion {
  id: string;
  hand: string;
  board?: string;
  potSize: number;
  stackDepth: number;
  position: string;
  correctAction: Action;
  gtoFrequency: number;
  gtoEV: number;
  options: QuizOption[];
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  explanation?: string;
}

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (action: Action, isCorrect: boolean, evLoss: number) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  className?: string;
}

export function QuizCard({
  question,
  onAnswer,
  disabled = false,
  showFeedback = true,
  className,
}: QuizCardProps) {
  const [selected, setSelected] = useState<Action | null>(null);
  const [showResult, setShowResult] = useState(false);

  const parsedBoard = useMemo(() => {
    if (!question.board) return null;
    const cards: string[] = [];
    for (let i = 0; i < question.board.length - 1; i += 2) {
      cards.push(question.board.slice(i, i + 2));
    }
    return {
      flop: cards.length >= 3 ? [cards[0], cards[1], cards[2]] as [string, string, string] : null,
      turn: cards.length >= 4 ? cards[3] : null,
      river: cards.length >= 5 ? cards[4] : null,
    };
  }, [question.board]);

  const getCard = (cardStr: string) => {
    if (!cardStr || cardStr.length < 2) return null;
    const rank = cardStr[0].toUpperCase() as any;
    const suit = cardStr[1] as any;
    const suitMap: Record<string, any> = { "h": "♥", "d": "♦", "c": "♣", "s": "♠" };
    return { rank, suit: suitMap[suit] || suit };
  };

  const handleSelect = (action: Action) => {
    if (disabled || showResult) return;
    
    setSelected(action);
    setShowResult(true);
    
    const isCorrect = action === question.correctAction;
    const selectedOption = question.options.find((o) => o.action === action);
    const evLoss = selectedOption ? Math.max(0, question.gtoEV - selectedOption.ev) : 0;
    
    onAnswer(action, isCorrect, evLoss);
  };

  const reset = () => {
    setSelected(null);
    setShowResult(false);
  };

  const isCorrect = selected === question.correctAction;
  const evLoss = selected
    ? (question.options.find((o) => o.action === selected)?.ev ?? question.gtoEV) - question.gtoEV
    : 0;
  const absEvLoss = Math.abs(evLoss);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Scenario Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1.5 rounded-lg bg-poker-gold/20 text-poker-gold font-bold text-lg border border-poker-gold/30">
            {question.hand}
          </span>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Position</span>
            <span className="font-semibold text-foreground">{question.position}</span>
          </div>
          {question.category && (
            <div className="px-2 py-1 rounded bg-gray-800 text-xs text-muted-foreground">
              {question.category}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Pot</span>
            <span className="font-mono font-semibold text-foreground">{question.potSize}bb</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Stack</span>
            <span className="font-mono font-semibold text-foreground">{question.stackDepth}bb</span>
          </div>
          {question.difficulty && (
            <div className={cn(
              "px-2 py-1 rounded text-xs font-semibold",
              question.difficulty === "easy" && "bg-green-500/20 text-green-400 border border-green-500/30",
              question.difficulty === "medium" && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
              question.difficulty === "hard" && "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              {question.difficulty}
            </div>
          )}
        </div>
      </div>

      {/* Board Cards */}
      {parsedBoard && (
        <div className="flex justify-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          {/* Flop */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Flop</span>
            <div className="flex gap-2">
              {parsedBoard.flop?.map((card, i) => {
                const c = getCard(card);
                return c ? (
                  <BoardCard key={`flop-${i}`} card={c} />
                ) : (
                  <BoardCard key={`flop-${i}`} card={null} />
                );
              })}
            </div>
          </div>
          
          {/* Turn */}
          {parsedBoard.turn && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Turn</span>
              <BoardCard card={getCard(parsedBoard.turn)} />
            </div>
          )}
          
          {/* River */}
          {parsedBoard.river && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">River</span>
              <BoardCard card={getCard(parsedBoard.river)} />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {(["raise", "call", "fold"] as const).map((action) => {
          const option = question.options.find((o) => o.action === action);
          const isSelected = selected === action;
          const isCorrectAction = action === question.correctAction;

          let buttonClass = "relative transition-all duration-200";
          let ringClass = "";
          
          if (showFeedback && showResult) {
            if (isCorrectAction) {
              ringClass = "ring-3 ring-green-500 shadow-lg shadow-green-500/30";
            } else if (isSelected && !isCorrect) {
              ringClass = "ring-3 ring-red-500 shadow-lg shadow-red-500/30";
            }
          }

          return (
            <button
              key={action}
              onClick={() => handleSelect(action)}
              disabled={disabled || showResult}
              className={cn(
                "py-5 px-4 rounded-xl font-bold text-lg uppercase tracking-wide",
                "transition-all hover:scale-105 active:scale-95",
                action === "raise" && "bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg",
                action === "call" && "bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg",
                action === "fold" && "bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg",
                showResult && "opacity-60 cursor-not-allowed hover:scale-100",
                ringClass,
                buttonClass
              )}
            >
              <div className="capitalize">{action}</div>
              {option && (
                <div className="text-sm font-normal mt-1 opacity-80">
                  {(option.frequency * 100).toFixed(0)}% GTO
                </div>
              )}
              {showFeedback && showResult && isCorrectAction && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
              {showFeedback && showResult && isSelected && !isCorrect && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  ✗
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Panel */}
      {showFeedback && showResult && (
        <div
          className={cn(
            "p-5 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2",
            isCorrect 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-red-500/10 border-red-500/30"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {isCorrect ? "✓" : "✗"}
              </div>
              <div>
                <div className="text-xl font-bold">
                  {isCorrect ? "Correct!" : "Incorrect"}
                </div>
                <div className="text-sm text-muted-foreground">
                  GTO would {question.correctAction} with {(question.gtoFrequency * 100).toFixed(0)}% frequency
                </div>
              </div>
            </div>
            {!isCorrect && (
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">-{absEvLoss.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground">EV Loss</div>
              </div>
            )}
          </div>

          {/* EV Comparison */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
            {(["raise", "call", "fold"] as const).map((action) => {
              const opt = question.options.find((o) => o.action === action);
              const actionEvLoss = opt ? Math.max(0, question.gtoEV - opt.ev) : 0;
              const isBestAction = action === question.correctAction;
              
              return (
                <div 
                  key={action} 
                  className={cn(
                    "text-center p-3 rounded-lg transition-all",
                    isBestAction && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className={cn(
                    "text-sm font-semibold uppercase mb-2",
                    isBestAction ? "text-green-400" : "text-muted-foreground"
                  )}>
                    {action}
                    {isBestAction && " ✓"}
                  </div>
                  <div className="font-mono text-lg">
                    {opt?.ev.toFixed(3) ?? "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(opt?.frequency ?? 0) * 100}% freq
                  </div>
                  {actionEvLoss > 0 && !isBestAction && (
                    <div className="text-xs text-red-400 mt-1">
                      -{actionEvLoss.toFixed(3)} EV
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm font-semibold text-blue-400 mb-2">GTO Explanation</div>
              <div className="text-sm text-muted-foreground">{question.explanation}</div>
            </div>
          )}
        </div>
      )}

      {/* Next Question Button */}
      {showResult && (
        <button
          onClick={reset}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
        >
          Next Question
        </button>
      )}
    </div>
  );
}

export default QuizCard;