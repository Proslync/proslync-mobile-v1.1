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
  BRAND_ATHLETES,
  BRAND_CAMPAIGNS,
  BRAND_PROFILE,
} from '@/lib/data/mock-brand-data';

const ACCENT = '#FF6F3C';
const TEAL = '#00C6B0';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

type TabKey = 'about' | 'roster' | 'campaigns' | 'team';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'roster', label: 'Roster' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'team', label: 'Team' },
];

const BRAND_TEAM = [
  { name: 'Tosan Evbuomwan', role: 'VP · NIL & Grassroots', initials: 'TE' },
  { name: 'Maya Lindgren', role: 'Sr. Manager · Athlete Partnerships', initials: 'ML' },
  { name: 'Darnell Price', role: 'Manager · Creative & Content', initials: 'DP' },
  { name: 'Priya Raman', role: 'Analyst · NIL Insights', initials: 'PR' },
  { name: 'Greg Sato', role: 'Counsel · Reed Smith (outside)', initials: 'GS' },
  { name: 'Nia Castillo', role: 'Coordinator · Athlete Ops', initials: 'NC' },
];

export default function BrandProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['mission']));
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

  const signed = BRAND_ATHLETES.filter((a) => a.signed);
  const live = BRAND_CAMPAIGNS.filter((c) => c.status === 'live');
  const upcoming = BRAND_CAMPAIGNS.filter((c) => c.status === 'upcoming');

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
            <Text style={styles.avatarText}>P</Text>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{BRAND_PROFILE.name}</Text>
              <Ionicons name="shield-checkmark" size={15} color={TEAL} />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {BRAND_PROFILE.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {BRAND_PROFILE.metaSecondary}
            </Text>
          </View>
        </View>

        <Text style={styles.tagline}>{BRAND_PROFILE.tagline}</Text>

        <View style={styles.statRow}>
          {BRAND_PROFILE.stats.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>New Campaign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
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
              <Text style={styles.aboutLabel}>About</Text>
              {BRAND_PROFILE.bio.map((section) => {
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
            </View>
          )}

          {tab === 'roster' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Signed Athletes · {signed.length}</Text>
              <View style={styles.card}>
                {signed.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.rosterRow,
                      i !== signed.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>{a.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rosterName}>{a.name}</Text>
                      <Text style={styles.rosterMeta}>
                        {a.school} · {a.position}
                      </Text>
                      {a.contract && (
                        <Text style={styles.rosterContract}>{a.contract}</Text>
                      )}
                    </View>
                    <View style={styles.ridgePill}>
                      <Text style={styles.ridgePillText}>{a.rank}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'campaigns' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Live · {live.length}</Text>
              <View style={styles.card}>
                {live.map((c, i) => (
                  <View
                    key={c.id}
                    style={[
                      styles.campaignRow,
                      i !== live.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.campaignDot, { backgroundColor: TEAL }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campaignName}>{c.name}</Text>
                      <Text style={styles.campaignMeta}>{c.athlete} · {c.reach} reach</Text>
                    </View>
                    <Text style={styles.campaignBudget}>{c.budget}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.aboutLabel, { marginTop: 14 }]}>
                Upcoming · {upcoming.length}
              </Text>
              <View style={styles.card}>
                {upcoming.map((c, i) => (
                  <View
                    key={c.id}
                    style={[
                      styles.campaignRow,
                      i !== upcoming.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.campaignDot, { backgroundColor: ACCENT }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campaignName}>{c.name}</Text>
                      <Text style={styles.campaignMeta}>{c.athlete} · {c.startDate}</Text>
                    </View>
                    <Text style={styles.campaignBudget}>{c.budget}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'team' && (
            <View style={styles.listSection}>
              <Text style={styles.aboutLabel}>Brand Team</Text>
              <View style={styles.card}>
                {BRAND_TEAM.map((m, i) => (
                  <Animated.View
                    key={m.name}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.teamRow,
                      i !== BRAND_TEAM.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.teamAvatar}>
                      <Text style={styles.teamInitial}>{m.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{m.name}</Text>
                      <Text style={styles.teamRole}>{m.role}</Text>
                    </View>
                  </Animated.View>
                ))}
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
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: 'rgba(0,198,176,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, color: TEAL, fontWeight: '900' },
  rightCol: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF' },
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

  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.4)',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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

  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,198,176,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,198,176,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: { color: TEAL, fontSize: 12, fontWeight: '800' },
  rosterName: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
  rosterMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  rosterContract: { color: TEAL, fontSize: 11, marginTop: 3, fontWeight: '600' },
  ridgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ridgePillText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  campaignDot: { width: 8, height: 8, borderRadius: 4 },
  campaignName: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
  campaignMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  campaignBudget: { color: ACCENT, fontSize: 13, fontWeight: '800' },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  teamName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  teamRole: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },

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
