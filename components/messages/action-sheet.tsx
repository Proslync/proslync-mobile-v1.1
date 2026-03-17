// Action Sheet - Long press actions for conversations

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
import { Conversation } from "../../lib/types/messages.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

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
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  React.useEffect(() => {
    if (visible && conversation) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, conversation?.id]);

  const handleAction = React.useCallback((action: () => void) => {
    bottomSheetRef.current?.close();
    setTimeout(action, 150);
  }, []);

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
                    {...(action.color === "#ff3b30" ? liquidGlass.danger : liquidGlass.fill)}
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
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  preview: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  previewTitle: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
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
    fontFamily: "Lato_400Regular",
  },
});
