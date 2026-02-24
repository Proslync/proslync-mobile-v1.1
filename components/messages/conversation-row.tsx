// Conversation Row - A single conversation item in the inbox list

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Conversation } from "../../lib/types/messages.types";

const DefaultAvatarImage = require("@/assets/images/default-avatar.png");

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
          style={styles.avatar}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {conversation.title}
            </Text>
            {isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#3b82f6"
                style={styles.verifiedIcon}
              />
            )}
            {conversation.isPinned && (
              <Ionicons
                name="pin"
                size={12}
                color="rgba(255, 255, 255, 0.4)"
                style={styles.statusIcon}
              />
            )}
            {conversation.isMuted && (
              <Ionicons
                name="notifications-off"
                size={12}
                color="rgba(255, 255, 255, 0.4)"
                style={styles.statusIcon}
              />
            )}
          </View>
          <Text style={styles.timestamp}>
            {conversation.lastMessage
              ? formatTimestamp(conversation.lastMessage.createdAt)
              : ""}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {getMessagePreview(conversation, "current-user")}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
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
        color="rgba(255, 255, 255, 0.25)"
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    color: "#ffffff",
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
    color: "rgba(255, 255, 255, 0.4)",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preview: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },
  previewUnread: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  unreadBadge: {
    backgroundColor: "#0095f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Lato_700Bold",
  },
  chevron: {
    marginLeft: 4,
  },
});
