// Info Sheet - Thread details modal (native SwiftUI sheet)

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { Conversation } from "../../lib/types/messages.types";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { NativeSheet } from "@/components/ui/native-sheet";

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
  const { colors } = useAppTheme();
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);

  const handleViewEvent = React.useCallback(
    (eventId: string) => {
      onClose();
      setTimeout(() => onViewEvent?.(eventId), 150);
    },
    [onClose, onViewEvent],
  );

  const participant = conversation?.participants[0];

  return (
    <>
      <NativeSheet
        isPresented={visible && !!conversation}
        onDismiss={onClose}
        detents={["medium", "large"]}
        rnContent
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {conversation && (
            <View style={styles.content}>
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
                <Text
                  style={[styles.roleText, { color: colors.textSecondary }]}
                >
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
                        true: "rgba(255,255,255,0.4)",
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
                        true: "rgba(255,255,255,0.4)",
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
            </View>
          )}
        </ScrollView>
      </NativeSheet>

      <ConfirmSheet
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

      <ConfirmSheet
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontWeight: "700",
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  roleText: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    paddingVertical: 4,
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
    fontWeight: "700",
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 13,
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
    color: "#ff3b30",
  },
});
