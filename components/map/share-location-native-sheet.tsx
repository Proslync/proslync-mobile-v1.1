// Native SwiftUI Bottom Sheet for Share Location
// Uses NativeSheet wrapper for automatic dark/light theme

import { useLiveLocation } from "@/lib/providers/live-location-provider";
import {
  SHARE_DURATION_OPTIONS,
  type ShareDurationSeconds,
} from "@/lib/types/live-location.types";
import { useLocationVisibility } from "@/hooks/use-location-visibility";
import { VISIBILITY_MODE_LABELS } from "@/lib/types/location-visibility.types";
import {
  Button,
  Circle,
  GlassEffectContainer,
  HStack,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { NativeSheet } from "@/components/ui/native-sheet";

// Re-export for search.tsx
export { canUseNativeSheet } from "@/components/ui/native-sheet";

// Shorthand for hierarchical styles
const primary = foregroundStyle({ type: "hierarchical", style: "primary" });
const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });
const tertiary = foregroundStyle({ type: "hierarchical", style: "tertiary" });
const quaternary = foregroundStyle({
  type: "hierarchical",
  style: "quaternary",
});

interface NativeShareLocationSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function NativeShareLocationSheet({
  isVisible,
  onClose,
}: NativeShareLocationSheetProps) {
  const {
    sharingState,
    remainingTime,
    connectionState,
    startSharing,
    stopSharing,
    hasLocationPermission,
    requestLocationPermission,
  } = useLiveLocation();
  const { settings } = useLocationVisibility();
  const [isStarting, setIsStarting] = React.useState(false);

  const isConnected = connectionState === "connected";
  const visibilityLabel = VISIBILITY_MODE_LABELS[settings.mode];

  const handleDurationSelect = async (duration: ShareDurationSeconds) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);
    try {
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsStarting(false);
          return;
        }
      }
      await startSharing(duration);
    } catch (error) {
      console.error(
        "[NativeShareLocationSheet] Failed to start sharing:",
        error,
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSharing = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopSharing();
    onClose();
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0m";
    if (seconds > 86400) return "Until I turn it off";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return `${mins}m remaining`;
  };

  return (
    <NativeSheet
      isPresented={isVisible}
      onDismiss={onClose}
      detents={[{ fraction: 0.45 }, "medium"]}
      backgroundInteraction={{
        type: "enabledUpThrough",
        detent: { fraction: 0.45 },
      }}
    >
      {sharingState.isSharing ? (
        // ─── Active Sharing State ───
        <>
          {/* Live badge */}
          <HStack
            spacing={6}
            modifiers={[
              padding({ horizontal: 12, vertical: 6 }),
              glassEffect({
                glass: { variant: "regular" },
                shape: "capsule",
              }),
            ]}
          >
            <Circle
              modifiers={[
                frame({ width: 8, height: 8 }),
                foregroundStyle("#00D632"),
              ]}
            />
            <Text modifiers={[font({ size: 11, weight: "bold" }), primary]}>
              LIVE
            </Text>
          </HStack>

          {/* Title */}
          <Text modifiers={[font({ size: 20, weight: "bold" }), primary]}>
            Sharing your location
          </Text>

          <Text modifiers={[font({ size: 13 }), secondary]}>
            {`Visible to: ${visibilityLabel}`}
          </Text>

          {/* Timer card */}
          <GlassEffectContainer spacing={8}>
            <HStack
              spacing={8}
              modifiers={[
                padding({ horizontal: 16, vertical: 12 }),
                glassEffect({
                  glass: { variant: "regular" },
                  shape: "roundedRectangle",
                  cornerRadius: 16,
                }),
              ]}
            >
              <Text modifiers={[font({ size: 15 }), secondary]}>
                {sharingState.duration === 0
                  ? "∞ Sharing permanently"
                  : remainingTime !== null
                    ? formatTime(remainingTime)
                    : "--"}
              </Text>
            </HStack>
          </GlassEffectContainer>

          {/* Stop button */}
          <Button
            systemImage="stop.circle"
            label="Stop Sharing"
            role="destructive"
            onPress={handleStopSharing}
            modifiers={[
              buttonStyle("glassProminent"),
              controlSize("large"),
              padding({ top: 8 }),
            ]}
          />
        </>
      ) : (
        // ─── Pick Duration State ───
        <>
          {/* Header icon */}
          <GlassEffectContainer>
            <VStack
              modifiers={[
                frame({ width: 56, height: 56 }),
                glassEffect({
                  glass: { variant: "regular" },
                  shape: "roundedRectangle",
                  cornerRadius: 16,
                }),
              ]}
            >
              <Button
                systemImage="location.fill"
                onPress={() => {}}
                modifiers={[buttonStyle("plain"), primary]}
              />
            </VStack>
          </GlassEffectContainer>

          <Text modifiers={[font({ size: 20, weight: "bold" }), primary]}>
            Share Live Location
          </Text>

          <Text modifiers={[font({ size: 13 }), tertiary]}>
            Choose how long to share with friends
          </Text>

          {/* Duration options */}
          <GlassEffectContainer spacing={2}>
            <VStack
              spacing={0}
              modifiers={[
                glassEffect({
                  glass: { variant: "regular" },
                  shape: "roundedRectangle",
                  cornerRadius: 20,
                }),
              ]}
            >
              {SHARE_DURATION_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  systemImage={option.isPermanent ? "infinity" : "clock"}
                  label={option.label}
                  onPress={() => handleDurationSelect(option.value)}
                  modifiers={[
                    buttonStyle("glass"),
                    controlSize("large"),
                    frame({ maxWidth: 99999 }),
                  ]}
                />
              ))}
            </VStack>
          </GlassEffectContainer>

          {/* Who can see */}
          <Button
            systemImage="eye"
            label={`Who can see · ${visibilityLabel}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            modifiers={[buttonStyle("glass"), controlSize("regular")]}
          />

          {!hasLocationPermission && (
            <Text modifiers={[font({ size: 12 }), quaternary]}>
              Location permission required
            </Text>
          )}
        </>
      )}
    </NativeSheet>
  );
}
