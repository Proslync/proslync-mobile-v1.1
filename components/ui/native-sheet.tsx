// Reusable native SwiftUI BottomSheet with automatic dark/light theme support
// Uses preferredColorScheme (custom modifier) to theme the entire sheet presentation

import * as React from "react";
import { Platform } from "react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { BottomSheet, Group, Host, RNHostView, VStack } from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
  presentationBackgroundInteraction,
  padding,
  frame,
  type PresentationDetent,
} from "@expo/ui/swift-ui/modifiers";
import { preferredColorScheme } from "@/modules/native-ui-ext";
import { useAppTheme } from "@/hooks/use-app-theme";

type PresentationBackgroundInteractionType =
  | "automatic"
  | "enabled"
  | "disabled"
  | { type: "enabledUpThrough"; detent: PresentationDetent };

interface NativeSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  /** Sheet height detents. Default: ['medium', 'large'] */
  detents?: PresentationDetent[];
  /** Show drag indicator. Default: 'visible' */
  dragIndicator?: "automatic" | "visible" | "hidden";
  /** Background interaction when sheet is partially open */
  backgroundInteraction?: PresentationBackgroundInteractionType;
  /** Fit sheet height to content. Default: false */
  fitToContents?: boolean;
  /** Padding inside the sheet. Default: 24 */
  contentPadding?: number;
  /** VStack alignment. Default: 'center' */
  alignment?: "leading" | "center" | "trailing";
  /** VStack spacing. Default: 16 */
  spacing?: number;
  /** When true, children are React Native views and will be wrapped in RNHostView.
   *  When false (default), children are SwiftUI components passed directly to VStack. */
  rnContent?: boolean;
}

export function NativeSheet({
  isPresented,
  onDismiss,
  children,
  detents = ["medium", "large"],
  dragIndicator = "visible",
  backgroundInteraction,
  fitToContents = false,
  contentPadding = 24,
  alignment = "center",
  spacing = 16,
  rnContent = false,
}: NativeSheetProps) {
  const { isDark } = useAppTheme();
  const scheme = isDark ? "dark" : "light";

  const groupModifiers = [
    presentationDetents(detents),
    presentationDragIndicator(dragIndicator),
    ...(backgroundInteraction
      ? [presentationBackgroundInteraction(backgroundInteraction)]
      : []),
    // preferredColorScheme themes the entire sheet presentation (background + content)
    preferredColorScheme("dark"),
  ];

  return (
    <Host
      style={{ position: "absolute", width: 0, height: 0 }}
      colorScheme={scheme}
    >
      <BottomSheet
        isPresented={isPresented}
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
        fitToContents={fitToContents}
      >
        <Group modifiers={groupModifiers}>
          {rnContent ? (
            <RNHostView matchContents={fitToContents}>
              {children}
            </RNHostView>
          ) : (
            <VStack
              alignment={alignment}
              spacing={spacing}
              modifiers={[
                padding({ all: contentPadding }),
                frame({ maxWidth: 99999, maxHeight: 99999 }),
              ]}
            >
              {children}
            </VStack>
          )}
        </Group>
      </BottomSheet>
    </Host>
  );
}

/** Returns true if native SwiftUI sheets are available (iOS 26+) */
export function canUseNativeSheet(): boolean {
  return Platform.OS === "ios" && isGlassEffectAPIAvailable();
}
