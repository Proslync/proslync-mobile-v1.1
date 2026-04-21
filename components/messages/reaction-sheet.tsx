// Reaction Sheet - Bottom sheet for message reactions and actions

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;
const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

interface ReactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  canDelete?: boolean;
  messageText?: string;
}

export function ReactionSheet({
  visible,
  onClose,
  onReaction,
  onReply,
  onCopy,
  onDelete,
  onReport,
  canDelete = false,
  messageText,
}: ReactionSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleReaction = React.useCallback(
    (emoji: string) => {
      bottomSheetRef.current?.close();
      setTimeout(() => onReaction(emoji), 100);
    },
    [onReaction],
  );

  const handleAction = React.useCallback((action: () => void) => {
    bottomSheetRef.current?.close();
    setTimeout(action, 100);
  }, []);

  const showReply = !!onReply;
  const showCopy = !!(onCopy && messageText);
  const showDelete = !!(canDelete && onDelete);
  const showReport = !!(onReport && !canDelete);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: "transparent",
        borderRadius: TAB_BAR_RADIUS,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.3)",
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.sheetContent}>
        <GlassView
          {...liquidGlass.surface}
          borderRadius={TAB_BAR_RADIUS}
          style={StyleSheet.absoluteFill}
        />

        {/* Reactions Row */}
        <View style={styles.reactionsRow}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionButton}
              onPress={() => handleReaction(emoji)}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={24}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsList}>
          {showReply && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleAction(onReply!)}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.actionIconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="arrow-undo" size={16} color={colors.text} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
            </TouchableOpacity>
          )}

          {showCopy && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleAction(onCopy!)}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.actionIconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="copy-outline" size={16} color={colors.text} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>
          )}

          {showDelete && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleAction(onDelete!)}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.danger}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.actionIconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="trash-outline" size={16} color="#ff3b30" />
              </View>
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}

          {showReport && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleAction(onReport!)}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.danger}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.actionIconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="flag-outline" size={16} color="#ff3b30" />
              </View>
              <Text style={[styles.actionText, styles.deleteText]}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginBottom: 4,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionsList: {
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    gap: 12,
  },
  actionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  actionText: {
    fontSize: 16,
  },
  deleteText: {
    color: "#ff3b30",
  },
});
