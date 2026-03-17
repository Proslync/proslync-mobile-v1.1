// Info Sheet - Thread details modal

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Conversation } from "../../lib/types/messages.types";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;
const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

interface InfoSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onMuteToggle: () => void;
  onPinToggle: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onViewEvent?: (eventId: string) => void;
}

export function InfoSheet({
  visible,
  onClose,
  conversation,
  onMuteToggle,
  onPinToggle,
  onBlock,
  onReport,
  onViewEvent,
}: InfoSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);

  React.useEffect(() => {
    if (visible && conversation) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, conversation?.id]);

  const handleViewEvent = React.useCallback(
    (eventId: string) => {
      bottomSheetRef.current?.close();
      setTimeout(() => onViewEvent?.(eventId), 150);
    },
    [onViewEvent],
  );

  const participant = conversation?.participants[0];

  return (
    <>
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
            <BottomSheetScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <Image
                  source={
                    participant?.avatarUrl
                      ? { uri: participant.avatarUrl }
                      : DefaultAvatarImage
                  }
                  style={styles.avatar}
                />
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {conversation.title}
                  </Text>
                  {participant?.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#3b82f6"
                      style={styles.verifiedIcon}
                    />
                  )}
                </View>
                <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                  {participant?.role === "venue"
                    ? "Venue"
                    : participant?.role === "promoter"
                      ? "Promoter"
                      : participant?.role === "support"
                        ? "Support"
                        : "Guest"}
                </Text>
              </View>

              {/* Event Context Card */}
              {conversation.context && (
                <View style={styles.section}>
                  <TouchableOpacity
                    style={[styles.eventCard, { overflow: "hidden" }]}
                    onPress={() =>
                      handleViewEvent(conversation.context!.eventId)
                    }
                    activeOpacity={0.8}
                  >
                    <GlassView
                      {...liquidGlass.fill}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <Image
                      source={{ uri: conversation.context.flyerUrl }}
                      style={styles.eventFlyer}
                    />
                    <View style={styles.eventInfo}>
                      <Text
                        style={[styles.eventTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {conversation.context.eventTitle}
                      </Text>
                      <Text
                        style={[
                          styles.eventVenue,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {conversation.context.venueName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Settings */}
              <View style={styles.section}>
                <View style={styles.settingsGroup}>
                  <View style={styles.settingRow}>
                    <GlassView
                      {...liquidGlass.fill}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconCircle}>
                        <GlassView
                          {...liquidGlass.fillMedium}
                          borderRadius={14}
                          style={StyleSheet.absoluteFill}
                        />
                        <Ionicons
                          name="pin"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[styles.settingText, { color: colors.text }]}
                      >
                        Pin
                      </Text>
                    </View>
                    <Switch
                      value={conversation.isPinned}
                      onValueChange={onPinToggle}
                      trackColor={{
                        false: "rgba(255, 255, 255, 0.2)",
                        true: "#0095f6",
                      }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <GlassView
                      {...liquidGlass.fill}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.settingLeft}>
                      <View style={styles.settingIconCircle}>
                        <GlassView
                          {...liquidGlass.fillMedium}
                          borderRadius={14}
                          style={StyleSheet.absoluteFill}
                        />
                        <Ionicons
                          name="notifications-off"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[styles.settingText, { color: colors.text }]}
                      >
                        Mute
                      </Text>
                    </View>
                    <Switch
                      value={conversation.isMuted}
                      onValueChange={onMuteToggle}
                      trackColor={{
                        false: "rgba(255, 255, 255, 0.2)",
                        true: "#0095f6",
                      }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              </View>

              {/* Danger Zone */}
              <View style={styles.section}>
                <View style={styles.dangerGroup}>
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => setShowBlockConfirm(true)}
                    activeOpacity={0.7}
                  >
                    <GlassView
                      {...liquidGlass.danger}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.settingIconCircle}>
                      <GlassView
                        {...liquidGlass.fillMedium}
                        borderRadius={14}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons name="ban" size={16} color="#ff3b30" />
                    </View>
                    <Text style={styles.dangerText}>Block</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => setShowReportConfirm(true)}
                    activeOpacity={0.7}
                  >
                    <GlassView
                      {...liquidGlass.danger}
                      borderRadius={12}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.settingIconCircle}>
                      <GlassView
                        {...liquidGlass.fillMedium}
                        borderRadius={14}
                        style={StyleSheet.absoluteFill}
                      />
                      <Ionicons name="flag" size={16} color="#ff3b30" />
                    </View>
                    <Text style={styles.dangerText}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>

      <ConfirmModal
        visible={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={() => {
          setShowBlockConfirm(false);
          onBlock?.();
        }}
        title="Block User"
        message={`Are you sure you want to block ${conversation?.title ?? "this user"}?`}
        confirmLabel="Block"
        destructive
        icon="ban"
      />

      <ConfirmModal
        visible={showReportConfirm}
        onClose={() => setShowReportConfirm(false)}
        onConfirm={() => {
          setShowReportConfirm(false);
          onReport?.();
        }}
        title="Report"
        message="Report this conversation for review?"
        confirmLabel="Report"
        destructive
        icon="flag-outline"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  roleText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  section: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
  },
  eventFlyer: {
    width: 50,
    height: 66,
    borderRadius: 8,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  settingsGroup: {
    gap: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  settingText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  dangerGroup: {
    gap: 4,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  dangerText: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    color: "#ff3b30",
  },
});
