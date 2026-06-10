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

interface MiniVenueCardProps {
  venueId: number;
}

interface VenueSummary {
  id: number | string;
  name: string;
  city?: string | null;
  state?: string | null;
  capacity?: number | null;
}

export function MiniVenueCard({ venueId }: MiniVenueCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();

  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue", venueId],
    queryFn: () => apiClient.get<VenueSummary>(`/api/venues/${venueId}`),
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

  const name = venue?.name ?? `Venue #${venueId}`;
  const location = [venue?.city, venue?.state].filter(Boolean).join(", ");

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: cardBorder }]}
      onPress={() => router.push({ pathname: "/venue/[id]", params: { id: String(venueId) } })}
      activeOpacity={0.8}
    >
      <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.iconBox, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <Ionicons name="location" size={22} color={colors.textTertiary} />
      </View>
      <View style={styles.infoColumn}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {location ? (
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {location}
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
  name: {
    fontSize: 14,
  },
  location: {
    fontSize: 12,
  },
});
