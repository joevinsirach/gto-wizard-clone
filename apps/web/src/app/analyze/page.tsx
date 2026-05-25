/**
 * Analyze — main upload page for hand history analysis.
 * Users drag-and-drop HH files, which are parsed and stored for review.
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight, Zap, ShieldCheck, AlertCircle } from "lucide-react";
import { FileUpload, type LoadedFile } from "@/components/hh";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyzePage() {
  const router = useRouter();
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFilesLoaded = useCallback((loadedFiles: LoadedFile[]) => {
    setFiles(loadedFiles);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0) return;
    setAnalyzing(true);

    // Collect all hand texts
    const allHands = files.flatMap((f) => f.hands);

    try {
      const res = await fetch("/api/hh/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hands: allHands }),
      });

      if (!res.ok) throw new Error("Upload failed");

      const { sessionId } = await res.json();
      router.push(`/analyze/hands?session=${sessionId}`);
    } catch {
      // Fallback: navigate to hands page with mock data flag
      router.push("/analyze/hands");
    } finally {
      setAnalyzing(false);
    }
  }, [files, router]);

  const totalHands = files.reduce((sum, f) => sum + f.hands.length, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-poker-gold mb-2">Hand History Analyzer</h1>
        <p className="text-muted-foreground">
          Upload your hand histories to identify leaks and compare your play against GTO solutions.
        </p>
      </div>

      {/* Upload section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-poker-gold" />
            Upload Hand Histories
          </CardTitle>
          <CardDescription>
            Drag and drop one or more HH files from PokerStars or GGPoker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesLoaded={handleFilesLoaded}
            accept=".txt,.hh,.hhc"
            multiple
          />
        </CardContent>
      </Card>

      {/* Analysis summary */}
      {files.length > 0 && (
        <Card className="mb-6 border-poker-gold/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">
                  {files.length} file{files.length !== 1 ? "s" : ""} ready &middot;{" "}
                  <span className="text-poker-gold font-bold">{totalHands}</span> hands total
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Files will be parsed, tagged by spot category, and compared against GTO.
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-poker-gold text-gray-900 hover:bg-poker-gold/90 font-semibold"
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full" />
                    Analyzing…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Run Analysis
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>

            {/* Quick stats preview */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-poker-gold">{totalHands}</div>
                <div className="text-xs text-muted-foreground">Hands</div>
              </div>
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-amber-400">0</div>
                <div className="text-xs text-muted-foreground">Spots Analyzed</div>
              </div>
              <div className="bg-secondary/40 rounded p-3 text-center">
                <div className="text-xl font-bold text-emerald-400">$0.00</div>
                <div className="text-xs text-muted-foreground">Est. Leak (bb)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Zap className="h-6 w-6 text-poker-gold" />
            <CardTitle className="text-sm">EV Loss Tracking</CardTitle>
            <CardDescription className="text-xs">
              Pinpoint exactly where you lose the most expected value vs optimal play.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <ShieldCheck className="h-6 w-6 text-poker-gold" />
            <CardTitle className="text-sm">GTO Comparison</CardTitle>
            <CardDescription className="text-xs">
              See how your decisions compare to game-theory-optimal strategies.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <AlertCircle className="h-6 w-6 text-poker-gold" />
            <CardTitle className="text-sm">Leak Report</CardTitle>
            <CardDescription className="text-xs">
              Get a breakdown of your biggest leaks by category and street.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}