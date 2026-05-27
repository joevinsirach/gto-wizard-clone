/**
 * FileUpload — drag-and-drop hand history file upload.
 * Supports single and multi-file upload with preview of loaded hands.
 */

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

export interface LoadedFile {
  name: string;
  content: string;
  size: number;
  hands: string[];
  status: "pending" | "parsing" | "done" | "error";
  error?: string;
}

interface FileUploadProps {
  onFilesLoaded: (files: LoadedFile[]) => void;
  onConfirm?: (files: LoadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  className?: string;
}

const HAND_SEPARATOR_RE = /(?:PokerStars Hand #|GGPoker Hand #|Hand #)/i;
const DEFAULT_MAX_SIZE_MB = 50;

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

function validateFile(file: File, maxSizeMB: number): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["txt", "hh", "hhc"];
  
  if (extension && !allowedExtensions.includes(extension)) {
    return `Invalid file type: .${extension}. Allowed: ${allowedExtensions.join(", ")}`;
  }
  
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return `File too large: ${formatFileSize(file.size)}. Max: ${maxSizeMB}MB`;
  }
  
  return null;
}

export function FileUpload({
  onFilesLoaded,
  onConfirm,
  accept = ".txt,.hh,.hhc",
  multiple = true,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<LoadedFile[]>([]);

  const processFiles = useCallback(
    async (fileList: FileList, maxSize: number) => {
      setError(null);
      const newFiles: LoadedFile[] = [];

      for (const file of Array.from(fileList)) {
        const validationError = validateFile(file, maxSize);
        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          newFiles.push({
            name: file.name,
            content: "",
            size: file.size,
            hands: [],
            status: "pending",
          });

          const content = await file.text();
          const hands = extractHands(content);
          
          setLoadedFiles((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((f) => f.name === file.name && f.status === "pending");
            if (idx !== -1) {
              updated[idx] = { name: file.name, content, size: file.size, hands, status: "done" };
            }
            return updated;
          });

          newFiles[newFiles.length - 1] = {
            name: file.name,
            content,
            size: file.size,
            hands,
            status: "done",
          };
        } catch {
          setError(`Failed to read file: ${file.name}`);
          setLoadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "error" as const, error: "Failed to read file" } : f
            )
          );
        }
      }

      if (newFiles.length > 0) {
        setLoadedFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [],
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
        processFiles(e.dataTransfer.files, maxSizeMB);
      }
    },
    [processFiles, maxSizeMB],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files, maxSizeMB);
      }
    },
    [processFiles, maxSizeMB],
  );

  const removeFile = useCallback((index: number) => {
    setLoadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totalHands = loadedFiles.reduce((sum, f) => sum + f.hands.length, 0);

  const handleConfirm = useCallback(() => {
    const confirmedFiles = loadedFiles.filter((f) => f.status === "done" && f.hands.length > 0);
    onFilesLoaded(confirmedFiles);
    onConfirm?.(confirmedFiles);
    setLoadedFiles([]);
    setPendingFiles([]);
    setPreviewMode(false);
  }, [loadedFiles, onFilesLoaded, onConfirm]);

  const handleCancelPreview = useCallback(() => {
    setPreviewMode(false);
    setPendingFiles([]);
  }, []);

  const handlePreview = useCallback(() => {
    const confirmedFiles = loadedFiles.filter((f) => f.status === "done");
    setPendingFiles(confirmedFiles);
    setPreviewMode(true);
  }, [loadedFiles]);

  const doneFiles = loadedFiles.filter((f) => f.status === "done");
  const hasValidFiles = doneFiles.length > 0;

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
          error && "border-destructive",
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
          Supports .txt, .hh, .hhc (PokerStars, GGPoker) • Max {maxSizeMB}MB per file
        </span>
        {error && (
          <div className="flex items-center gap-1.5 text-destructive text-xs mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </label>

      {/* Loaded files */}
      {loadedFiles.length > 0 && !previewMode && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {loadedFiles.length} file{loadedFiles.length !== 1 ? "s" : ""} loaded ({totalHands} hands)
            </span>
            <div className="flex items-center gap-2">
              {hasValidFiles && (
                <button
                  onClick={handlePreview}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => {
                  setLoadedFiles([]);
                  onFilesLoaded([]);
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {loadedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className={cn(
                  "flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded text-xs",
                  file.status === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary/50 text-secondary-foreground"
                )}
              >
                {file.status === "parsing" ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : file.status === "error" ? (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                ) : (
                  <FileText className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="max-w-[100px] truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-muted-foreground/70">
                  {formatFileSize(file.size)}
                </span>
                {file.status === "done" && (
                  <span className="text-emerald-500/70">({file.hands.length}h)</span>
                )}
                {file.status === "error" && (
                  <span className="max-w-[80px] truncate text-destructive" title={file.error}>
                    {file.error}
                  </span>
                )}
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

      {/* Preview mode */}
      {previewMode && pendingFiles.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-background/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Parsing Preview ({pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""})
            </span>
            <button
              onClick={handleCancelPreview}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {pendingFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex flex-col gap-1 p-2 rounded bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                  <span className="text-xs text-emerald-500 font-medium">
                    {file.hands.length} hand{file.hands.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {file.hands.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-xs text-muted-foreground">First hand preview:</span>
                    <pre className="text-xs font-courier text-muted-foreground/80 bg-background/50 p-1.5 rounded truncate">
                      {file.hands[0].slice(0, 150)}...
                    </pre>
                  </div>
                )}
                {file.hands.length === 0 && (
                  <span className="text-xs text-amber-500 mt-1">No valid hands found in file</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              Total: {pendingFiles.reduce((sum, f) => sum + f.hands.length, 0)} hands
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelPreview}
                className="px-3 py-1.5 text-xs rounded border border-border hover:bg-secondary/50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {loadedFiles.length > 0 && !previewMode && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          <span>Files ready for analysis</span>
        </div>
      )}
    </div>
  );
}
