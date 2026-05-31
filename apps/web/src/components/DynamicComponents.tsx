/**
 * Dynamic imports for heavy components to enable code splitting
 * These components are loaded lazily to reduce initial bundle size
 */

import dynamic from 'next/dynamic';
import type { ICMResultsProps } from '@/components/icm/ICMResults';
import type { StrategyHeatmapProps } from '@/components/ui/StrategyHeatmap';
import type { VideoEmbedProps } from '@/components/video/VideoEmbed';

// Recharts is heavy - only load when needed
export const DynamicICMResults = dynamic(
  () => import('@/components/icm/ICMResults').then((mod) => mod.ICMResults),
  {
    loading: () => (
      <div className="border border-gray-800 rounded-lg p-6 sm:p-8 bg-gray-900/50 flex items-center justify-center min-h-[16rem]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-poker-gold border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-muted-foreground text-sm">Loading chart...</div>
        </div>
      </div>
    ),
    ssr: false,
  } as Parameters<typeof dynamic>[1]
);

// StrategyHeatmap is a large component
export const DynamicStrategyHeatmap = dynamic(
  () => import('@/components/ui/StrategyHeatmap').then((mod) => mod.StrategyHeatmap) as any,
  {
    loading: () => (
      <div className="border border-gray-800 rounded-lg p-8 bg-gray-900/50 flex items-center justify-center min-h-[12rem]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-poker-gold border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-muted-foreground text-sm">Loading heatmap...</div>
        </div>
      </div>
    ),
    ssr: false,
  } as any
);

// VideoEmbed can defer loading the iframe
export const DynamicVideoEmbed = dynamic(
  () => import('@/components/video/VideoEmbed').then((mod) => mod.VideoEmbed),
  {
    loading: () => (
      <div className="relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800 aspect-video flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-poker-gold border-t-transparent rounded-full" />
      </div>
    ),
    ssr: false,
  } as Parameters<typeof dynamic>[1]
);

// Re-export types for convenience
export type { ICMResultsProps, StrategyHeatmapProps, VideoEmbedProps };
