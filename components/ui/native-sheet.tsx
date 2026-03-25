// Reusable native SwiftUI BottomSheet — universal for SwiftUI and React Native content
// Uses preferredColorScheme (custom modifier) to theme the entire sheet presentation

import * as React from "react";
import { Platform } from "react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { BottomSheet, Group, Host, RNHostView, VStack } from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
  presentationBackgroundInteraction,
  interactiveDismissDisabled,
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

  // ─── Detents & Sizing ───
  /** Sheet height detents. Default: ['medium', 'large'] */
  detents?: PresentationDetent[];
  /** Initial/current selected detent. Enables programmatic detent control. */
  selectedDetent?: PresentationDetent;
  /** Callback when user drags to a different detent. */
  onDetentChange?: (detent: PresentationDetent) => void;
  /** Fit sheet height to content. Default: false */
  fitToContents?: boolean;

  // ─── Appearance ───
  /** Show drag indicator. Default: 'visible' */
  dragIndicator?: "automatic" | "visible" | "hidden";
  /** Background interaction when sheet is partially open */
  backgroundInteraction?: PresentationBackgroundInteractionType;
  /** Prevent swipe-to-dismiss (e.g. for forms with unsaved changes). Default: false */
  preventDismiss?: boolean;

  // ─── Content Mode ───
  /** When true, children are React Native views wrapped in RNHostView.
   *  When false (default), children are SwiftUI components in a VStack.
   *
   *  Use `rnContent` when children include: Image with URL, ScrollView,
   *  TouchableOpacity, or any RN component. See AI Skills/Native Sheet Patterns.md */
  rnContent?: boolean;

  // ─── SwiftUI VStack options (only when rnContent=false) ───
  /** Padding inside the sheet. Default: 24 */
  contentPadding?: number;
  /** VStack alignment. Default: 'center' */
  alignment?: "leading" | "center" | "trailing";
  /** VStack spacing. Default: 16 */
  spacing?: number;
}

export function NativeSheet({
  isPresented,
  onDismiss,
  children,
  detents = ["medium", "large"],
  selectedDetent,
  onDetentChange,
  fitToContents = false,
  dragIndicator = "visible",
  backgroundInteraction,
  preventDismiss = false,
  rnContent = false,
  contentPadding = 24,
  alignment = "center",
  spacing = 16,
}: NativeSheetProps) {
  const { isDark } = useAppTheme();
  const scheme = isDark ? "dark" : "light";

  // Build Group modifiers
  const groupModifiers = React.useMemo(() => {
    const mods: ReturnType<typeof presentationDetents>[] = [];

    // Detents — with optional selection tracking
    if (selectedDetent && onDetentChange) {
      mods.push(
        presentationDetents(detents, {
          selection: selectedDetent,
          onSelectionChange: onDetentChange,
        }),
      );
    } else {
      mods.push(presentationDetents(detents));
    }

    mods.push(presentationDragIndicator(dragIndicator));

    if (backgroundInteraction) {
      mods.push(presentationBackgroundInteraction(backgroundInteraction));
    }

    if (preventDismiss) {
      mods.push(interactiveDismissDisabled());
    }

    // Theme the entire sheet presentation
    mods.push(preferredColorScheme("dark"));

    return mods;
  }, [
    detents,
    selectedDetent,
    onDetentChange,
    dragIndicator,
    backgroundInteraction,
    preventDismiss,
  ]);

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
            // RN content: single RNHostView fills the sheet.
            // Don't use matchContents with ScrollView — it collapses to 0.
            // Use matchContents only with fitToContents for fixed-size content.
            <RNHostView matchContents={fitToContents}>
              {children}
            </RNHostView>
          ) : (
            // SwiftUI content: VStack with padding
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
