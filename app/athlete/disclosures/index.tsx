// ── ATHLETE DISCLOSURES LIST (Sprint 3.4) ────────────────
// Lists every NIL Go-shaped `ComplianceDisclosure` tied to the viewing
// athlete. The viewer is hard-coded to `BRAND_PROFILE`-side fixture
// `a-1` (Kiyan Anthony) for the demo because that's the only athlete
// with multiple disclosures across review states; once a real session
// athlete id flows in, swap the constant for that value.
//
// Deep-link target: `status://athlete/disclosures`.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  CARD_BG,
  CARD_BORDER,
  EmptyState,
  RADIUS_MD,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useAthleteDisclosures } from '@/hooks/use-disclosures';
import type {
  ComplianceDisclosure,
  DisclosureReviewState,
} from '@/lib/types/compliance-disclosure.types';

// Demo athlete id. The athlete-view + this screen both treat `a-1`
// (Kiyan Anthony) as the "viewing self" stand-in for Sprint 3.4 —
// matches the comparable-offers CTA precedent.
const DEMO_ATHLETE_ID = 'a-1';

const REVIEW_TONE: Record<DisclosureReviewState, Tone> = {
  draft: 'muted',
  submitted: 'info',
  'school-review': 'info',
  approved: 'success',
  flagged: 'danger',
  amended: 'warning',
};

const REVIEW_LABEL: Record<DisclosureReviewState, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  'school-review': 'School review',
  approved: 'Approved',
  flagged: 'Flagged',
  amended: 'Amended',
};

export default function AthleteDisclosuresListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useAthleteDisclosures(DEMO_ATHLETE_ID);

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/athlete');
    }
  }, [router]);

  const disclosures = data ?? [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.kicker}>My disclosures</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                NIL Go-style reviewer packets
              </Text>
              <Text style={styles.headerSub} numberOfLines={3}>
                Proslync is not an official CSC submitter — these packets are the school&apos;s
                reviewer record.
              </Text>
            </View>
          </View>

          {disclosures.length === 0 ? (
            <EmptyState
              icon={isLoading ? 'hourglass-outline' : 'document-text-outline'}
              title={isLoading ? 'Loading disclosures' : 'No disclosures yet'}
              body={
                isLoading
                  ? 'One moment — pulling your NIL disclosure packets.'
                  : 'When you report a deal, the packet will appear here for the school to review.'
              }
            />
          ) : (
            <View style={styles.list}>
              {disclosures.map((d) => (
                <DisclosureRow
                  key={d.id}
                  disclosure={d}
                  onPress={() =>
                    router.push({
                      pathname: '/athlete/disclosures/[id]',
                      params: { id: d.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

function DisclosureRow({
  disclosure,
  onPress,
}: {
  disclosure: ComplianceDisclosure;
  onPress: () => void;
}) {
  const total = disclosure.compensation.totalCents.cents;
  const dollars = `$${(total / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open disclosure with ${disclosure.counterparties.brand.name}`}
    >
      <View style={styles.rowHead}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {disclosure.counterparties.brand.name}
        </Text>
        <StatusPill
          tone={REVIEW_TONE[disclosure.reviewState]}
          label={REVIEW_LABEL[disclosure.reviewState]}
        />
      </View>
      <Text style={styles.rowSub} numberOfLines={1}>
        {disclosure.counterparties.athlete.name} · {disclosure.counterparties.brand.category}
      </Text>
      <View style={styles.rowFooter}>
        <Text style={styles.rowAmount}>{dollars}</Text>
        <View style={styles.rowChev}>
          <Text style={styles.rowCta}>Open packet</Text>
          <Ionicons name="chevron-forward" size={12} color={TONE_COLOR.accent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    gap: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
    marginTop: 2,
  },
  kicker: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 2,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 6,
  },
  list: {
    gap: 10,
  },
  row: {
    gap: 6,
    padding: 14,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
    flex: 1,
  },
  rowSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rowAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  rowChev: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rowCta: {
    color: TONE_COLOR.accent,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
