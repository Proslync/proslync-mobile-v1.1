import * as React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  type CheckInContact,
  TAG_COLORS,
  sourceLabel,
  getInitials,
} from "./utils";

interface ContactRowProps {
  item: CheckInContact;
  isCollecting: boolean;
  isAnyCollecting: boolean;
  doorCoverDisplay: string;
  onPress: (item: CheckInContact) => void;
  onCharge: (item: CheckInContact) => void;
}

export const ContactRow = React.memo(function ContactRow({
  item,
  isCollecting,
  isAnyCollecting,
  doorCoverDisplay,
  onPress,
  onCharge,
}: ContactRowProps) {
  const { colors, isDark } = useAppTheme();
  const label = sourceLabel(item.source, item.isGuest);
  const initials = getInitials(item.name);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(item)}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.springify()}
        style={[
          styles.guestRow,
          {
            borderColor: colors.border,
          },
        ]}
      >
        <GlassView
          {...liquidGlass.surface}
          borderRadius={14}
          style={StyleSheet.absoluteFillObject}
        />
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const },
            ]}
          >
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={21} style={StyleSheet.absoluteFillObject} />}
            <Text
              style={[
                styles.avatarInitials,
                { color: colors.textSecondary },
              ]}
            >
              {initials}
            </Text>
          </View>
        )}

        <View style={styles.guestInfo}>
          <Text
            style={[styles.guestName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.userName ? `@${item.userName}` : item.name}
          </Text>
          <View style={styles.guestMeta}>
            {item.userName && (
              <Text
                style={[
                  styles.guestMetaText,
                  { color: colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            )}
            {!!label && (
              <Text
                style={[
                  styles.guestMetaText,
                  { color: item.isGuest ? "#fbbf24" : "#34d399" },
                ]}
              >
                {label}
              </Text>
            )}
          </View>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => {
                const color = TAG_COLORS[tag] || "#6b7280";
                return (
                  <View
                    key={tag}
                    style={[
                      styles.tagBadge,
                      { backgroundColor: `${color}20` },
                    ]}
                  >
                    <Text style={[styles.tagBadgeText, { color }]}>
                      {tag.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {item.paid ? (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.paidBadgeText}>Paid</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.chargeButton,
              {
                overflow: 'hidden',
                borderColor: colors.border,
              },
            ]}
            onPress={() => onCharge(item)}
            activeOpacity={0.8}
            disabled={isCollecting || isAnyCollecting}
          >
            <GlassView {...liquidGlass.fill} borderRadius={10} style={StyleSheet.absoluteFillObject} />
            {isCollecting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons
                  name="phone-portrait-outline"
                  size={14}
                  color={colors.text}
                />
                <Text
                  style={[styles.chargeButtonText, { color: colors.text }]}
                >
                  Charge {doorCoverDisplay}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  guestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  guestName: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  guestMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },
  guestMetaText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontFamily: "Lato_700Bold",
  },
  chargeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chargeButtonText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  paidBadgeText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#10b981",
  },
});
