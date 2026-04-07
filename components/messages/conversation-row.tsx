// Conversation Row - A single conversation item in the inbox list

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { glassText, glassBorder } from "@/constants/glass/liquid-glass";
import { Conversation } from "../../lib/types/messages.types";
import { formatTimestamp } from "@/lib/utils/date";

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
}

function getMessagePreview(
  conversation: Conversation,
  currentUserId: string,
): string {
  const msg = conversation.lastMessage;
  if (!msg) return "No messages yet";

  const isOwn = msg.senderId === currentUserId;
  const prefix = isOwn ? "You: " : "";

  switch (msg.type) {
    case "text":
      return prefix + (msg.text || "");
    case "image":
      return prefix + "Sent a photo";
    case "eventCard":
      return (
        prefix + `Shared an event: ${msg.eventCard?.eventTitle || "Event"}`
      );
    case "system":
      return msg.text || "";
    default:
      return "";
  }
}

export function ConversationRow({
  conversation,
  onPress,
  onLongPress,
}: ConversationRowProps) {
  const { isDark } = useAppTheme();
  const theme = isDark ? "dark" : "light";
  const t = glassText[theme];
  const border = glassBorder[theme];

  const participant = conversation.participants[0];
  const isVerified = participant?.isVerified;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={300}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            participant?.avatarUrl
              ? { uri: participant.avatarUrl }
              : DefaultAvatarImage
          }
          style={[styles.avatar, { borderColor: border }]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, { color: t.primary }, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {conversation.title}
            </Text>
            {isVerified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={14}
                color="#3897F0"
                style={styles.verifiedIcon}
              />
            )}
            {conversation.isPinned && (
              <Ionicons
                name="pin"
                size={12}
                color={t.muted}
                style={styles.statusIcon}
              />
            )}
            {conversation.isMuted && (
              <Ionicons
                name="notifications-off"
                size={12}
                color={t.muted}
                style={styles.statusIcon}
              />
            )}
          </View>
          <Text style={[styles.timestamp, { color: t.muted }]}>
            {conversation.lastMessage
              ? formatTimestamp(conversation.lastMessage.createdAt)
              : ""}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, { color: t.tertiary }, hasUnread && { color: t.secondary }]}
            numberOfLines={1}
          >
            {getMessagePreview(conversation, "current-user")}
          </Text>
          {hasUnread && (
            <View style={[styles.unreadBadge, { backgroundColor: t.primary }]}>
              <Text style={[styles.unreadText, { color: isDark ? '#000' : '#fff' }]}>
                {conversation.unreadCount > 99
                  ? "99+"
                  : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={t.faint}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: "Lato_400Regular",
    flexShrink: 1,
  },
  nameUnread: {
    fontFamily: "Lato_700Bold",
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preview: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: "Lato_700Bold",
  },
  chevron: {
    marginLeft: 4,
  },
});
