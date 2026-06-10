import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { apiClient } from "@/lib/api/client";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";

interface MiniEventCardProps {
  eventId: number;
}

interface EventSummary {
  id: number;
  title?: string;
  name?: string;
  startsAt?: string;
  startDate?: string;
  venueName?: string;
  coverUrl?: string;
}

export function MiniEventCard({ eventId }: MiniEventCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiClient.get<EventSummary>(`/api/events/${eventId}`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";

  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: cardBorder }]}>
        <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="small" color={colors.textSecondary} style={{ padding: 20 }} />
      </View>
    );
  }

  const title = event?.title ?? event?.name ?? `Event #${eventId}`;
  const dateStr = event?.startsAt ?? event?.startDate;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: cardBorder }]}
      onPress={() => router.push({ pathname: "/event/[id]", params: { id: String(eventId) } })}
      activeOpacity={0.8}
    >
      <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.iconBox, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <Ionicons name="calendar" size={22} color={colors.textTertiary} />
      </View>
      <View style={styles.infoColumn}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {(formattedDate || event?.venueName) ? (
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {[formattedDate, event?.venueName].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
  },
  sub: {
    fontSize: 12,
  },
});
