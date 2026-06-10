// ── BRAND · ATHLETE CONTRACT DRILL-DOWN ───────────────────
// Sprint 2.5 · W33 — full-screen surface for one brand-athlete
// contract pair. Routed from the Brand HQ → Athletes roster.
//
// URL: /brand/athlete/<athleteId>
//
// Anchors:
//   - PLAN.md §2.5 (Brand roster contract drill-down per W33)
//   - components/brand/brand-roster-contract-card.tsx

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandRosterContractCard } from '@/components/brand/brand-roster-contract-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useBrandAthleteContract } from '@/hooks/use-brand-contracts';
import { BRAND_ATHLETES } from '@/lib/data/mock-brand-data';

const ACCENT = '#EB621A';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function BrandAthleteContractScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; brandId?: string }>();
  const athleteId = normalizeParam(params.id);
  const brandId = normalizeParam(params.brandId);

  const athlete = React.useMemo(
    () => (athleteId ? BRAND_ATHLETES.find((a) => a.id === athleteId) : undefined),
    [athleteId],
  );

  const { data: contract, isLoading } = useBrandAthleteContract(athleteId, brandId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        {isLoading && !contract ? (
          <LoadingState />
        ) : contract && athlete ? (
          <ContractDetail
            athleteName={athlete.name}
            athleteSubtext={`${athlete.school} · ${athlete.position}`}
            contract={contract}
            onBack={() => router.back()}
          />
        ) : (
          <NotFound athleteId={athleteId} onBack={() => router.back()} />
        )}
      </View>
    </>
  );
}

function ContractDetail({
  athleteName,
  athleteSubtext,
  contract,
  onBack,
}: {
  athleteName: string;
  athleteSubtext: string;
  contract: NonNullable<ReturnType<typeof useBrandAthleteContract>['data']>;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Visual-only tap target: spec says deliverable taps go nowhere.
  const handleDeliverablePress = React.useCallback(() => undefined, []);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 44 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Athlete contract</Text>
        <View style={styles.backButton} />
      </View>

      <Animated.View entering={FadeInDown.duration(320)}>
        <BrandRosterContractCard
          contract={contract}
          athleteName={athleteName}
          athleteSubtext={athleteSubtext}
          onDeliverablePress={handleDeliverablePress}
        />
      </Animated.View>
    </ScrollView>
  );
}

function LoadingState() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.center, { paddingTop: insets.top + 80 }]}>
      <ActivityIndicator color={ACCENT} />
    </View>
  );
}

function NotFound({
  athleteId,
  onBack,
}: {
  athleteId: string | undefined;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.notFound, { paddingTop: insets.top + 72 }]}>
      <Text style={styles.notFoundTitle}>Contract not found</Text>
      <Text style={styles.notFoundBody}>
        {athleteId
          ? `No signed contract on file for this athlete yet.`
          : 'This contract is no longer available.'}
      </Text>
      <Pressable onPress={onBack} style={styles.notFoundButton} accessibilityRole="button">
        <Text style={styles.notFoundButtonText}>Go back</Text>
      </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
  center: {
    flex: 1,
    alignItems: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  notFoundBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  notFoundButton: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}66`,
    backgroundColor: `${ACCENT}1A`,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
