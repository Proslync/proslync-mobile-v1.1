// Conversation Action Sheet — long press actions (native SwiftUI sheet)

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { Ionicons } from "@expo/vector-icons";
import { NativeSheet } from "@/components/ui/native-sheet";
import type { ChannelData } from "@/hooks/use-conversations";

interface ConversationActionSheetProps {
  visible: boolean;
  onClose: () => void;
  channel: ChannelData | null;
  onTogglePin: () => void;
  onDelete: () => void;
  onBlock: () => void;
}

export function ConversationActionSheet({
  visible,
  onClose,
  channel,
  onTogglePin,
  onDelete,
  onBlock,
}: ConversationActionSheetProps) {
  const handleAction = React.useCallback(
    (action: () => void) => {
      onClose();
      setTimeout(action, 150);
    },
    [onClose],
  );

  return (
    <NativeSheet
      isPresented={visible && !!channel}
      onDismiss={onClose}
      detents={[{ fraction: 0.4 }]}
      rnContent
    >
      <View style={styles.content}>
        {channel && (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {channel.name}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsList}>
              {/* Pin/Unpin */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => handleAction(onTogglePin)}
                activeOpacity={0.7}
              >
                <GlassView
                  {...liquidGlass.fill}
                  borderRadius={12}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.iconCircle}>
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={18}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons
                    name={channel.isPinned ? "pin-outline" : "pin"}
                    size={18}
                    color="#fff"
                  />
                </View>
                <Text style={styles.actionText}>
                  {channel.isPinned
                    ? "Unpin conversation"
                    : "Pin conversation"}
                </Text>
              </TouchableOpacity>

              {/* Delete + Block — only for non-concierge */}
              {!channel.isConcierge && (
                <>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => handleAction(onDelete)}
                    activeOpacity={0.7}
                  >
                    <GlassView
                      {...liquidGlass.fill}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.iconCircle}>
                      <GlassView
                        {...liquidGlass.fillMedium}
                        borderRadius={18}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#FF3B30"
                      />
                    </View>
                    <Text style={[styles.actionText, styles.dangerText]}>
                      Delete conversation
                    </Text>
                  </TouchableOpacity>

                  {channel.otherUserId && (
                    <TouchableOpacity
                      style={styles.actionRow}
                      onPress={() => handleAction(onBlock)}
                      activeOpacity={0.7}
                    >
                      <GlassView
                        {...liquidGlass.fill}
                        borderRadius={12}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.iconCircle}>
                        <GlassView
                          {...liquidGlass.fillMedium}
                          borderRadius={18}
                          style={StyleSheet.absoluteFill}
                        />
                        <Ionicons
                          name="ban-outline"
                          size={18}
                          color="#FF3B30"
                        />
                      </View>
                      <Text style={[styles.actionText, styles.dangerText]}>
                        Block user
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
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
  header: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  actionText: {
    fontSize: 16,
    color: "#fff",
  },
  dangerText: {
    color: "#FF3B30",
  },
});
