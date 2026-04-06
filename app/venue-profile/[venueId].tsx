// Venue Profile Screen — Store-style layout with hero image grid, overlaid controls, and event cards

import React, { useEffect, useState } from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useVenue } from "@/hooks/use-venue-query";
import { useFollowVenue } from "@/hooks/use-follow-venue";
import { useVenueFollowers } from "@/hooks/use-venue-followers";
import { useAuth } from "@/lib/providers/auth-provider";
import { eventsApi } from "@/lib/api/events";
import { useFeed } from "@/hooks/use-feed";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { Event } from "@/lib/types/events.types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.32;

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1000).toFixed(0) + "K";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function VenueProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ venueId: string }>();
  const venueId = params.venueId ? Number(params.venueId) : undefined;

  const { data: venue, isLoading } = useVenue(venueId);
  const {
    isFollowing,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowVenue(venueId);
  const { total: followersCount } = useVenueFollowers({ venueId });

  const [venueEvents, setVenueEvents] = useState<Event[]>([]);
  useEffect(() => {
    if (!venueId) return;
    eventsApi.getEvents().then((events) => {
      setVenueEvents(events.filter((e) => e.venueId === venueId || e.venue?.id === venueId));
    }).catch(() => {});
  }, [venueId]);

  const now = new Date();
  const upcomingEvents = venueEvents.filter((e) => new Date(e.endDate || e.startDate) >= now);
  const pastEvents = venueEvents.filter((e) => new Date(e.endDate || e.startDate) < now);

  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const handleFollowPress = async () => {
    if (isFollowActionInProgress) return;
    if (isFollowing) await unfollow();
    else await follow();
  };

  const handleSharePress = async () => {
    try {
      await Share.share({
        message: `Check out ${venue?.name || "this venue"} on Status!`,
      });
    } catch {}
  };

  const handleEventPress = (event: Event) => {
    router.push({
      pathname: "/event/[id]",
      params: { id: String(event.id) },
    });
  };

  // Find a video from the feed for this venue
  const { items: feedItems } = useFeed({ feedType: "foryou", enabled: true });
  const venueVideo = feedItems.find(
    (item) => item.venueId === venueId && item.mediaType === "video" && item.videoUrl
  )?.videoUrl;

  // Hero image fallback
  const heroImage = venue?.imageUrl
    || venueEvents.find((e) => e.flyer?.url || e.imageUrl)?.flyer?.url
    || venueEvents.find((e) => e.imageUrl)?.imageUrl
    || "";

  // Video player
  const player = useVideoPlayer(venueVideo || null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (isLoading || !venue) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section — Photo Grid with Overlays */}
        <View style={styles.hero}>
          {/* Hero Media — Video or Image */}
          {venueVideo && player ? (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
            />
          ) : heroImage ? (
            <Image
              source={{ uri: heroImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#888" }]} />
          )}

          {/* Gradient fade into background */}
          <LinearGradient
            colors={[
              "transparent",
              "transparent",
              "rgba(242,242,242,0.1)",
              "rgba(242,242,242,0.25)",
              "rgba(242,242,242,0.45)",
              "rgba(242,242,242,0.65)",
              "rgba(242,242,242,0.85)",
              "#f2f2f2",
            ]}
            locations={[0, 0.6, 0.68, 0.74, 0.8, 0.86, 0.93, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Top controls */}
          <View style={[styles.topControls, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.glassPill}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.surface}
                tintColor="rgba(0,0,0,0.3)"
                borderRadius={20}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topControlsRight}>
              <TouchableOpacity
                style={styles.followPill}
                onPress={handleFollowPress}
                activeOpacity={0.7}
                disabled={isFollowActionInProgress}
              >
                <GlassView
                  {...liquidGlass.surface}
                  tintColor="rgba(0,0,0,0.3)"
                  borderRadius={20}
                  style={StyleSheet.absoluteFill}
                />
                {isFollowActionInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.followText}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.glassPill}
                onPress={handleSharePress}
                activeOpacity={0.7}
              >
                <GlassView
                  {...liquidGlass.surface}
                  tintColor="rgba(0,0,0,0.3)"
                  borderRadius={20}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered Venue Info */}
          <View style={styles.heroCenter}>
            {venue.imageUrl ? (
              <Image
                source={{ uri: venue.imageUrl }}
                style={styles.venueLogo}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.venueLogo, styles.venueLogoPlaceholder]}>
                <Text style={styles.venueLogoInitial}>
                  {venue.name?.[0]?.toUpperCase() || "V"}
                </Text>
              </View>
            )}
            <Text style={styles.followersText}>
              {formatCount(followersCount)} followers
            </Text>
          </View>
        </View>

        {/* Search Pill */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchPill}
            activeOpacity={0.7}
            onPress={() => router.push("/search-screen")}
          >
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionInner}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventsScroll}
              >
                {upcomingEvents.map((event) => {
                  const imageUrl = event.flyer?.url || event.imageUrl;
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      activeOpacity={0.8}
                      onPress={() => handleEventPress(event)}
                    >
                      <View style={styles.eventImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.eventImagePlaceholder}>
                            <Ionicons name="calendar" size={28} color="rgba(0,0,0,0.15)" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.eventName} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.eventDate} numberOfLines={1}>
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      {event.isPaid && event.doorCoverPriceCents ? (
                        <Text style={styles.eventPrice}>
                          ${(event.doorCoverPriceCents / 100).toFixed(0)}
                        </Text>
                      ) : (
                        <Text style={styles.eventPrice}>Free</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Past Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionInner}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            {pastEvents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.eventsScroll}
              >
                {pastEvents.map((event) => {
                  const imageUrl = event.flyer?.url || event.imageUrl;
                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      activeOpacity={0.8}
                      onPress={() => handleEventPress(event)}
                    >
                      <View style={styles.eventImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.eventImagePlaceholder}>
                            <Ionicons name="calendar" size={28} color="rgba(0,0,0,0.15)" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.eventName} numberOfLines={1}>
                        {event.name}
                      </Text>
                      <Text style={styles.eventDate} numberOfLines={1}>
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptyCardText}>No past events yet</Text>
            )}
          </View>
        </View>

        {/* Contact & Info Section */}
        {(venue.description || venue.phoneNumber || venue.website || venue.address) && (
          <View style={styles.infoSection}>
            <View style={styles.infoSectionInner}>
              {venue.description ? (
                <Text style={styles.description}>{venue.description}</Text>
              ) : null}

              {venue.address && (
                <TouchableOpacity style={styles.infoRow} activeOpacity={0.7}>
                  <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {[venue.address, venue.city, venue.state].filter(Boolean).join(", ")}
                  </Text>
                </TouchableOpacity>
              )}

              {venue.phoneNumber && (
                <TouchableOpacity
                  style={styles.infoRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`tel:${venue.phoneNumber}`)}
                >
                  <Ionicons name="call-outline" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.infoText}>{venue.phoneNumber}</Text>
                </TouchableOpacity>
              )}

              {venue.website && (
                <TouchableOpacity
                  style={styles.infoRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    Linking.openURL(
                      venue.website!.startsWith("http") ? venue.website! : `https://${venue.website}`
                    )
                  }
                >
                  <Ionicons name="globe-outline" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {venue.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Empty state if no events */}
        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    position: "relative",
  },

  // Top controls
  topControls: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  topControlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glassPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  followPill: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  followText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Hero center content
  heroCenter: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  venueLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  venueLogoPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  venueLogoInitial: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  venueName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: SCREEN_WIDTH - 60,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  followersText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },

  // Search
  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 4,
  },
  searchPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Events section
  eventsSection: {
    paddingHorizontal: 14,
    marginBottom: 16,
    marginTop: -10,
  },
  eventsSectionInner: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#000",
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  eventsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCard: {
    width: 160,
    marginRight: 12,
  },
  eventImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
  },
  eventImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  eventName: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  eventDate: {
    color: "rgba(0,0,0,0.45)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  eventPrice: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  // Info section
  infoSection: {
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  infoSectionInner: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
  },
  description: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    flex: 1,
  },

  // Empty
  emptyEvents: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  emptyCardText: {
    color: "rgba(0,0,0,0.35)",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
