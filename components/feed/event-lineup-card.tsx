import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import * as React from "react";
import {
  AppState,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface EventLineupCardData {
  id: string;
  organizerName: string;
  organizerLogoUrl: string;
  organizerVerified?: boolean;
  backgroundImageUrl?: string;
  videoUrl?: string;
  events: {
    id: string;
    flyerUrl: string;
    price: string;
    isSaved: boolean;
  }[];
  promoText?: string;
  promoBadge?: string;
  promoDetail?: string;
}

interface EventLineupCardProps {
  data: EventLineupCardData;
  isVisible?: boolean;
  onSaveToggle: (eventId: string) => void;
  onEventPress?: (eventId: string) => void;
  onShopAll: () => void;
  onMore: () => void;
}

function HeartButton({
  isSaved,
  onPress,
}: {
  isSaved: boolean;
  onPress: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.heartButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={18}
          color="#fff"
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function EventLineupCard({
  data,
  isVisible = true,
  onSaveToggle,
  onEventPress,
  onShopAll,
  onMore,
}: EventLineupCardProps) {
  const hasPromo = !!(data.promoBadge || data.promoDetail);
  const hasVideo = !!data.videoUrl;

  const player = useVideoPlayer(hasVideo ? data.videoUrl! : null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    if (!player || !hasVideo) return;
    if (isVisible) {
      try { player.play(); } catch {}
    } else {
      try { player.pause(); player.currentTime = 0; } catch {}
    }
    return () => { try { player.pause(); } catch {} };
  }, [isVisible, player, hasVideo]);

  React.useEffect(() => {
    if (!player || !hasVideo) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") { try { player.pause(); } catch {} }
      else if (isVisible) { try { player.play(); } catch {} }
    });
    return () => sub.remove();
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
        <View style={styles.organizerInfo}>
          {data.organizerLogoUrl ? (
            <Image
              source={{ uri: data.organizerLogoUrl }}
              style={styles.organizerAvatar}
            />
          ) : (
            <View style={[styles.organizerAvatar, styles.organizerAvatarFallback]}>
              <Text style={styles.organizerInitial}>
                {data.organizerName?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.organizerName} numberOfLines={1}>
            {data.organizerName}
          </Text>
          {data.organizerVerified && (
            <MaterialCommunityIcons name="check-decagram" size={18} color="#3897F0" />
          )}
        </View>
        <TouchableOpacity
          onPress={onMore}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom section — pinned to bottom like venue-week card */}
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
              {/* Price badge */}
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{event.price}</Text>
              </View>
              {/* Heart button */}
              <HeartButton
                isSaved={event.isSaved}
                onPress={() => onSaveToggle(event.id)}
              />
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

        {/* Promo strip */}
        {hasPromo && (
          <View style={styles.promoStrip}>
            {data.promoBadge && (
              <View style={styles.promoPill}>
                <Text style={styles.promoPillText}>{data.promoBadge}</Text>
              </View>
            )}
            {data.promoDetail && (
              <Text style={styles.promoDetail}>{data.promoDetail}</Text>
            )}
          </View>
        )}
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#1C1C1C",
    borderRadius: 28,
    marginBottom: 10,
    marginHorizontal: 12,
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
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  organizerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  organizerAvatarFallback: {
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  organizerInitial: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  organizerName: {
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
  priceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  heartButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  promoStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  promoPill: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoPillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  promoDetail: {
    color: "#fff",
    fontSize: 13,
    flexShrink: 1,
  },
});
