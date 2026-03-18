import * as React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
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

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

interface ContactDetailModalProps {
  contact: CheckInContact | null;
  onClose: () => void;
}

export function ContactDetailModal({
  contact,
  onClose,
}: ContactDetailModalProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const visible = !!contact;

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

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

        <View style={styles.profileHeader}>
          {contact.avatarUrl ? (
            <Image
              source={{ uri: contact.avatarUrl }}
              style={styles.profileAvatar}
            />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={36}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.profileInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>
            {contact.userName ? `@${contact.userName}` : contact.name}
          </Text>
          {contact.userName && (
            <Text style={styles.profileSubname}>{contact.name}</Text>
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

        <ScrollView
          style={styles.infoList}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row, i) => (
            <View key={row.label} style={styles.infoRow}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.infoIconCircle}>
                <GlassView
                  {...liquidGlass.fillMedium}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons
                  name={row.icon}
                  size={16}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue} selectable>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => bottomSheetRef.current?.close()}
          activeOpacity={0.7}
        >
          <GlassView
            {...liquidGlass.fillMedium}
            borderRadius={12}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 12,
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
    overflow: "hidden",
  },
  profileInitials: {
    fontSize: 26,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  profileSubname: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
    color: "rgba(255,255,255,0.5)",
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
    marginBottom: 12,
    maxHeight: 300,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
    gap: 12,
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
    color: "rgba(255,255,255,0.5)",
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    color: "#fff",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    overflow: "hidden",
  },
  closeText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
});
