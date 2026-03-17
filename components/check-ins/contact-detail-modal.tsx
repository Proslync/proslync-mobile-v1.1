import * as React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  type CheckInContact,
  TAG_COLORS,
  formatDate,
  sourceLabel,
  getInitials,
} from "./utils";

interface ContactDetailModalProps {
  contact: CheckInContact | null;
  onClose: () => void;
}

export function ContactDetailModal({
  contact,
  onClose,
}: ContactDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  if (!contact) return null;

  const initials = getInitials(contact.name);

  const rows: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
  }[] = [];

  if (contact.email) {
    rows.push({ icon: "mail-outline", label: "Email", value: contact.email });
  }
  if (contact.birthDate) {
    rows.push({
      icon: "calendar-outline",
      label: "Date of Birth",
      value: formatDate(contact.birthDate),
    });
  }
  if (contact.documentNumber) {
    rows.push({
      icon: "id-card-outline",
      label: "ID Number",
      value: contact.documentNumber,
    });
  }
  rows.push({
    icon: "enter-outline",
    label: "Source",
    value: sourceLabel(contact.source, contact.isGuest),
  });
  if (contact.lastSeenAt) {
    rows.push({
      icon: "time-outline",
      label: "Last Seen",
      value: formatDate(contact.lastSeenAt),
    });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.textTertiary },
              ]}
            />

            <View style={styles.profileHeader}>
              {contact.avatarUrl ? (
                <Image
                  source={{ uri: contact.avatarUrl }}
                  style={styles.profileAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.profileAvatarPlaceholder,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileInitials,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {initials}
                  </Text>
                </View>
              )}
              <Text style={[styles.profileName, { color: colors.text }]}>
                {contact.userName ? `@${contact.userName}` : contact.name}
              </Text>
              {contact.userName && (
                <Text
                  style={[
                    styles.profileSubname,
                    { color: colors.textTertiary },
                  ]}
                >
                  {contact.name}
                </Text>
              )}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: contact.isGuest
                        ? "rgba(251,191,36,0.15)"
                        : "rgba(52,211,153,0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: contact.isGuest ? "#fbbf24" : "#34d399" },
                    ]}
                  >
                    {contact.isGuest ? "Guest" : "Member"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        contact.checkInStatus === "approved"
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(239,68,68,0.15)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          contact.checkInStatus === "approved"
                            ? "#10b981"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {contact.checkInStatus === "approved"
                      ? "Approved"
                      : "Denied"}
                  </Text>
                </View>
              </View>
              {contact.tags && contact.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {contact.tags.map((tag) => {
                    const color = TAG_COLORS[tag] || "#6b7280";
                    return (
                      <View
                        key={tag}
                        style={[
                          styles.tagChip,
                          { backgroundColor: `${color}20` },
                        ]}
                      >
                        <Text style={[styles.tagChipText, { color }]}>
                          {tag.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <ScrollView style={styles.infoList} bounces={false}>
              {rows.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.infoRow,
                    i < rows.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={row.icon}
                    size={18}
                    color={colors.textTertiary}
                    style={styles.infoIcon}
                  />
                  <View style={styles.infoContent}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: colors.text }]}
                      selectable
                    >
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.4,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  profileAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileInitials: {
    fontSize: 26,
    fontFamily: "Lato_700Bold",
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
  },
  profileSubname: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Lato_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: "Lato_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoList: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    width: 28,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
});
