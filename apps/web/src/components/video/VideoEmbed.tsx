"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface VideoEmbedProps {
  url?: string;
  youtubeId?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function VideoEmbed({
  url,
  youtubeId,
  title,
  description,
  thumbnailUrl,
  autoPlay = false,
  className,
}: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine the video source
  const videoUrl = url || (youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null);
  const videoIdFromUrl = url ? extractYouTubeId(url) : youtubeId;
  const thumbnail = thumbnailUrl || (videoIdFromUrl ? getYouTubeThumbnail(videoIdFromUrl) : null);

  useEffect(() => {
    if (autoPlay && iframeRef.current) {
      const src = iframeRef.current.src;
      if (!src.includes("autoplay=1")) {
        iframeRef.current.src = src + (src.includes("?") ? "&" : "?") + "autoplay=1";
      }
    }
  }, [autoPlay]);

  const handlePlay = () => {
    setIsLoading(true);
    setIsPlaying(true);
  };

  if (!videoUrl) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800", className)}>
        <div className="aspect-video flex items-center justify-center text-muted-foreground">
          <div className="text-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">No video source provided</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800", className)}>
      {/* Title */}
      {title && (
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
        </div>
      )}

      {/* Video Container with Aspect Ratio */}
      <div className="relative aspect-video bg-black">
        {/* Thumbnail / Play Button Overlay */}
        {!isPlaying && thumbnail && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
            onClick={handlePlay}
          >
            {/* Thumbnail Background */}
            <img
              src={thumbnail}
              alt={title || "Video thumbnail"}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            
            {/* Play Button */}
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-poker-gold/90 hover:bg-poker-gold flex items-center justify-center transition-all transform group-hover:scale-110">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 md:w-10 md:h-10 ml-1 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isPlaying && isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <div className="animate-spin w-10 h-10 border-3 border-poker-gold border-t-transparent rounded-full" />
          </div>
        )}

        {/* Video iframe - always rendered but hidden until playing */}
        <iframe
          ref={iframeRef}
          src={videoUrl + (videoUrl.includes("?") ? "&" : "?") + "enablejsapi=1&rel=0&modestbranding=1"}
          title={title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={cn(
            "w-full h-full",
            !isPlaying ? "hidden" : "block"
          )}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
}

export default VideoEmbed;
