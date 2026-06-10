// ── ATHLETE HOME ──────────────────────────────────────────
// R5 remix: Personal/Professional mode-switch absorbed. This Home surface
// hosts three top tabs — Overview, Schedule, Wallet. Overview retains the
// header + 4-KPI strip + AthleteHeroCard + AthleteSocialReachCard + the
// "GAMES THIS WEEK" + "UPCOMING" rails. Schedule / Wallet defer to the
// shared section components introduced for the remix.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AthleteHeroCard } from '@/components/athlete/athlete-hero-card';
import { AthleteScheduleSection } from '@/components/athlete/athlete-schedule-section';
import { AthleteSocialReachCard } from '@/components/athlete/athlete-social-reach-card';
import { AthleteWalletSection } from '@/components/athlete/athlete-wallet-section';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { Brand } from '@/constants/brand';
import { BaseColors } from '@/constants/colors';

type VenueCard = {
  label: string;
  when: string;
  venue: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const VENUES: VenueCard[] = [
  { label: 'SU vs Duke', when: 'Wed 7p', venue: 'JMA Wireless Dome', icon: 'basketball-outline' },
  { label: 'SU @ UVA', when: 'Sat 1p', venue: 'John Paul Jones Arena', icon: 'basketball-outline' },
];

type UpcomingRow = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  when: string;
};

const UPCOMING: UpcomingRow[] = [
  { icon: 'cash-outline', title: 'Payout window opens', when: 'Thu' },
  { icon: 'document-attach-outline', title: 'Disclosure renewal', when: 'Fri' },
  { icon: 'airplane-outline', title: 'Travel brief', when: 'Sat 11a' },
];

const PURPLE = '#C8A2FF';

const HOME_TABS = ['overview', 'schedule', 'wallet'] as const;
type HomeTab = (typeof HOME_TABS)[number];
const HOME_TAB_LABELS: Record<HomeTab, string> = {
  overview: 'Overview',
  schedule: 'Schedule',
  wallet: 'Wallet',
};

export function AthleteHome() {
  const insets = useSafeAreaInsets();
  const [activeHomeTab, setActiveHomeTab] = React.useState<HomeTab>('overview');

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>ATHLETE</Text>
            <Text style={styles.title}>Today&apos;s deck</Text>
            <Text style={styles.subtitle}>
              Live deals, eligibility, reach, and schedule.
            </Text>
          </View>
          <Text style={styles.lastUpdated}>Updated 3m ago</Text>
        </View>

        <View style={styles.tabStrip} accessibilityRole="tablist">
          {HOME_TABS.map((tab) => {
            const isActive = activeHomeTab === tab;
            return (
              <Pressable
                key={tab}
                style={styles.tabSegment}
                onPress={() => setActiveHomeTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${HOME_TAB_LABELS[tab]} tab`}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {HOME_TAB_LABELS[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeHomeTab === 'overview' && (
          <View style={styles.tabBody}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiTile}>
                <Text numberOfLines={1} style={[styles.kpiValue, { color: Brand.copperScale[400] }]}>3</Text>
                <Text style={styles.kpiLabel}>DEALS</Text>
              </View>
              <View style={styles.kpiTile}>
                <Text numberOfLines={1} style={[styles.kpiValue, { color: '#FFFFFF' }]}>4.5K</Text>
                <Text style={styles.kpiLabel}>WALLET</Text>
              </View>
              <View style={styles.kpiTile}>
                <Text numberOfLines={1} style={[styles.kpiValue, { color: BaseColors.success }]}>+18%</Text>
                <Text style={styles.kpiLabel}>REACH</Text>
              </View>
              <View style={styles.kpiTile}>
                <Text numberOfLines={1} style={[styles.kpiValue, { color: PURPLE }]}>Sat</Text>
                <Text style={styles.kpiLabel}>NEXT</Text>
              </View>
            </View>

            <View style={styles.heroBlock}>
              <AthleteHeroCard />
              <AthleteSocialReachCard athleteId="a-1" />
            </View>

            <View style={styles.venuesBlock}>
              <Text style={styles.sectionTitle}>GAMES THIS WEEK</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.venueScroll}
              >
                {VENUES.map((v) => (
                  <View key={v.label} style={styles.venueCard}>
                    <View style={styles.venueTop}>
                      <Ionicons name={v.icon} size={22} color={PURPLE} />
                    </View>
                    <View style={styles.venueBottom}>
                      <Text style={styles.venueLabel}>{v.label}</Text>
                      <Text style={styles.venueMeta}>{v.when}</Text>
                      <Text style={styles.venueName}>{v.venue}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.upcomingBlock}>
              <Text style={styles.sectionTitle}>UPCOMING</Text>
              <View style={styles.upcomingList}>
                {UPCOMING.map((row) => (
                  <View key={row.title} style={styles.upcomingRow}>
                    <View style={styles.upcomingIcon}>
                      <Ionicons name={row.icon} size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.upcomingTitle}>{row.title}</Text>
                    <Text style={styles.upcomingWhen}>{row.when}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeHomeTab === 'schedule' && (
          <View style={styles.tabBody}>
            <AthleteScheduleSection />
          </View>
        )}

        {activeHomeTab === 'wallet' && (
          <View style={styles.tabBody}>
            <AthleteWalletSection />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { gap: 14, paddingHorizontal: 16 },
  flex: { flex: 1 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.60)', fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.4, lineHeight: 32, marginTop: 4 },
  subtitle: { color: 'rgba(255,255,255,0.60)', fontSize: 13.5, fontWeight: '500', lineHeight: 19, marginTop: 6, maxWidth: 320 },
  lastUpdated: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  tabStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    marginTop: 18,
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#EB621A',
    fontWeight: '900',
  },
  tabBody: { gap: 14, marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiTile: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 10, padding: 10, gap: 4 },
  kpiValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  kpiLabel: { color: 'rgba(255,255,255,0.46)', fontSize: 10, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 2 },
  heroBlock: { gap: 14, marginTop: 4 },
  sectionTitle: { color: 'rgba(255,255,255,0.50)', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  venuesBlock: { gap: 10, marginTop: 22 },
  venueScroll: { gap: 10, paddingHorizontal: 0 },
  venueCard: { width: 220, height: 124, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.055)', overflow: 'hidden' },
  venueTop: { height: 50, alignItems: 'center', justifyContent: 'center' },
  venueBottom: { paddingHorizontal: 10, paddingVertical: 8 },
  venueLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },
  venueMeta: { color: 'rgba(255,255,255,0.58)', fontSize: 10.5, fontWeight: '700' },
  venueName: { color: 'rgba(255,255,255,0.46)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  upcomingBlock: { gap: 10, marginTop: 22 },
  upcomingList: { gap: 8 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)' },
  upcomingIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(242,201,76,0.14)' },
  upcomingTitle: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  upcomingWhen: { color: 'rgba(255,255,255,0.50)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
});
