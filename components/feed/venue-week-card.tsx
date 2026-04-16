import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import * as React from "react";
import {
  AppState,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface VenueWeekCardData {
  id: string;
  venueName: string;
  venueLogoUrl: string;
  venueVerified?: boolean;
  backgroundImageUrl?: string;
  videoUrl?: string;
  events: {
    id: string;
    flyerUrl: string;
    day: string;
    ctaLabel: string;
  }[];
}

interface VenueWeekCardProps {
  data: VenueWeekCardData;
  isVisible: boolean;
  onEventPress?: (eventId: string) => void;
  onVenuePress?: (venueId: string) => void;
  onShopAll: () => void;
}

export const VenueWeekCard = React.memo(function VenueWeekCard({
  data,
  isVisible,
  onEventPress,
  onVenuePress,
  onShopAll,
}: VenueWeekCardProps) {
  const hasVideo = !!data.videoUrl;

  // Video player — autoplay muted loop
  const player = useVideoPlayer(hasVideo ? data.videoUrl! : null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Play/pause based on visibility
  React.useEffect(() => {
    if (!player || !hasVideo) return;
    if (isVisible) {
      try {
        player.play();
      } catch {}
    } else {
      try {
        player.pause();
        player.currentTime = 0;
      } catch {}
    }
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [isVisible, player, hasVideo]);

  // Pause when app backgrounds
  React.useEffect(() => {
    if (!player || !hasVideo) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        try {
          player.pause();
        } catch {}
      } else if (isVisible) {
        try {
          player.play();
        } catch {}
      }
    });
    return () => subscription.remove();
  }, [player, hasVideo, isVisible]);

  return (
    <View style={styles.card}>
    <View style={styles.cardInner}>
      {/* Background */}
      {hasVideo && player ? (
        <VideoView
          player={player}
          style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
          contentFit="cover"
          nativeControls={false}
        />
      ) : data.backgroundImageUrl ? (
        <Image
          source={{ uri: data.backgroundImageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBg]} />
      )}

      {/* Dark gradient overlay */}
      <LinearGradient
        colors={["transparent", "transparent", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.venueInfo}
          activeOpacity={0.7}
          onPress={() => onVenuePress?.(data.id)}
        >
          {data.venueLogoUrl ? (
            <Image
              source={{ uri: data.venueLogoUrl }}
              style={styles.venueAvatar}
            />
          ) : (
            <View style={[styles.venueAvatar, styles.venueAvatarFallback]}>
              <Text style={styles.venueInitial}>
                {data.venueName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.venueName} numberOfLines={1}>
            {data.venueName}
          </Text>
          {data.venueVerified && (
            <MaterialCommunityIcons name="check-decagram" size={18} color="#3897F0" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Event flyer scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flyerScrollContent}
        >
          {data.events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.flyerCard}
              activeOpacity={0.8}
              onPress={() => onEventPress?.(event.id)}
            >
              {event.flyerUrl ? (
                <Image
                  source={{ uri: event.flyerUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.flyerPlaceholder]}>
                  <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.3)" />
                </View>
              )}
              {/* Day badge */}
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{event.day}</Text>
              </View>
              {/* CTA button */}
              <View style={styles.ctaWrapper}>
                <View style={styles.ctaButton}>
                  <GlassView {...liquidGlass.fill} borderRadius={14} style={StyleSheet.absoluteFill} />
                  <Text style={styles.ctaText}>{event.ctaLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View all row */}
        <View style={styles.shopAllRow}>
          <Text style={styles.shopAllText}>View all</Text>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={onShopAll}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 28,
    marginBottom: 10,
    marginHorizontal: 12,
    backgroundColor: "#1C1C1C",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 12,
  },
  cardInner: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  fallbackBg: {
    backgroundColor: "#1C1C1C",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    zIndex: 2,
  },
  venueInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  venueAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  venueAvatarFallback: {
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  venueInitial: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  venueName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    paddingHorizontal: 14,
    zIndex: 2,
  },
  flyerScrollContent: {
    paddingRight: 4,
  },
  flyerCard: {
    width: 160,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
  },
  flyerPlaceholder: {
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
  },
  dayBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dayBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
  },
  ctaWrapper: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    alignItems: "center",
  },
  ctaButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    overflow: "hidden",
  },
  ctaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  shopAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  shopAllText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
