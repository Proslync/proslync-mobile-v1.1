// Native SwiftUI Nearby Sheet — uses native BottomSheet with RN content inside
// All content is React Native wrapped in RNHostView (SwiftUI Image doesn't support URLs)

import * as React from "react";
import {
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Text,
} from "react-native";
import { type PresentationDetent } from "@expo/ui/swift-ui/modifiers";
import { NativeSheet } from "@/components/ui/native-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import * as Haptics from "expo-haptics";

const DefaultAvatar = require("@/assets/images/default-avatar.png");

interface FriendMarker {
  id: string;
  name: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

interface MapEvent {
  id: string;
  title: string;
  venue: string;
  imageUrl: string;
  date: string;
  time: string;
  isLive?: boolean;
}

interface NearbyNativeSheetProps {
  events: MapEvent[];
  isLoading: boolean;
  liveCount: number;
  nearbyFriends: FriendMarker[];
  isSharing: boolean;
  onFriendPress: (friend: FriendMarker) => void;
  onEventPress: (event: MapEvent) => void;
  onSharePress: () => void;
  onDismiss: () => void;
}

export function NearbyNativeSheet({
  events,
  isLoading,
  liveCount,
  nearbyFriends,
  isSharing,
  onFriendPress,
  onEventPress,
  onSharePress,
  onDismiss,
}: NearbyNativeSheetProps) {
  const detents: PresentationDetent[] = [
    { fraction: 0.15 },
    { fraction: 0.45 },
    "large",
  ];
  const [selectedDetent, setSelectedDetent] =
    React.useState<PresentationDetent>({ fraction: 0.45 });

  return (
    <NativeSheet
      isPresented={true}
      onDismiss={onDismiss}
      detents={detents}
      selectedDetent={selectedDetent}
      onDetentChange={setSelectedDetent}
      backgroundInteraction="enabled"
      rnContent
    >
      <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* ─── Header ─── */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Nearby</Text>
                {liveCount > 0 && (
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>{liveCount} Live</Text>
                  </View>
                )}
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color="rgba(255,255,255,0.4)"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>

              {/* ─── Friends Section ─── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="people"
                    size={14}
                    color="rgba(255,255,255,0.5)"
                  />
                  <Text style={styles.sectionTitle}>Friends</Text>
                </View>

                {nearbyFriends.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.friendsScroll}
                  >
                    {nearbyFriends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          onFriendPress(friend);
                        }}
                        activeOpacity={0.7}
                        style={styles.friendItem}
                      >
                        <Image
                          source={
                            friend.imageUrl
                              ? { uri: friend.imageUrl }
                              : DefaultAvatar
                          }
                          style={styles.friendAvatar}
                        />
                        <View style={styles.friendOnline} />
                        <Text style={styles.friendName} numberOfLines={1}>
                          {friend.name.split(" ")[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>
                      {isSharing
                        ? "No friends sharing"
                        : "Share location to see friends"}
                    </Text>
                    {!isSharing && (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          onSharePress();
                        }}
                        activeOpacity={0.7}
                        style={styles.shareBtn}
                      >
                        {/* @ts-expect-error — augmented GlassViewProps */}
                        <GlassView
                          {...liquidGlass.fillMedium}
                          borderRadius={8}
                          style={StyleSheet.absoluteFill}
                          isInteractive
                        />
                        <Ionicons
                          name="location"
                          size={14}
                          color="#fff"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.shareBtnText}>Share</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* ─── Events Section ─── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="calendar"
                    size={14}
                    color="rgba(255,255,255,0.5)"
                  />
                  <Text style={styles.sectionTitle}>Events</Text>
                </View>

                {isLoading && events.length === 0 ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator
                      size="large"
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>
                ) : events.length === 0 ? (
                  <Text style={styles.emptyText}>No events nearby</Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.eventsScroll}
                  >
                    {events.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.eventCard}
                        onPress={() => onEventPress(event)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: event.imageUrl }}
                          style={styles.eventImage}
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.85)"]}
                          style={styles.eventGradient}
                        />
                        <View style={styles.eventContent}>
                          {event.isLive && (
                            <View style={styles.eventLiveBadge}>
                              <View style={styles.eventLiveDot} />
                              <Text style={styles.eventLiveText}>LIVE</Text>
                            </View>
                          )}
                          <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <Text style={styles.eventVenue} numberOfLines={1}>
                            {event.venue}
                          </Text>
                          <Text style={styles.eventMeta}>
                            {event.date} @ {event.time}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ff3b30",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  friendsScroll: {
    gap: 14,
  },
  friendItem: {
    alignItems: "center",
    width: 56,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  friendOnline: {
    position: "absolute",
    top: 36,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34c759",
    borderWidth: 2,
    borderColor: "#000",
  },
  friendName: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    textAlign: "center",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  eventsScroll: {
    gap: 12,
  },
  eventCard: {
    width: 200,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1c1c1e",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  eventGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  eventContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  eventLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  eventLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  eventLiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ff3b30",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  eventVenue: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  eventMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
});
