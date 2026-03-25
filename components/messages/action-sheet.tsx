// Action Sheet - Long press actions for conversations (native SwiftUI sheet)

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Conversation } from "../../lib/types/messages.types";
import { NativeSheet } from "@/components/ui/native-sheet";

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ActionSheet({
  visible,
  onClose,
  conversation,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: ActionSheetProps) {
  const { colors } = useAppTheme();

  const handleAction = React.useCallback(
    (action: () => void) => {
      onClose();
      setTimeout(action, 150);
    },
    [onClose],
  );

  const actions = conversation
    ? [
        {
          icon: conversation.isPinned ? "pin-outline" : "pin",
          label: conversation.isPinned ? "Unpin" : "Pin",
          onPress: onPin,
          color: colors.text,
        },
        {
          icon: conversation.isMuted ? "notifications" : "notifications-off",
          label: conversation.isMuted ? "Unmute" : "Mute",
          onPress: onMute,
          color: colors.text,
        },
        {
          icon: "archive",
          label: "Archive",
          onPress: onArchive,
          color: colors.text,
        },
        {
          icon: "trash",
          label: "Delete",
          onPress: onDelete,
          color: "#ff3b30",
        },
      ]
    : [];

  return (
    <NativeSheet
      isPresented={visible && !!conversation}
      onDismiss={onClose}
      fitToContents
      rnContent
    >
      <View style={styles.content}>
        {conversation && (
          <>
            {/* Conversation Preview */}
            <View style={styles.preview}>
              <Text
                style={[styles.previewTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {conversation.title}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsList}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={styles.actionRow}
                  onPress={() => handleAction(action.onPress)}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...(action.color === "#ff3b30"
                      ? liquidGlass.danger
                      : liquidGlass.fill)}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.actionIconCircle}>
                    <GlassView
                      {...liquidGlass.fillMedium}
                      borderRadius={14}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons
                      name={action.icon as any}
                      size={18}
                      color={action.color}
                    />
                  </View>
                  <Text style={[styles.actionText, { color: action.color }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  preview: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
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
});
