import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import {
  FAN_FOLLOWING,
  FAN_PERKS,
  FAN_PROFILE,
} from '@/lib/data/mock-fan-data';

const ACCENT = '#FF6F3C';
const PURPLE = '#A855F7';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

type TabKey = 'about' | 'following' | 'activity' | 'perks';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'following', label: 'Following' },
  { key: 'activity', label: 'Activity' },
  { key: 'perks', label: 'Perks' },
];

const RECENT_ACTIVITY = [
  { id: 'a-1', icon: 'trophy' as const, text: 'Won pick · Syracuse vs Miami margin', points: '+300', time: '2h ago' },
  { id: 'a-2', icon: 'ticket' as const, text: 'Claimed KA7 hoodie (pre-release)', points: '-3,200', time: 'Yesterday' },
  { id: 'a-3', icon: 'heart' as const, text: 'Followed Donnie Freeman', points: '+10', time: 'Yesterday' },
  { id: 'a-4', icon: 'eye' as const, text: 'Watched Syracuse vs Duke (live)', points: '+150', time: '2 days ago' },
  { id: 'a-5', icon: 'trophy' as const, text: 'Won pick · Cooper Flagg ACC POW', points: '+250', time: '3 days ago' },
  { id: 'a-6', icon: 'chatbubble' as const, text: 'Dropped a top comment on Jordan Miles reel', points: '+25', time: '4 days ago' },
  { id: 'a-7', icon: 'flame' as const, text: '7-day streak · daily check-in bonus', points: '+100', time: '5 days ago' },
];

const FAVORITE_TEAMS = [
  { name: 'Syracuse Orange', league: 'NCAA · ACC', color: '#F76900' },
  { name: 'Brooklyn Nets', league: 'NBA · East', color: '#000000' },
  { name: 'Paul VI Panthers', league: 'HS · WCAC', color: '#003087' },
];

export default function FanProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['origin']));
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const claimedPerks = FAN_PERKS.filter((p) => p.claimed);

  return (
    <View style={styles.container}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bannerWrap, { height: insets.top + 180 }]} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.03)',
              'rgba(0,0,0,0.07)',
              'rgba(0,0,0,0.13)',
              'rgba(0,0,0,0.20)',
              'rgba(0,0,0,0.29)',
              'rgba(0,0,0,0.39)',
              'rgba(0,0,0,0.50)',
              'rgba(0,0,0,0.62)',
              'rgba(0,0,0,0.73)',
              'rgba(0,0,0,0.83)',
              'rgba(0,0,0,0.91)',
              'rgba(0,0,0,0.96)',
              'rgba(0,0,0,0.99)',
              '#000',
              '#000',
            ]}
            locations={[
              0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7,
              0.77, 0.83, 0.88, 0.92, 1,
            ]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {FAN_PROFILE.firstName[0]}
              {FAN_PROFILE.lastName[0]}
            </Text>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {FAN_PROFILE.firstName} {FAN_PROFILE.lastName}
              </Text>
              <View style={styles.tierChip}>
                <Ionicons name="diamond" size={9} color={PURPLE} />
                <Text style={styles.tierChipText}>{FAN_PROFILE.superfanTier}</Text>
              </View>
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {FAN_PROFILE.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {FAN_PROFILE.metaSecondary}
            </Text>
          </View>
        </View>

        <Text style={styles.tagline}>"{FAN_PROFILE.tagline}"</Text>

        <View style={styles.statRow}>
          {FAN_PROFILE.stats.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View>
          {tab === 'about' && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>Bio</Text>
              {FAN_PROFILE.bio.map((section) => {
                const isOpen = expanded.has(section.key);
                return (
                  <View key={section.key} style={styles.bioItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggle(section.key)}
                      style={styles.bioHeader}
                    >
                      <Text style={styles.bioTitle}>{section.title}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                    {isOpen && <Text style={styles.bioBody}>{section.body}</Text>}
                  </View>
                );
              })}

              <Text style={[styles.aboutLabel, { marginTop: 8 }]}>Favorite Teams</Text>
              <View style={styles.card}>
                {FAVORITE_TEAMS.map((t, i) => (
                  <View
                    key={t.name}
                    style={[
                      styles.teamRow,
                      i !== FAVORITE_TEAMS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.teamSwatch, { backgroundColor: t.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{t.name}</Text>
                      <Text style={styles.teamLeague}>{t.league}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'following' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>
                Following · {FAN_FOLLOWING.length}
              </Text>
              <View style={styles.card}>
                {FAN_FOLLOWING.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.followRow,
                      i !== FAN_FOLLOWING.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.followAvatar,
                        {
                          backgroundColor: `${a.avatarColor}20`,
                          borderColor: `${a.avatarColor}50`,
                        },
                      ]}
                    >
                      <Text style={[styles.followInitials, { color: a.avatarColor }]}>
                        {a.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.followName}>{a.name}</Text>
                      <Text style={styles.followSchool}>{a.school}</Text>
                      <Text
                        style={[
                          styles.followUpdate,
                          a.isLive && { color: '#FF4444', fontWeight: '700' },
                        ]}
                      >
                        {a.lastUpdate}
                      </Text>
                    </View>
                    {a.isLive && (
                      <View style={styles.liveSmallPill}>
                        <View style={styles.liveSmallDot} />
                        <Text style={styles.liveSmallText}>LIVE</Text>
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'activity' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Recent Activity</Text>
              <View style={styles.card}>
                {RECENT_ACTIVITY.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.activityRow,
                      i !== RECENT_ACTIVITY.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons name={a.icon} size={16} color={PURPLE} />
                    </View>
                    <Text style={styles.activityText}>{a.text}</Text>
                    <View style={styles.activityEnd}>
                      <Text
                        style={[
                          styles.activityPoints,
                          {
                            color: a.points.startsWith('+') ? '#34C759' : '#FF4444',
                          },
                        ]}
                      >
                        {a.points}
                      </Text>
                      <Text style={styles.activityTime}>{a.time}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'perks' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Claimed · {claimedPerks.length}</Text>
              <View style={styles.card}>
                {claimedPerks.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.claimedRow,
                      i !== claimedPerks.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.claimedIcon}>
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimedTitle}>{p.title}</Text>
                      <Text style={styles.claimedAthlete}>{p.athlete}</Text>
                    </View>
                    <Text style={styles.claimedCost}>{p.cost.toLocaleString()} pts</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.aboutLabel, { marginTop: 14 }]}>
                Available Balance
              </Text>
              <View style={styles.balanceCard}>
                <Ionicons name="diamond" size={24} color={PURPLE} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceValue}>
                    {FAN_PROFILE.superfanPoints.toLocaleString()} pts
                  </Text>
                  <Text style={styles.balanceMeta}>
                    +{FAN_PROFILE.pointsToNext} to reach {FAN_PROFILE.nextTier}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating bottom toolbar — settings | edit profile | create */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 80 }]}
        pointerEvents="none"
      />
      <View style={[styles.bottomToolbar, { bottom: TAB_BAR_TOP_FROM_BOTTOM + 10 }]}>
        <Pressable
          style={styles.toolbarCircle}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Switch role"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="menu" size={22} color="#FFF" />
        </Pressable>

        <Pressable
          style={[styles.toolbarPill, isEditing && styles.toolbarPillActive]}
          onPress={() => setIsEditing((v) => !v)}
          accessibilityLabel={isEditing ? 'Save profile changes' : 'Edit profile'}
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Text style={styles.toolbarPillText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
        </Pressable>

        <Pressable
          style={styles.toolbarCircle}
          onPress={() => {}}
          accessibilityLabel="Create"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          <Ionicons name="radio" size={22} color="#FF4444" />
        </Pressable>
      </View>
      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollDim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  topBarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarUsername: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -180,
    marginBottom: 5,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: 'rgba(168,85,247,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, color: PURPLE, fontWeight: '800' },
  rightCol: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
  },
  tierChipText: { color: PURPLE, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    lineHeight: 18,
  },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 16,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  statTile: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    letterSpacing: 0.5,
    marginTop: 3,
    fontWeight: '600',
  },

  tabsRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: ACCENT },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  tabLabelActive: { color: '#FFF', fontWeight: '700' },

  aboutSection: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  listSection: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  aboutLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: ACCENT,
    textTransform: 'uppercase',
  },

  bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioTitle: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  bioBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  teamSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  teamName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  teamLeague: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },

  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  followAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followInitials: { fontSize: 13, fontWeight: '800' },
  followName: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
  followSchool: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  followUpdate: { color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 4 },
  liveSmallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  liveSmallDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF4444' },
  liveSmallText: { color: '#FF4444', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: { flex: 1, color: '#FFF', fontSize: 13, lineHeight: 17 },
  activityEnd: { alignItems: 'flex-end' },
  activityPoints: { fontSize: 12, fontWeight: '800' },
  activityTime: { color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 2 },

  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  claimedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  claimedAthlete: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 2 },
  claimedCost: { color: PURPLE, fontSize: 12, fontWeight: '700' },

  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.35)',
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  balanceValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  balanceMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },

  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toolbarPillActive: {},
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
