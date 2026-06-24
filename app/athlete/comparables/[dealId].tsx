// ── ATHLETE COMPARABLES SCREEN ───────────────────────────
// Full-screen athlete-facing render of the comparable-deal evidence
// packet for one of the athlete's own deals. The brand lens for the
// same primitive lives inline in `components/deal/deal-detail-spine.tsx`
// — this route is the Sprint 2.9 athlete-side analogue per PLAN §2.9
// and PLAN §5 P1 ("evidence packets are P0 when attached to a decision
// object").
//
// Deep-link target: `status://athlete/comparables/<dealId>?role=player`.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AthleteComparablesCard } from '@/components/athlete/athlete-comparables-card';
import { GlassButton } from '@/components/glass/glass-button';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useDealComparables } from '@/hooks/use-deal-comparables';
import { getBrandDealDetail } from '@/lib/data/mock-brand-data';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AthleteComparablesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId?: string; brand?: string; amount?: string }>();
  const dealId = normalizeParam(params.dealId);
  const brandParam = normalizeParam(params.brand);
  const amountParam = normalizeParam(params.amount);
  const { data: evidence, isLoading, isError, refetch, isRefetching } =
    useDealComparables(dealId);
  const detail = dealId ? getBrandDealDetail(dealId) : undefined;
  const insets = useSafeAreaInsets();

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/athlete');
    }
  }, [router]);

  const hasComps = Boolean(evidence && evidence.rows.length > 0);

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
              <Text style={styles.kicker}>Evidence packet</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {detail
                  ? `${detail.companyOverview.name} x ${detail.deal.athlete.split(' · ')[0]}`
                  : brandParam
                    ? amountParam
                      ? `${brandParam} · ${amountParam}`
                      : brandParam
                    : 'Comparable offers'}
              </Text>
            </View>
          </View>

          {isError && !hasComps ? (
            <ComparablesErrorState
              isRefetching={isRefetching}
              onRetry={() => refetch()}
            />
          ) : !hasComps ? (
            <ComparablesEmptyState isLoading={isLoading} />
          ) : (
            <AthleteComparablesCard evidence={evidence!} />
          )}
        </ScrollView>
      </View>
    </>
  );
}

// Inline empty state — the shared `EmptyState` primitive lives in the
// ui-kit but the brief flagged it may not exist by commit time on every
// branch, so we define a lightweight inline version here to be safe.
function ComparablesEmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <View style={styles.emptyBox}>
      <Ionicons
        name={isLoading ? 'hourglass-outline' : 'analytics-outline'}
        size={28}
        color="rgba(255,255,255,0.62)"
      />
      <Text style={styles.emptyTitle}>
        {isLoading ? 'Pulling comparable offers' : 'No comparables yet'}
      </Text>
      <Text style={styles.emptyBody}>
        {isLoading
          ? 'One moment — we are gathering reviewer-tagged comparable offers for this deal.'
          : 'We have not surfaced reviewer-tagged comparable offers for this deal yet. Check back once your NIL manager runs the evidence pass.'}
      </Text>
    </View>
  );
}

// Network-failure state — distinct from "no comparables yet" so a failed
// fetch is never misread as an empty evidence packet. Matches the athlete
// deals/wallet peer pattern (cloud-offline + GlassButton retry).
function ComparablesErrorState({
  isRefetching,
  onRetry,
}: {
  isRefetching: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.emptyBox}>
      <Ionicons
        name="cloud-offline-outline"
        size={28}
        color="rgba(255,255,255,0.62)"
      />
      <Text style={styles.emptyTitle}>Comparables unavailable</Text>
      <Text style={styles.emptyBody}>
        Couldn&apos;t load comparable offers. Pull to retry, or tap below.
      </Text>
      <GlassButton
        label={isRefetching ? 'Retrying…' : 'Retry'}
        icon={<Ionicons name="refresh" size={15} color="#FFF" />}
        variant="glass"
        size="sm"
        onPress={onRetry}
      />
    </View>
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
    alignItems: 'center',
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
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    maxWidth: 300,
    textAlign: 'center',
  },
});
