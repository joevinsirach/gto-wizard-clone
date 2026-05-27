/**
 * BatchImport — batch hand history import with per-file progress, error handling, and retry.
 */

import { useCallback, useReducer, useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle, RefreshCw, Eye, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

export interface BatchFile {
  id: string;
  name: string;
  size: number;
  content: string;
  hands: string[];
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
  dbId?: string;
}

interface BatchImportProps {
  onUpload: (files: BatchFile[]) => Promise<{ db_id: string; hand_id: string }[]>;
  onViewHands?: () => void;
  onComplete?: (results: { db_id: string; hand_id: string }[]) => void;
  accept?: string;
  maxSizeMB?: number;
  maxConcurrent?: number;
  className?: string;
}

interface FileState {
  files: BatchFile[];
}

type FileAction =
  | { type: "ADD_FILES"; payload: BatchFile[] }
  | { type: "UPDATE_FILE"; id: string; payload: Partial<BatchFile> }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "CLEAR_ALL" }
  | { type: "RETRY_FILE"; id: string };

function fileReducer(state: FileState, action: FileAction): FileState {
  switch (action.type) {
    case "ADD_FILES":
      return { files: [...state.files, ...action.payload] };
    case "UPDATE_FILE":
      return {
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, ...action.payload } : f
        ),
      };
    case "REMOVE_FILE":
      return { files: state.files.filter((f) => f.id !== action.id) };
    case "CLEAR_ALL":
      return { files: [] };
    case "RETRY_FILE":
      return {
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, status: "pending", progress: 0, error: undefined } : f
        ),
      };
    default:
      return state;
  }
}

const HAND_SEPARATOR_RE = /(?:PokerStars Hand #|GGPoker Hand #|Hand #)/i;

function extractHands(text: string): string[] {
  const parts = text.split(HAND_SEPARATOR_RE);
  const hands: string[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const prev = parts[i - 1];
    const match = prev.match(/\n\n([\s\S]*)$/);
    const body = match ? match[1] : "";
    const header = parts[i].split("\n")[0];
    hands.push(`PokerStars Hand #${header}\n${body}`);
  }
  return hands;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function BatchImport({
  onUpload,
  onViewHands,
  onComplete,
  accept = ".txt,.hh,.hhc",
  maxSizeMB = 50,
  maxConcurrent = 3,
  className,
}: BatchImportProps) {
  const [state, dispatch] = useReducer(fileReducer, { files: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{ db_id: string; hand_id: string }[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setGlobalError(null);
      const newFiles: BatchFile[] = [];

      for (const file of Array.from(fileList)) {
        const sizeMB = file.size / (1024 * 1024);
        const extension = file.name.split(".").pop()?.toLowerCase();
        const allowedExtensions = ["txt", "hh", "hhc"];

        if (extension && !allowedExtensions.includes(extension)) {
          setGlobalError(`Invalid file type: .${extension}`);
          continue;
        }

        if (sizeMB > maxSizeMB) {
          setGlobalError(`File too large: ${formatFileSize(file.size)}. Max: ${maxSizeMB}MB`);
          continue;
        }

        try {
          const content = await file.text();
          const hands = extractHands(content);

          newFiles.push({
            id: generateId(),
            name: file.name,
            size: file.size,
            content,
            hands,
            status: "pending",
            progress: 0,
          });
        } catch {
          setGlobalError(`Failed to read file: ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        dispatch({ type: "ADD_FILES", payload: newFiles });
      }
    },
    [maxSizeMB],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles],
  );

  const removeFile = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FILE", id });
  }, []);

  const retryFile = useCallback((id: string) => {
    dispatch({ type: "RETRY_FILE", id });
  }, []);

  const handleUploadBatch = useCallback(async () => {
    const pendingFiles = state.files.filter((f) => f.status === "pending" || f.status === "error");
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    abortRef.current = false;
    setGlobalError(null);
    setIsComplete(false);

    // Mark all pending files as uploading
    for (const file of pendingFiles) {
      dispatch({ type: "UPDATE_FILE", id: file.id, payload: { status: "uploading", progress: 10 } });
    }

    // Process in batches based on maxConcurrent
    const results: { db_id: string; hand_id: string }[] = [];

    for (let i = 0; i < pendingFiles.length; i += maxConcurrent) {
      if (abortRef.current) break;

      const batch = pendingFiles.slice(i, i + maxConcurrent);

      await Promise.all(
        batch.map(async (file) => {
          if (abortRef.current) return;

          try {
            dispatch({ type: "UPDATE_FILE", id: file.id, payload: { status: "processing", progress: 30 } });

            // Simulate progress updates during processing
            dispatch({ type: "UPDATE_FILE", id: file.id, payload: { progress: 50 } });

            const result = await onUpload([file]);

            dispatch({ type: "UPDATE_FILE", id: file.id, payload: { progress: 100, status: "done", dbId: result[0]?.db_id } });
            results.push(...result);
          } catch (err) {
            dispatch({
              type: "UPDATE_FILE",
              id: file.id,
              payload: {
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              },
            });
          }
        })
      );
    }

    setResults(results);
    setIsComplete(true);
    setIsProcessing(false);
    onComplete?.(results);
  }, [state.files, maxConcurrent, onUpload, onComplete]);

  const handleClearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
    setIsComplete(false);
    setResults([]);
    setGlobalError(null);
  }, []);

  const totalHands = state.files.reduce((sum, f) => sum + f.hands.length, 0);
  const completedFiles = state.files.filter((f) => f.status === "done").length;
  const errorFiles = state.files.filter((f) => f.status === "error").length;
  const hasPending = state.files.some((f) => f.status === "pending" || f.status === "error");
  const allDone = state.files.length > 0 && state.files.every((f) => f.status === "done");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Drop zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-primary/5",
          (globalError || errorFiles > 0) && "border-destructive",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className="sr-only"
        />
        <Upload
          className={cn(
            "h-8 w-8 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span className="text-sm text-muted-foreground text-center">
          {isDragging ? "Drop files here" : "Drag & drop hand history files or click to browse"}
        </span>
        <span className="text-xs text-muted-foreground/70">
          Supports .txt, .hh, .hhc • Max {maxSizeMB}MB per file
        </span>
      </label>

      {globalError && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{globalError}</span>
        </div>
      )}

      {/* File list */}
      {state.files.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3 bg-background/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {state.files.length} file{state.files.length !== 1 ? "s" : ""} ({totalHands} hands)
              </span>
              {completedFiles > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  {completedFiles} done
                </span>
              )}
              {errorFiles > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errorFiles} failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isProcessing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </span>
              )}
              <button
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto">
            {state.files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded",
                  file.status === "error"
                    ? "bg-destructive/10"
                    : file.status === "done"
                    ? "bg-emerald-500/5"
                    : "bg-secondary/20"
                )}
              >
                {file.status === "uploading" || file.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                ) : file.status === "done" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                ) : file.status === "error" ? (
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate max-w-[180px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {(file.status === "uploading" || file.status === "processing") && (
                    <div className="mt-1.5">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status text */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {file.status === "pending" && `${file.hands.length} hands`}
                      {file.status === "uploading" && "Uploading..."}
                      {file.status === "processing" && "Processing..."}
                      {file.status === "done" && `${file.hands.length} hands imported`}
                      {file.status === "error" && (
                        <span className="text-destructive">{file.error}</span>
                      )}
                    </span>
                    {file.dbId && (
                      <span className="text-xs font-courier text-muted-foreground/70">
                        {file.dbId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {file.status === "error" && (
                    <button
                      onClick={() => retryFile(file.id)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      title="Retry"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {hasPending ? "Ready to import" : allDone ? "All files imported" : "No pending files"}
            </span>
            <div className="flex items-center gap-2">
              {isComplete && allDone && onViewHands && (
                <button
                  onClick={onViewHands}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View hands
                </button>
              )}
              <button
                onClick={handleUploadBatch}
                disabled={!hasPending || isProcessing}
                className={cn(
                  "px-3 py-1.5 text-xs rounded transition-colors",
                  hasPending && !isProcessing
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
              >
                {isProcessing ? "Importing..." : `Import ${state.files.filter((f) => f.status === "pending" || f.status === "error").length} files`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {isComplete && results.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Successfully imported {results.length} hand{results.length !== 1 ? "s" : ""}</span>
          {onViewHands && (
            <button
              onClick={onViewHands}
              className="flex items-center gap-1 ml-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View hands
            </button>
          )}
        </div>
      )}
    </div>
  );
}
