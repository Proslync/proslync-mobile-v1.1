// Venue Profile Screen — Public venue profile similar to user profiles

import React from "react";
import { useStableRouter } from "@/hooks/use-stable-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
  Linking,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useVenue } from "@/hooks/use-venue-query";
import { useFollowVenue } from "@/hooks/use-follow-venue";
import { useVenueFollowers } from "@/hooks/use-venue-followers";
import { useAuth } from "@/lib/providers/auth-provider";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DefaultVenueImage = require("@/assets/images/default-avatar.png");

function formatStat(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1000).toFixed(0) + "K";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function VenueProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ venueId: string }>();
  const venueId = params.venueId ? Number(params.venueId) : undefined;

  const { data: venue, isLoading, refetch } = useVenue(venueId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });
  const {
    isFollowing,
    isLoading: followLoading,
    follow,
    unfollow,
    isFollowInProgress,
    isUnfollowInProgress,
  } = useFollowVenue(venueId);
  const { total: followersCount } = useVenueFollowers({
    venueId,
  });

  const isOwner = currentUser && venue?.ownerId === currentUser.id;
  const isFollowActionInProgress = isFollowInProgress || isUnfollowInProgress;

  const venueName = venue?.name || "Venue";
  const venueImage = venue?.imageUrl;
  const location = venue
    ? [venue.address, venue.city, venue.state].filter(Boolean).join(", ")
    : "";

  const handleFollowPress = async () => {
    if (isFollowActionInProgress || followLoading) return;
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  const handleSharePress = async () => {
    try {
      await Share.share({
        message: `Check out ${venueName} on Status!`,
        url: `status://venue-profile/${venueId}`,
      });
    } catch {
      /* cancelled */
    }
  };

  const handleManagePress = () => {
    if (!venueId) return;
    router.push(`/manage-venue/${venueId}`);
  };

  const handleCallPress = () => {
    if (venue?.phoneNumber) {
      Linking.openURL(`tel:${venue.phoneNumber}`);
    }
  };

  const handleWebsitePress = () => {
    if (venue?.website) {
      Linking.openURL(
        venue.website.startsWith("http")
          ? venue.website
          : `https://${venue.website}`,
      );
    }
  };

  if (isLoading || !venue) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        {isDark && <DarkGradientBg />}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Venue
          </Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {venueName}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleSharePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="paper-plane-outline"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Profile Section */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.profileSection}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={venueImage ? { uri: venueImage } : DefaultVenueImage}
              style={[styles.avatar, { borderColor: colors.border }]}
            />
          </View>

          <Text
            style={[styles.displayName, { color: colors.text }]}
            numberOfLines={2}
          >
            {venueName}
          </Text>

          {location ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.locationText, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          ) : null}

          {venue.description ? (
            <Text
              style={[styles.bio, { color: colors.textSecondary }]}
              numberOfLines={4}
            >
              {venue.description}
            </Text>
          ) : null}
        </Animated.View>

        {/* Stats Row */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[
            styles.statsRow,
            {
              borderColor: colors.border,
              overflow: "hidden",
            },
          ]}
        >
          <GlassView
            {...liquidGlass.surface}
            borderRadius={16}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {formatStat(followersCount)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Followers
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.actionsRow}
        >
          {isOwner ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.border,
                  overflow: "hidden",
                },
              ]}
              onPress={handleManagePress}
              activeOpacity={0.8}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={10}
                style={StyleSheet.absoluteFillObject}
              />
              <Ionicons name="settings-outline" size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>
                Manage
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: colors.border,
                  overflow: "hidden",
                },
              ]}
              onPress={handleFollowPress}
              activeOpacity={0.8}
              disabled={isFollowActionInProgress}
            >
              <GlassView
                {...liquidGlass.fill}
                borderRadius={10}
                style={StyleSheet.absoluteFillObject}
              />
              {isFollowActionInProgress ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? "checkmark" : "add-outline"}
                    size={16}
                    color={
                      isFollowing ? colors.textTertiary : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: isFollowing
                          ? colors.textTertiary
                          : colors.text,
                      },
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                borderColor: colors.border,
                overflow: "hidden",
              },
            ]}
            onPress={handleSharePress}
            activeOpacity={0.8}
          >
            <GlassView
              {...liquidGlass.fill}
              borderRadius={10}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons
              name="share-outline"
              size={16}
              color={colors.text}
            />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>
              Share
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Contact Info */}
        {(venue.phoneNumber || venue.website || venue.email) && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.contactSection}
          >
            {venue.phoneNumber && (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={handleCallPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {venue.phoneNumber}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
            {venue.website && (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={handleWebsitePress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.text}
                />
                <Text
                  style={[styles.contactText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {venue.website}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
            {venue.email && (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => Linking.openURL(`mailto:${venue.email}`)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={[styles.contactText, { color: colors.text }]}>
                  {venue.email}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Empty content placeholder */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.emptyContent}
        >
          <Ionicons
            name="calendar-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text
            style={[styles.emptyText, { color: colors.textTertiary }]}
          >
            Events coming soon
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 48,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8 },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  displayName: {
    fontSize: 22,
    fontFamily: "Lato_700Bold",
    maxWidth: SCREEN_WIDTH - 100,
    textAlign: "center",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    maxWidth: SCREEN_WIDTH - 120,
  },
  bio: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: SCREEN_WIDTH - 80,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 32,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  contactSection: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lato_400Regular",
  },
  emptyContent: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
