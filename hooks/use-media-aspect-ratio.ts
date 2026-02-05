import * as React from 'react';
import { Image } from 'react-native';
import type { MediaOrientation } from '../lib/types/feed.types';

export interface UseMediaAspectRatioResult {
  aspectRatio: number | null;
  mediaOrientation: MediaOrientation | null;
  isLoading: boolean;
  isHorizontal: boolean;
  isVertical: boolean;
  isSquare: boolean;
}

/**
 * Hook to detect image aspect ratio from URL when dimensions are not provided by GetStream
 * Matches frontend's useImageAspectRatio implementation
 *
 * Classification thresholds (matching frontend):
 * - Horizontal (landscape): aspectRatio > 1.1
 * - Vertical (portrait): aspectRatio < 0.9
 * - Square: 0.9 <= aspectRatio <= 1.1
 *
 * @param imageUrl - URL of the image to measure
 * @param providedAspectRatio - Pre-calculated aspect ratio from GetStream (if available)
 * @returns Aspect ratio data and loading state
 *
 * @example
 * // Use with GetStream dimensions (preferred - no network request)
 * const { aspectRatio, mediaOrientation } = useMediaAspectRatio(imageUrl, item.aspectRatio);
 *
 * @example
 * // Fallback: detect from image when no dimensions provided
 * const { aspectRatio, isLoading } = useMediaAspectRatio(imageUrl);
 */
export function useMediaAspectRatio(
  imageUrl: string | null | undefined,
  providedAspectRatio?: number
): UseMediaAspectRatioResult {
  const [detectedAspectRatio, setDetectedAspectRatio] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(!providedAspectRatio);

  // Use provided aspect ratio if available (from GetStream metadata)
  const aspectRatio = providedAspectRatio ?? detectedAspectRatio;

  React.useEffect(() => {
    // Skip detection if we already have aspect ratio from GetStream
    if (providedAspectRatio) {
      setIsLoading(false);
      return;
    }

    if (!imageUrl) {
      setDetectedAspectRatio(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Use React Native's Image.getSize to get dimensions
    Image.getSize(
      imageUrl,
      (width, height) => {
        if (height > 0) {
          setDetectedAspectRatio(width / height);
        } else {
          setDetectedAspectRatio(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('[useMediaAspectRatio] Failed to get image size:', error);
        setDetectedAspectRatio(null);
        setIsLoading(false);
      }
    );
  }, [imageUrl, providedAspectRatio]);

  // Classification matching frontend thresholds
  const isHorizontal = aspectRatio !== null && aspectRatio > 1.1;
  const isVertical = aspectRatio !== null && aspectRatio < 0.9;
  const isSquare = aspectRatio !== null && aspectRatio >= 0.9 && aspectRatio <= 1.1;

  // Determine orientation
  let mediaOrientation: MediaOrientation | null = null;
  if (isHorizontal) {
    mediaOrientation = 'horizontal';
  } else if (isVertical) {
    mediaOrientation = 'vertical';
  } else if (isSquare) {
    mediaOrientation = 'square';
  }

  return {
    aspectRatio,
    mediaOrientation,
    isLoading,
    isHorizontal,
    isVertical,
    isSquare,
  };
}

/**
 * Hook to detect video aspect ratio from URL
 * Note: For videos, it's preferred to use GetStream's original_width/original_height
 * as loading video metadata is more expensive than images
 *
 * @param videoUrl - URL of the video
 * @param providedAspectRatio - Pre-calculated aspect ratio from GetStream (if available)
 */
export function useVideoAspectRatio(
  videoUrl: string | null | undefined,
  providedAspectRatio?: number
): UseMediaAspectRatioResult {
  // For videos, we primarily rely on GetStream metadata
  // Fallback detection for videos would require loading video metadata which is expensive
  // So we just return the provided aspect ratio or null
  const aspectRatio = providedAspectRatio ?? null;

  const isHorizontal = aspectRatio !== null && aspectRatio > 1.1;
  const isVertical = aspectRatio !== null && aspectRatio < 0.9;
  const isSquare = aspectRatio !== null && aspectRatio >= 0.9 && aspectRatio <= 1.1;

  let mediaOrientation: MediaOrientation | null = null;
  if (isHorizontal) {
    mediaOrientation = 'horizontal';
  } else if (isVertical) {
    mediaOrientation = 'vertical';
  } else if (isSquare) {
    mediaOrientation = 'square';
  }

  return {
    aspectRatio,
    mediaOrientation,
    isLoading: false, // No async loading for videos - use provided ratio
    isHorizontal,
    isVertical,
    isSquare,
  };
}
