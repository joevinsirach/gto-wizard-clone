/**
 * FileUpload — enhanced drag-and-drop hand history file upload.
 * Supports progress tracking for large files, format detection, and size validation.
 */

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type HHFormat = "pokerstars" | "ggpoker" | " ignition" | "unknown";

export interface LoadedFile {
  name: string;
  content: string;
  size: number;
  hands: string[];
  format: HHFormat;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;      // 0-100
  status: "reading" | "parsing" | "done" | "error";
  error?: string;
}

interface FileUploadProps {
  onFilesLoaded: (files: LoadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  className?: string;
}

const HAND_SEPARATOR_RE = /(?:PokerStars Hand #|GGPoker Hand #|Hand #|Ignition Hand #)/i;

function detectFormat(text: string): HHFormat {
  if (/PokerStars/i.test(text)) return "pokerstars";
  if (/GGPoker/i.test(text)) return "ggpoker";
  if (/Ignition/i.test(text)) return "ignition";
  return "unknown";
}

function extractHands(text: string): string[] {
  const separatorMatch = text.match(HAND_SEPARATOR_RE);
  if (!separatorMatch) return [];
  const separator = separatorMatch[0];
  const parts = text.split(separator);
  const hands: string[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const prev = parts[i - 1];
    const match = prev.match(/\n\n([\s\S]*)$/);
    const body = match ? match[1] : "";
    const header = parts[i].split("\n")[0];
    hands.push(`${separator}${header}\n${body}`);
  }
  return hands;
}

const FORMAT_LABELS: Record<HHFormat, string> = {
  pokerstars: "PokerStars",
  ggpoker: "GGPoker",
  ignition: "Ignition",
  unknown: "Unknown",
};

const FORMAT_COLORS: Record<HHFormat, string> = {
  pokerstars: "text-red-400",
  ggpoker: "text-yellow-400",
  ignition: "text-orange-400",
  unknown: "text-muted-foreground",
};

export function FileUpload({
  onFilesLoaded,
  accept = ".txt,.hh,.hhc",
  multiple = true,
  maxSizeMB = 50,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FileUploadProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      setIsProcessing(true);
      setProgress([]);

      const files: LoadedFile[] = [];
      const fileArray = Array.from(fileList);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        // Size validation
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File "${file.name}" exceeds max size of ${maxSizeMB}MB`);
          setIsProcessing(false);
          return;
        }

        const fileProgress: FileUploadProgress = {
          fileName: file.name,
          progress: 0,
          status: "reading",
        };
        setProgress((prev) => [...prev, fileProgress]);

        try {
          // Simulate chunked reading with progress (browsers don't give read progress,
          // but we can simulate parsing progress for UX)
          const progressUpdater = (pct: number, status: FileUploadProgress["status"]) => {
            setProgress((prev) =>
              prev.map((fp) =>
                fp.fileName === file.name ? { ...fp, progress: pct, status } : fp
              )
            );
          };

          progressUpdater(10, "reading");
          const content = await file.text();
          progressUpdater(40, "parsing");

          const hands = extractHands(content);
          const format = detectFormat(content);
          progressUpdater(90, "done");

          files.push({
            name: file.name,
            content,
            size: file.size,
            hands,
            format,
          });

          progressUpdater(100, "done");
        } catch {
          setProgress((prev) =>
            prev.map((fp) =>
              fp.fileName === file.name
                ? { ...fp, progress: 0, status: "error", error: "Failed to read file" }
                : fp
            )
          );
          setError(`Failed to read file: ${file.name}`);
        }
      }

      setIsProcessing(false);
      setLoadedFiles((prev) => [...prev, ...files]);
      onFilesLoaded(files);
    },
    [maxSizeMB, onFilesLoaded],
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

  const removeFile = useCallback((index: number) => {
    setLoadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setLoadedFiles([]);
    setProgress([]);
    onFilesLoaded([]);
  }, [onFilesLoaded]);

  const totalHands = loadedFiles.reduce((sum, f) => sum + f.hands.length, 0);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Drop zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5",
          error && "border-destructive",
          isProcessing && "opacity-60 pointer-events-none",
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
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
          {isDragging
            ? "Drop files here"
            : "Drag & drop hand history files or click to browse"}
        </span>
        <span className="text-xs text-muted-foreground/70">
          Supports .txt, .hh, .hhc (PokerStars, GGPoker, Ignition) · Max {maxSizeMB}MB per file
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress indicators for files being processed */}
      {progress.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {progress.map((fp, i) => (
            <div key={`${fp.fileName}-${i}`} className="flex items-center gap-2">
              {fp.status === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
              ) : fp.status === "done" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground flex-1 truncate">{fp.fileName}</span>
              <span className="text-xs text-muted-foreground">{fp.progress}%</span>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    fp.status === "error" ? "bg-destructive" : fp.status === "done" ? "bg-emerald-500" : "bg-primary",
                  )}
                  style={{ width: `${fp.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loaded files */}
      {loadedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {loadedFiles.length} file{loadedFiles.length !== 1 ? "s" : ""} loaded (
              {totalHands} hands)
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {loadedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded bg-secondary/50 text-xs"
              >
                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    FORMAT_COLORS[file.format],
                  )}
                  title={`Detected: ${FORMAT_LABELS[file.format]}`}
                >
                  {FORMAT_LABELS[file.format]}
                </span>
                <span className="text-muted-foreground/70">({file.hands.length}h)</span>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success indicator */}
      {loadedFiles.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          <span>
            {loadedFiles.length} file{loadedFiles.length !== 1 ? "s" : ""} ready for analysis · {totalHands} total hands
          </span>
        </div>
      )}
    </div>
  );
}
