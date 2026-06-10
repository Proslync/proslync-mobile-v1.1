import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedNavBar } from '@/components/feed/feed-nav-bar';
import { useStableRouter } from '@/hooks/use-stable-router';
import { BRAND_CAMPAIGNS, BRAND_DEALS } from '@/lib/data/mock-brand-data';
import { getHeadshotUrl } from '@/lib/data/photo-urls';

const ACCENT = '#EB621A';
const SYRACUSE_ORANGE = '#F76900';

type TabKey = 'about' | 'deals' | 'evidence';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'deals', label: 'Deals' },
  { key: 'evidence', label: 'Evidence' },
];

const ATHLETE = {
  name: 'Kiyan Anthony',
  handle: '@kiyananthony',
  metaPrimary: 'Syracuse · Freshman guard',
  metaSecondary: 'Nike Hoops signed athlete · NYC / Syracuse market',
  headshotUrl: getHeadshotUrl('Kiyan Anthony'),
  banner: require('@/assets/images/kiyan-banner.png'),
  profileFallback: require('@/assets/images/kiyan-avatar.png'),
  about: [
    {
      key: 'season',
      title: 'Current lane',
      body: 'Freshman guard profile anchored to Syracuse, Nike Hoops, and reported public NIL references instead of generic social-feed filler.',
    },
    {
      key: 'market',
      title: 'Market fit',
      body: 'NYC legacy audience, Syracuse ACC visibility, and sneaker-culture content make this the main athlete-side demo profile for the current AD / brand walk.',
    },
    {
      key: 'compliance',
      title: 'Disclosure posture',
      body: 'Nike master agreement and add-on audio category review are represented in the compliance queue with source and reviewer caveats.',
    },
  ],
  stats: [
    { label: 'Reported reach', value: '1.2M' },
    { label: 'Signed value', value: '$660K' },
    { label: 'Open review', value: '1' },
  ],
};

const ATHLETE_DEALS = BRAND_DEALS.filter((deal) =>
  deal.athlete.toLowerCase().includes('kiyan'),
);

const ATHLETE_CAMPAIGNS = BRAND_CAMPAIGNS.filter((campaign) =>
  campaign.athlete.toLowerCase().includes('kiyan'),
);

const EVIDENCE_ROWS = [
  {
    id: 'source-photo',
    label: 'Headshot provenance',
    detail: 'Loaded through lib/data/photo-sources.json with source-page metadata.',
    icon: 'image-outline' as const,
  },
  {
    id: 'source-deals',
    label: 'Deal packet',
    detail: 'Nike master agreement and Beats add-on are represented in disclosure and approval fixtures.',
    icon: 'document-text-outline' as const,
  },
  {
    id: 'source-school',
    label: 'School context',
    detail: 'Syracuse school and conference context comes from the trimmed visual/data registries.',
    icon: 'school-outline' as const,
  },
];

export default function AthleteProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['season']));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.bannerWrap, { height: insets.top + 184 }]}>
          <Image source={ATHLETE.banner} style={styles.bannerImage} resizeMode="cover" />
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.08)',
              'rgba(0,0,0,0.18)',
              'rgba(0,0,0,0.62)',
              '#000',
            ]}
            locations={[0, 0.42, 0.78, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarShell}>
            <Image
              source={ATHLETE.headshotUrl ? { uri: ATHLETE.headshotUrl } : ATHLETE.profileFallback}
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.rightCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{ATHLETE.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={15} color={SYRACUSE_ORANGE} />
            </View>
            <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
              {ATHLETE.metaPrimary}
            </Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {ATHLETE.metaSecondary}
            </Text>
          </View>
        </View>

        <Text style={styles.handle}>{ATHLETE.handle}</Text>

        <View style={styles.statRow}>
          {ATHLETE.stats.map((stat) => (
            <View key={stat.label} style={styles.statTile}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.section}>
              {ATHLETE.about.map((section) => {
                const open = expanded.has(section.key);
                return (
                  <View key={section.key} style={styles.bioItem}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggle(section.key)}
                      style={styles.bioHeader}
                    >
                      <Text style={styles.bioTitle}>{section.title}</Text>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                    {open && <Text style={styles.bioBody}>{section.body}</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'deals' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Nike / PARTNER PIPELINE</Text>
              <View style={styles.card}>
                {ATHLETE_DEALS.map((deal, index) => (
                  <Animated.View
                    key={deal.id}
                    entering={FadeInDown.delay(index * 50).duration(360)}
                    style={[
                      styles.dealRow,
                      index !== ATHLETE_DEALS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.brandDot, { backgroundColor: deal.stage === 'signed' ? ACCENT : 'rgba(255,255,255,0.14)' }]}>
                      <Text style={styles.brandDotText}>{deal.stage.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{deal.value} · {deal.term}</Text>
                      <Text style={styles.rowMeta}>{deal.lastTouched}</Text>
                    </View>
                    <Text style={styles.stagePill}>{deal.stage}</Text>
                  </Animated.View>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>CAMPAIGN CONTEXT</Text>
              <View style={styles.card}>
                {ATHLETE_CAMPAIGNS.map((campaign, index) => (
                  <View
                    key={campaign.id}
                    style={[
                      styles.campaignRow,
                      index !== ATHLETE_CAMPAIGNS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{campaign.name}</Text>
                      <Text style={styles.rowMeta}>
                        {campaign.reach} reach · {campaign.engagement} engagement
                      </Text>
                    </View>
                    <Text style={styles.rowValue}>{campaign.budget}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'evidence' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SOURCE LAYER</Text>
              <View style={styles.card}>
                {EVIDENCE_ROWS.map((row, index) => (
                  <View
                    key={row.id}
                    style={[
                      styles.evidenceRow,
                      index !== EVIDENCE_ROWS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.evidenceIcon}>
                      <Ionicons name={row.icon} size={18} color={SYRACUSE_ORANGE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{row.label}</Text>
                      <Text style={styles.rowMeta}>{row.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <FeedNavBar
        variant="slots"
        slots={{
          left: {
            variant: 'circle',
            icon: 'settings-outline',
            onPress: () => router.push('/settings' as any),
            accessibilityLabel: 'Settings',
          },
          center: {
            variant: 'pill',
            label: 'Edit profile',
            onPress: () => router.push('/edit-profile' as any),
            accessibilityLabel: 'Edit profile',
          },
          right: {
            variant: 'circle',
            icon: 'document-text',
            iconColor: SYRACUSE_ORANGE,
            onPress: () => router.push('/athlete/disclosures' as any),
            accessibilityLabel: 'Open disclosures',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -72,
  },
  avatarShell: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#171717',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  rightCol: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 19, fontWeight: '800', color: '#FFF' },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    lineHeight: 18,
  },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },
  handle: {
    paddingHorizontal: 16,
    marginTop: 2,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statTile: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(247,105,0,0.18)',
    borderColor: 'rgba(247,105,0,0.42)',
  },
  tabLabel: { color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#FFF' },
  tabContent: { paddingTop: 16 },
  section: { paddingHorizontal: 16, gap: 12 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '800',
  },
  bioItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
  },
  bioHeader: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  bioBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  evidenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,105,0,0.12)',
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 3,
  },
  rowValue: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  stagePill: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    textTransform: 'capitalize',
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.10)' },
});
