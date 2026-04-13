// Native SwiftUI Nearby Sheet — collapsible Friends/Events sections
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

type SheetView = "home" | "friends" | "events";

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
  const [activeView, setActiveView] = React.useState<SheetView>("home");

  const goToList = (view: SheetView) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveView(view);
    setSelectedDetent("large");
  };

  const goHome = () => {
    setActiveView("home");
    setSelectedDetent({ fraction: 0.45 });
  };

  return (
    <NativeSheet
      isPresented={true}
      onDismiss={onDismiss}
      detents={detents}
      selectedDetent={selectedDetent}
      onDetentChange={setSelectedDetent}
      backgroundInteraction="enabled"
      colorScheme="dark"
      rnContent
    >
      {activeView === "home" ? (
        <View style={styles.sheetContent}>
          {/* ─── Friends ─── */}
          <TouchableOpacity style={styles.sectionRow} onPress={() => goToList("friends")} activeOpacity={0.7}>
            <Text style={styles.sectionLabel}>Friends</Text>
            <Ionicons name="chevron-forward" size={26} color="rgba(255,255,255,0.6)" />
            {nearbyFriends.length > 0 && (
              <View style={styles.countPill}>
                <View style={[styles.countDot, { backgroundColor: '#34c759' }]} />
                <Text style={[styles.countText, { color: '#34c759' }]}>{nearbyFriends.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {nearbyFriends.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll} style={{ marginBottom: 20 }}>
              {nearbyFriends.map((friend) => (
                <TouchableOpacity key={friend.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onFriendPress(friend); }} activeOpacity={0.7} style={styles.friendItem}>
                  <Image source={friend.imageUrl ? { uri: friend.imageUrl } : DefaultAvatar} style={styles.friendAvatar} />
                  <View style={styles.friendOnline} />
                  <Text style={styles.friendName} numberOfLines={1}>{friend.name.split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyRow, { marginBottom: 20 }]}>
              <Text style={styles.emptyText}>{isSharing ? "No friends sharing" : "Share location to see friends"}</Text>
              {!isSharing && (
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSharePress(); }} activeOpacity={0.7} style={styles.shareBtn}>
                  <GlassView {...liquidGlass.fillMedium} borderRadius={8} style={StyleSheet.absoluteFill} isInteractive />
                  <Ionicons name="location" size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ─── Events ─── */}
          <TouchableOpacity style={styles.sectionRow} onPress={() => goToList("events")} activeOpacity={0.7}>
            <Text style={styles.sectionLabel}>Events</Text>
            <Ionicons name="chevron-forward" size={26} color="rgba(255,255,255,0.6)" />
            {liveCount > 0 && (
              <View style={styles.countPill}>
                <View style={[styles.countDot, { backgroundColor: '#ff3b30' }]} />
                <Text style={[styles.countText, { color: '#ff3b30' }]}>{liveCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {isLoading && events.length === 0 ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.35)" style={{ marginVertical: 12 }} />
          ) : events.length === 0 ? (
            <Text style={[styles.emptyText, { marginBottom: 12 }]}>No events nearby</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll} style={{ marginTop: 8 }}>
              {events.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => onEventPress(event)} activeOpacity={0.9}>
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.eventGradient} />
                  <View style={styles.eventContent}>
                    {event.isLive && (<View style={styles.eventLiveBadge}><View style={styles.eventLiveDot} /><Text style={styles.eventLiveText}>LIVE</Text></View>)}
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventVenue} numberOfLines={1}>{event.venue}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ) : activeView === "friends" ? (
        /* ─── Friends Full List ─── */
        <View style={styles.sheetContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Friends</Text>
            <TouchableOpacity onPress={goHome} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {nearbyFriends.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 40 }]}>{isSharing ? "No friends sharing" : "Share location to see friends"}</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {nearbyFriends.map((friend) => (
                <TouchableOpacity key={friend.id} style={styles.listRow} onPress={() => { goHome(); onFriendPress(friend); }} activeOpacity={0.7}>
                  <Image source={friend.imageUrl ? { uri: friend.imageUrl } : DefaultAvatar} style={styles.listImage} />
                  <Text style={styles.listName}>{friend.name}</Text>
                  <View style={styles.listOnlineDot} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        /* ─── Events Full List ─── */
        <View style={styles.sheetContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Events</Text>
            <TouchableOpacity onPress={goHome} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {events.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 40 }]}>No events nearby</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {events.map((event) => (
                <TouchableOpacity key={event.id} style={styles.listRow} onPress={() => onEventPress(event)} activeOpacity={0.7}>
                  <Image source={{ uri: event.imageUrl }} style={[styles.listImage, { borderRadius: 12 }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.listName} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.listSub} numberOfLines={1}>{event.venue}</Text>
                    <Text style={styles.listMeta}>{event.date} @ {event.time}</Text>
                  </View>
                  {event.isLive && (<View style={styles.eventLiveBadge}><View style={styles.eventLiveDot} /><Text style={styles.eventLiveText}>LIVE</Text></View>)}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Section rows
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  sectionLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },

  // Friends
  friendsScroll: {
    gap: 14,
    paddingBottom: 4,
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
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    textAlign: "center",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
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

  // Event cards (horizontal preview)
  eventsScroll: {
    gap: 12,
    paddingBottom: 4,
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

  // List views
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  listName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  listSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  listMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  listOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34c759",
  },

  // Legacy modals (unused)
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalClose: {
    position: "absolute",
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmpty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2c2c2e",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  listSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  listMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  listOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34c759",
  },
});
