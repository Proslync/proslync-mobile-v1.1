// ── ATHLETE · OPPORTUNITIES (DISCOVERY) ───────────────────
// Sprint 2.3 athlete-side OpenDeal discovery surface. Renders the
// matched OpenDeals from `mock-athlete-discovery.ts` for the demo
// athlete (`a-1` Kiyan Anthony) as cards. Tap → detail screen at
// `/athlete/opportunities/[id]`.
//
// Trust posture: every athlete-facing apply surface restates "AI rank +
// human approval gate" — matched != accepted. Banner sits above the
// list so it's always in view before a tap.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AthleteOpenDealCard } from '@/components/athlete/athlete-open-deal-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { EmptyState } from '@/components/shared/ui-kit';
import { getAthleteDiscovery } from '@/lib/data/mock-athlete-discovery';

const ACCENT = '#EB621A';
const VIOLET = '#C8A2FF';

// Sprint 2.3 demo athlete — matches `WHO_HAS_ACCESS_DEMO_ATHLETE_ID` in
// `components/athlete/athlete-view.tsx` and the discovery fixture in
// `lib/data/mock-athlete-discovery.ts`.
const DEMO_ATHLETE_ID = 'a-1';

export default function AthleteOpportunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const discovery = React.useMemo(() => getAthleteDiscovery(DEMO_ATHLETE_ID), []);

  const onOpen = React.useCallback(
    (id: string) => {
      router.push({ pathname: '/athlete/opportunities/[id]', params: { id } });
    },
    [router],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 44 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>OPPORTUNITIES</Text>
              <Text style={styles.title}>Open deals matched for you</Text>
            </View>
          </View>

          <View style={styles.gateBanner}>
            <View style={styles.gateIcon}>
              <Ionicons name="shield-half-outline" size={16} color={ACCENT} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.gateTitle}>AI rank + human approval gate</Text>
              <Text style={styles.gateBody}>
                Matches are advisory — applying does not guarantee a deal. Brands review every
                applicant manually after the AI ranking pass.
              </Text>
            </View>
          </View>

          {discovery.reason.length ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHead}>
                <Ionicons name="sparkles-outline" size={14} color={VIOLET} />
                <Text style={styles.summaryHeadText}>How you matched</Text>
              </View>
              {discovery.reason.map((line) => (
                <View key={line} style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>{line}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {discovery.matched.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No matches yet"
              body="Brand-side OpenDeals are scoped to the Sprint 2.3 demo athlete until backend persistence lands."
            />
          ) : (
            discovery.matched.map(({ record, reasons }) => (
              <AthleteOpenDealCard
                key={record.deal.id}
                record={record}
                primaryReason={reasons[0]}
                onPress={onOpen}
              />
            ))
          )}

          {__DEV__ ? (
            <View style={styles.footerNote}>
              <Ionicons name="flask-outline" size={11} color="rgba(255,255,255,0.55)" />
              <Text style={styles.footerNoteText}>
                Synthetic fixtures · dev preview only.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { gap: 14, paddingHorizontal: 16 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  eyebrow: {
    color: ACCENT,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 3,
  },
  gateBanner: {
    flexDirection: 'row',
    gap: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}12`,
    padding: 12,
  },
  gateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}22`,
  },
  gateTitle: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  gateBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  summaryCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  summaryHeadText: {
    color: VIOLET,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.42)',
    marginTop: 7,
  },
  summaryText: {
    flex: 1,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12.5,
    lineHeight: 17,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerNoteText: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontStyle: 'italic',
  },
});
