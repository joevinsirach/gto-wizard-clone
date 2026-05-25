/**
 * FileUpload — drag-and-drop hand history file upload.
 * Supports single and multi-file upload with preview of loaded hands.
 */

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadedFile {
  name: string;
  content: string;
  size: number;
  hands: string[];
}

interface FileUploadProps {
  onFilesLoaded: (files: LoadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
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

export function FileUpload({
  onFilesLoaded,
  accept = ".txt,.hh,.hhc",
  multiple = true,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      const files: LoadedFile[] = [];

      for (const file of Array.from(fileList)) {
        try {
          const content = await file.text();
          const hands = extractHands(content);
          files.push({
            name: file.name,
            content,
            size: file.size,
            hands,
          });
        } catch {
          setError(`Failed to read file: ${file.name}`);
          return;
        }
      }

      setLoadedFiles((prev) => [...prev, ...files]);
      onFilesLoaded(files);
    },
    [onFilesLoaded],
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
          Supports .txt, .hh, .hhc (PokerStars, GGPoker)
        </span>
      </label>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Loaded files */}
      {loadedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {loadedFiles.length} file{loadedFiles.length !== 1 ? "s" : ""} loaded ({totalHands} hands)
            </span>
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

          <div className="flex flex-wrap gap-2">
            {loadedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded bg-secondary/50 text-xs"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{file.name}</span>
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
          <span>Files ready for analysis</span>
        </div>
      )}
    </div>
  );
}