// Native SwiftUI Nearby Sheet — Apple Maps-style persistent overlay
// Uses @expo/ui BottomSheet with peek/half/full detents, map stays interactive

import * as React from "react";
import {
  BottomSheet,
  Button,
  Group,
  Host,
  HStack,
  Image as SwiftImage,
  ScrollView as SwiftScrollView,
  Text,
  VStack,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
  presentationBackgroundInteraction,
  padding,
  frame,
  font,
  foregroundStyle,
  glassEffect,
  buttonStyle,
  controlSize,
} from "@expo/ui/swift-ui/modifiers";
import { preferredColorScheme } from "@/modules/native-ui-ext";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView as RNScrollView,
  Text as RNText,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  const { isDark, colors } = useAppTheme();
  const scheme = isDark ? "dark" : "light";

  const primary = foregroundStyle({ type: "hierarchical", style: "primary" });
  const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });
  const tertiary = foregroundStyle({ type: "hierarchical", style: "tertiary" });

  return (
    <Host
      style={{ position: "absolute", width: 0, height: 0 }}
      colorScheme={scheme}
    >
      <BottomSheet
        isPresented={true}
        onIsPresentedChange={(presented) => {
          if (!presented) onDismiss();
        }}
      >
        <Group
          modifiers={[
            presentationDetents([
              { fraction: 0.15 },
              { fraction: 0.45 },
              "large",
            ]),
            presentationDragIndicator("visible"),
            presentationBackgroundInteraction("enabled"),
            preferredColorScheme(scheme),
          ]}
        >
          <SwiftScrollView>
            <VStack
              alignment="leading"
              spacing={20}
              modifiers={[padding({ horizontal: 20, top: 8, bottom: 40 })]}
            >
              {/* Header */}
              <HStack spacing={8}>
                <Text modifiers={[font({ size: 22, weight: "bold" }), primary]}>
                  Nearby
                </Text>

                {liveCount > 0 && (
                  <Text modifiers={[font({ size: 13 }), foregroundStyle("#ff3b30")]}>
                    {`● ${liveCount} Live`}
                  </Text>
                )}

                {isLoading && (
                  <RNHostView matchContents>
                    <ActivityIndicator size="small" color={colors.textTertiary} />
                  </RNHostView>
                )}
              </HStack>

              {/* Friends section */}
              <VStack alignment="leading" spacing={10}>
                <Text modifiers={[font({ size: 13, weight: "semibold" }), secondary]}>
                  Friends
                </Text>

                {nearbyFriends.length > 0 ? (
                  <SwiftScrollView axes="horizontal" showsIndicators={false}>
                    <HStack spacing={14}>
                      {nearbyFriends.map((friend) => (
                        <RNHostView key={friend.id} matchContents>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                          </TouchableOpacity>
                        </RNHostView>
                      ))}
                    </HStack>
                  </SwiftScrollView>
                ) : (
                  <HStack spacing={10}>
                    <Text modifiers={[font({ size: 14 }), tertiary]}>
                      {isSharing
                        ? "No friends sharing"
                        : "Share location to see friends"}
                    </Text>

                    {!isSharing && (
                      <Button
                        systemImage="location"
                        label="Share"
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onSharePress();
                        }}
                        modifiers={[buttonStyle("glass"), controlSize("small")]}
                      />
                    )}
                  </HStack>
                )}
              </VStack>

              {/* Events section */}
              <VStack alignment="leading" spacing={10}>
                <Text modifiers={[font({ size: 13, weight: "semibold" }), secondary]}>
                  Events
                </Text>

                {isLoading && events.length === 0 ? (
                  <RNHostView matchContents>
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator size="large" color={colors.textTertiary} />
                    </View>
                  </RNHostView>
                ) : events.length === 0 ? (
                  <Text modifiers={[font({ size: 14 }), tertiary]}>
                    No events nearby
                  </Text>
                ) : (
                  <RNHostView matchContents>
                    <RNScrollView
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
                              <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <RNText style={styles.liveText}>LIVE</RNText>
                              </View>
                            )}
                            <RNText style={styles.eventTitle} numberOfLines={1}>
                              {event.title}
                            </RNText>
                            <RNText style={styles.eventVenue} numberOfLines={1}>
                              {event.venue}
                            </RNText>
                            <RNText style={styles.eventMeta}>
                              {event.date} @ {event.time}
                            </RNText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </RNScrollView>
                  </RNHostView>
                )}
              </VStack>
            </VStack>
          </SwiftScrollView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
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
    bottom: 0,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34c759",
    borderWidth: 2,
    borderColor: "#000",
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  eventsScroll: {
    gap: 12,
    paddingRight: 20,
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
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff3b30",
  },
  liveText: {
    fontSize: 10,
    fontFamily: "Lato_700Bold",
    color: "#ff3b30",
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  eventVenue: {
    fontSize: 11,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  eventMeta: {
    fontSize: 10,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
});
