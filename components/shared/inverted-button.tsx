import * as React from 'react';
import { GlassButton } from '@/components/glass';

interface InvertedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  height?: number;
  borderRadius?: number;
}

/**
 * Frosted-glass CTA button. Now backed by GlassButton variant="frosted".
 * Public API is unchanged — existing consumers (feed-bottom-cta, etc.) work as-is.
 */
export function InvertedButton({
  label,
  onPress,
  disabled = false,
}: InvertedButtonProps) {
  return (
    <GlassButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      variant="frosted"
      size="lg"
      fullWidth
    />
  );
}
