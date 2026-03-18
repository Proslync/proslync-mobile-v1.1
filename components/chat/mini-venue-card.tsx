import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { venuesApi } from "@/lib/api/venues";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useStableRouter } from "@/hooks/use-stable-router";

interface MiniVenueCardProps {
  venueId: number;
}

export function MiniVenueCard({ venueId }: MiniVenueCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue", venueId],
    queryFn: () => venuesApi.getVenue(venueId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleFollow = async () => {
    if (isFollowing || followLoading) return;
    setFollowLoading(true);
    try {
      await venuesApi.followVenue(venueId);
      setIsFollowing(true);
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePress = () => {
    if (!venue) return;
    router.push({
      pathname: "/(tabs)/search",
      params: { venueName: venue.name },
    });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.card,
          {
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator
          size="small"
          color={colors.textSecondary}
          style={{ padding: 30 }}
        />
      </View>
    );
  }

  if (!venue) return null;

  const address = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
      {/* Venue Image */}
      {venue.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: venue.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View
          style={[
            styles.imageContainer,
            styles.imagePlaceholder,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <Ionicons
            name="location-outline"
            size={32}
            color={colors.textTertiary}
          />
        </View>
      )}

      {/* Info Section */}
      <View style={styles.info}>
        <Text
          style={[styles.venueName, { color: colors.text }]}
          numberOfLines={2}
        >
          {venue.name}
        </Text>
        {address ? (
          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={11}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.addressText, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {address}
            </Text>
          </View>
        ) : null}

        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followButtonDone]}
          onPress={(e) => {
            e.stopPropagation?.();
            handleFollow();
          }}
          disabled={isFollowing || followLoading}
          activeOpacity={0.8}
        >
          <GlassView
            {...(isFollowing ? liquidGlass.fillFaint : liquidGlass.fill)}
            borderRadius={8}
            style={StyleSheet.absoluteFill}
          />
          {followLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[styles.followText, isFollowing && styles.followTextDone]}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: 10,
    gap: 3,
  },
  venueName: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  addressText: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    flex: 1,
  },
  followButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignSelf: "stretch",
    marginTop: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  followButtonDone: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  followText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  followTextDone: {
    color: "rgba(255,255,255,0.5)",
  },
});
