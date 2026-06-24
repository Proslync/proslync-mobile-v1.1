// Fan — Gameday. State-machine event hub remixing Wallet, LiveLocation, BarTab.
// File 01.6 spec: a fan's entire experience on one screen.

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassButton } from '@/components/glass/glass-button';
import {
  FAN_GAMES,
  FAN_FOLLOWING,
  FAN_PROFILE,
} from '@/lib/data/mock-fan-data';

const TEAL = '#14B8A6';
const ACCENT = '#EB621A';
const YELLOW = '#FFD60A';
const RED = '#FF453A';

type FriendInBuilding = {
  id: string;
  name: string;
  initials: string;
  color: string;
  section: string;
  distance: string;
};

const FRIENDS: FriendInBuilding[] = [
  { id: 'fr-1', name: 'Sara', initials: 'SK', color: '#A855F7', section: 'Sec 110', distance: '2 sections over' },
  { id: 'fr-2', name: 'Mike', initials: 'MJ', color: '#3B82F6', section: 'Sec 224', distance: 'across the dome' },
  { id: 'fr-3', name: 'Jaz', initials: 'JF', color: TEAL, section: 'Sec 108', distance: '1 section over' },
  { id: 'fr-4', name: 'Tomas', initials: 'TR', color: ACCENT, section: 'Sec 312', distance: 'upper deck' },
];

const TAB_ITEMS = [
  { id: 't-1', name: 'Bell\'s IPA', price: '$9.50', qty: 2 },
  { id: 't-2', name: 'Pretzel + cheese', price: '$8.00', qty: 1 },
  { id: 't-3', name: 'Tito\'s soda', price: '$11.00', qty: 1 },
];

export default function GamedayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const liveGame = FAN_GAMES.find((g) => g.status === 'live') ?? FAN_GAMES[0];
  const isLive = liveGame.status === 'live';
  const tabTotal = TAB_ITEMS.reduce(
    (acc, i) => acc + parseFloat(i.price.replace('$', '')) * i.qty,
    0,
  );

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gameday</Text>
          <Text style={styles.headerSub}>{liveGame.home} vs {liveGame.away} · {liveGame.venue}</Text>
        </View>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero ticket */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketTitle}>YOUR SEAT</Text>
            <View style={styles.ticketScoreRow}>
              <Text style={styles.ticketScore}>
                {liveGame.homeScore ?? '—'}
                <Text style={styles.ticketScoreSep}> – </Text>
                {liveGame.awayScore ?? '—'}
              </Text>
              {liveGame.quarter && (
                <Text style={styles.ticketClock}>
                  {liveGame.quarter} · {liveGame.clock}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.qrRow}>
            <View style={styles.qrBox}>
              <MaterialCommunityIcons name="qrcode" size={64} color="#000" />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <View>
                <Text style={styles.seatLabel}>SECTION</Text>
                <Text style={styles.seatValue}>108</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View>
                  <Text style={styles.seatLabel}>ROW</Text>
                  <Text style={styles.seatValueSm}>F</Text>
                </View>
                <View>
                  <Text style={styles.seatLabel}>SEAT</Text>
                  <Text style={styles.seatValueSm}>14</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.ticketActions}>
            <GlassButton
              label="Walk me to my seat"
              icon="navigate-outline"
              onPress={() =>
                Alert.alert(
                  'Walking you to Section 108',
                  'Head to Gate C, take the escalator up one level, then turn left. Row F, Seat 14 — about a 3 minute walk.',
                )
              }
              fullWidth
            />
          </View>
        </Animated.View>

        {/* Friends in the building */}
        <Text style={styles.sectionLabel}>FRIENDS IN THE BUILDING · {FRIENDS.length}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>
          {FRIENDS.map((f) => (
            <View key={f.id} style={styles.friendCard}>
              <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
                <Text style={styles.friendInitials}>{f.initials}</Text>
              </View>
              <Text style={styles.friendName}>{f.name}</Text>
              <Text style={styles.friendSection}>{f.section}</Text>
              <Text style={styles.friendDistance}>{f.distance}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Concessions tab */}
        <Text style={styles.sectionLabel}>YOUR TAB</Text>
        <View style={styles.tabCard}>
          <View style={styles.tabHeadRow}>
            <View>
              <Text style={styles.tabLabel}>OPEN TAB</Text>
              <Text style={styles.tabTotal}>${tabTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{TAB_ITEMS.reduce((a, i) => a + i.qty, 0)} ITEMS</Text>
            </View>
          </View>
          {TAB_ITEMS.slice(0, 3).map((i, idx) => (
            <View key={i.id} style={[styles.tabItem, idx < TAB_ITEMS.length - 1 && styles.tabItemBorder]}>
              <Text style={styles.tabItemName}>{i.name}{i.qty > 1 && ` × ${i.qty}`}</Text>
              <Text style={styles.tabItemPrice}>{i.price}</Text>
            </View>
          ))}
          <View style={styles.tabActions}>
            <View style={{ flex: 1 }}>
              <GlassButton
                label="Order another"
                onPress={() =>
                  Alert.alert(
                    'Order placed',
                    "We'll bring your next round to Section 108, Row F, Seat 14. Added to your open tab.",
                  )
                }
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <GlassButton
                label="Close tab"
                onPress={() =>
                  Alert.alert(
                    'Close your tab?',
                    `Your total is $${tabTotal.toFixed(2)}.`,
                    [
                      { text: 'Keep open', style: 'cancel' },
                      {
                        text: 'Close & pay',
                        onPress: () =>
                          Alert.alert('Tab closed', `$${tabTotal.toFixed(2)} charged. Receipt sent to your email.`),
                      },
                    ],
                  )
                }
                fullWidth
              />
            </View>
          </View>
        </View>

        {/* Watch */}
        <Text style={styles.sectionLabel}>WATCH</Text>
        <TouchableOpacity
          style={styles.watchCard}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('Replay last play', `Kiyan Anthony · 3-pointer · ${liveGame.quarter} · ${liveGame.clock}. Starting playback…`)
          }
          accessibilityRole="button"
          accessibilityLabel="Replay last play"
        >
          <View style={styles.watchPoster}>
            <View style={styles.watchPlay}>
              <Ionicons name="play" size={22} color="#000" />
            </View>
            <Text style={styles.watchPosterText}>Live · {liveGame.watchedBy.toLocaleString()} watching</Text>
          </View>
          <View style={styles.watchMeta}>
            <Text style={styles.watchTitle}>Replay last play</Text>
            <Text style={styles.watchSub}>Kiyan Anthony · 3-pointer · {liveGame.quarter} · {liveGame.clock}</Text>
          </View>
        </TouchableOpacity>

        {/* After-game offers */}
        <Text style={styles.sectionLabel}>AFTER THE GAME</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.offersRow}>
          {[
            { id: 'o-1', title: '20% off late-night menu', vendor: 'Faegan\'s · 0.4mi' },
            { id: 'o-2', title: 'Free dessert with QR', vendor: 'Pastabilities · 0.6mi' },
            { id: 'o-3', title: 'Half-off rides home', vendor: 'Lyft' },
          ].map((o) => (
            <TouchableOpacity
              key={o.id}
              style={styles.offerCard}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(o.title, `${o.vendor}\n\nShow this code at checkout: GAMEDAY-${o.id.toUpperCase()}`)
              }
              accessibilityRole="button"
              accessibilityLabel={`Redeem offer: ${o.title} at ${o.vendor}`}
            >
              <Text style={styles.offerTitle}>{o.title}</Text>
              <Text style={styles.offerVendor}>{o.vendor}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <GlassButton
            label="Get me home"
            icon="car-outline"
            onPress={() =>
              Alert.alert(
                'Get me home',
                'Half-off rides are live from the dome tonight.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Request a ride',
                    onPress: () =>
                      Alert.alert('Finding your ride', "Matching you with a driver — they'll meet you at the Gate C pickup."),
                  },
                ],
              )
            }
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,69,58,0.16)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,69,58,0.5)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: RED },
  liveText: { fontSize: 9, fontWeight: '900', color: RED, letterSpacing: 0.6 },

  content: { paddingTop: 8 },

  ticketCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  ticketTitle: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  ticketScoreRow: { alignItems: 'flex-end' },
  ticketScore: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  ticketScoreSep: { color: 'rgba(255,255,255,0.4)' },
  ticketClock: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
  qrBox: {
    width: 88, height: 88, borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  seatLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8 },
  seatValue: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  seatValueSm: { fontSize: 18, fontWeight: '900', color: '#FFF' },

  ticketActions: { gap: 8, marginTop: 4 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },

  friendsRow: { paddingHorizontal: 16, gap: 10 },
  friendCard: {
    width: 88, alignItems: 'center', gap: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
  },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  friendInitials: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  friendName: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  friendSection: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  friendDistance: { fontSize: 9, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

  tabCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  tabHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  tabLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  tabTotal: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  tabBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 0.6 },
  tabItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  tabItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tabItemName: { fontSize: 13, color: '#FFF' },
  tabItemPrice: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  tabActions: { flexDirection: 'row', gap: 8, marginTop: 12 },

  watchCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
  },
  watchPoster: {
    height: 140,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  watchPlay: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  watchPosterText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  watchMeta: { padding: 14 },
  watchTitle: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  watchSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  offersRow: { paddingHorizontal: 16, gap: 10 },
  offerCard: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  offerTitle: { fontSize: 13, color: '#FFF', fontWeight: '700' },
  offerVendor: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
});
