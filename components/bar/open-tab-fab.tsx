// Open New Tab — native SwiftUI glass button + sheet with TextField

import * as React from "react";
import {
  Button,
  Host,
  Text,
  TextField,
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
import { NativeSheet } from "@/components/ui/native-sheet";
import * as Haptics from "expo-haptics";

export { canUseNativeSheet } from "@/components/ui/native-sheet";

interface OpenTabFabProps {
  onOpenTab: (customerName: string) => Promise<void>;
  isPending?: boolean;
}

export function OpenTabFab({ onOpenTab, isPending = false }: OpenTabFabProps) {
  const [showSheet, setShowSheet] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleOpen = () => {
    setName("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSheet(true);
  };

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onOpenTab(trimmed);
    setShowSheet(false);
  };

  const primary = foregroundStyle({ type: "hierarchical", style: "primary" });

  return (
    <>
      <Host
        style={{
          position: "absolute",
          bottom: 90,
          right: 16,
          width: 160,
          height: 52,
        }}
        colorScheme="dark"
      >
        <Button
          systemImage="plus"
          label="Open Tab"
          onPress={handleOpen}
          modifiers={[
            buttonStyle("glass"),
            controlSize("large"),
          ]}
        />
      </Host>

      <NativeSheet
        isPresented={showSheet}
        onDismiss={() => setShowSheet(false)}
        detents={[{ height: 240 }]}
        fitToContents
        spacing={20}
      >
        <Text modifiers={[font({ size: 20, weight: "bold" }), primary]}>
          Open New Tab
        </Text>

        <TextField
          placeholder="Customer name"
          onChangeText={setName}
          autoFocus
          modifiers={[
            padding({ horizontal: 12, vertical: 10 }),
            glassEffect({
              glass: { variant: "regular" },
              shape: "roundedRectangle",
              cornerRadius: 12,
            }),
            frame({ maxWidth: 99999 }),
          ]}
        />

        <Button
          systemImage="checkmark.circle.fill"
          label={isPending ? "Opening..." : "Open Tab"}
          onPress={handleConfirm}
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("large"),
            frame({ maxWidth: 99999 }),
          ]}
        />
      </NativeSheet>
    </>
  );
}
