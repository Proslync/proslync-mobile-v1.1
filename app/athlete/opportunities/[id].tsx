// ── ATHLETE · OPPORTUNITY DETAIL ──────────────────────────
// Sprint 2.3 athlete-side OpenDeal detail. Sibling to
// `app/brand/open-deals/[id].tsx` (the brand-side review surface);
// reframed for the athlete viewer with:
//   - Hero (brand label, category, budget, slots, exclusivity, deadline)
//   - "Why this matches you" (from `mock-athlete-discovery.ts`)
//   - Activation requirements (mirrors the brand-side rendering)
//   - APPLY card — inline form (no modal) wired through
//     `useApplyToOpenDeal()` mutation. Mock-only persistence.
//   - Trust posture banner restating "AI rank + human approval"
//
// Visual tokens match `deal-detail-spine`:
//   radius 10, border rgba(255,255,255,0.10), bg rgba(255,255,255,0.055)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { DataRow, StatusPill } from '@/components/shared/ui-kit';
import { useApplyToOpenDeal, useOpenDeal } from '@/hooks/use-open-deals';
import { getMatchReasonsForOpenDeal } from '@/lib/data/mock-athlete-discovery';
import type { OpenDealSurfaceRecord } from '@/lib/types/open-deal.types';

const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';
const WARN = '#FFD60A';

// Sprint 2.3 demo athlete — must match the discovery fixture in
// `lib/data/mock-athlete-discovery.ts`.
const DEMO_ATHLETE_ID = 'a-1';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Default proposed-rate band keyed off the OpenDeal category. */
function defaultProposedRate(category: string): string {
  const c = category.toLowerCase();
  if (c === 'endorsement') return '$25K – $75K';
  if (c === 'appearance') return '$8K – $25K';
  if (c === 'affiliate') return '$5K – $20K';
  return '$10K – $40K';
}

/** Default 2-line "Why I'm a fit" placeholder per category. */
function defaultPitchPlaceholder(category: string): string {
  const c = category.toLowerCase();
  if (c === 'endorsement') {
    return 'Multi-year fit — clean disclosure record, audience overlaps the target market.\nAvailable for capsule launch + summer tour content.';
  }
  if (c === 'appearance') {
    return 'Available for the appearance window with two content pieces post-event.\nTravel-flexible; willing to coordinate with brand creative team.';
  }
  if (c === 'affiliate') {
    return 'Strong short-video output with on-screen disclosure already standard.\nWilling to run 2–3 affiliate edits with tracking URL.';
  }
  return 'Reach + brand fit aligns with the desired-attributes filter.\nAvailable for the workload window and disclosure requirements.';
}

export default function AthleteOpportunityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = normalizeParam(params.id);
  const { data: record, isLoading } = useOpenDeal(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {isLoading && !record ? (
        <LoadingState />
      ) : record ? (
        <OpportunityDetail record={record} onBack={() => router.back()} />
      ) : (
        <NotFound onBack={() => router.back()} />
      )}
    </>
  );
}

function OpportunityDetail({
  record,
  onBack,
}: {
  record: OpenDealSurfaceRecord;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { deal, brandLabel, budget, slots, deadline, source } = record;
  const reasons = React.useMemo(
    () => getMatchReasonsForOpenDeal(DEMO_ATHLETE_ID, deal.id),
    [deal.id],
  );

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(320)} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <StatusPill label="Match" color={TEAL} size="md" />
          </View>

          <Text style={[styles.eyebrow, { color: ACCENT }]}>
            OPEN DEAL · {deal.category.toUpperCase()}
          </Text>
          <Text style={styles.heroTitle} numberOfLines={3}>{deal.title}</Text>
          <Text style={styles.heroMeta} numberOfLines={1}>
            {brandLabel} · {deal.exclusivityRequired ? 'Exclusive' : 'Non-exclusive'} ·{' '}
            {slots === 1 ? '1 slot' : `${slots} slots`}
          </Text>
          <Text style={styles.heroBody}>{deal.briefMarkdown}</Text>

          <View style={styles.metricRow}>
            <MetricTile
              label="Budget"
              value={`${formatMoney(budget.low.cents)}–${formatMoney(budget.high.cents)}`}
              accent={ACCENT}
            />
            <MetricTile label="Slots" value={String(slots)} accent={TEAL} />
            <MetricTile label="Deadline" value={formatShort(deadline)} accent={WARN} />
          </View>

          <View style={styles.sourceFooter}>
            <Ionicons name="flask-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.sourceFooterText}>{source.label}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(40).duration(320)}>
          <WhyMatchesCard reasons={reasons} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(320)}>
          <ActivationCard record={record} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(320)}>
          <ApplyCard openDealId={deal.id} category={deal.category} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(320)}>
          <ApprovalGateBanner />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function WhyMatchesCard({ reasons }: { reasons: string[] }) {
  return (
    <View style={styles.card}>
      <SectionHead label="Why this matches you" icon="sparkles-outline" tint={VIOLET} />
      {reasons.map((r) => (
        <View key={r} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{r}</Text>
        </View>
      ))}
    </View>
  );
}

function ActivationCard({ record }: { record: OpenDealSurfaceRecord }) {
  const { deal, disclosureModes, fundingSource } = record;
  return (
    <View style={styles.card}>
      <SectionHead label="Activation requirements" icon="megaphone-outline" tint={ACCENT} />
      <DataRow label="NIL category" value={deal.nilCategory ?? deal.category} />
      <DataRow label="Funding source" value={fundingSource.replace(/-/g, ' ')} />
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>Disclosure modes</Text>
        <View style={styles.chipRow}>
          {disclosureModes.map((mode) => (
            <View key={mode} style={styles.chip}>
              <Text style={styles.chipText}>{mode.replace(/-/g, ' ')}</Text>
            </View>
          ))}
        </View>
      </View>
      <DataRow
        label="Exclusivity"
        value={deal.exclusivityRequired ? 'Required' : 'Not required'}
        tone={deal.exclusivityRequired ? 'warning' : 'default'}
      />
      <DataRow
        label="Selection"
        value={deal.selectionPolicy.replace(/-/g, ' ')}
        isLastInGroup
      />
    </View>
  );
}

function ApplyCard({ openDealId, category }: { openDealId: string; category: string }) {
  const apply = useApplyToOpenDeal();
  const [shareWithNilManager, setShareWithNilManager] = React.useState(true);
  const proposedRate = React.useMemo(() => defaultProposedRate(category), [category]);
  const placeholder = React.useMemo(() => defaultPitchPlaceholder(category), [category]);
  const submitted = apply.isSuccess;
  const submitting = apply.isPending;

  const onSubmit = React.useCallback(() => {
    apply.mutate({
      openDealId,
      applicantId: DEMO_ATHLETE_ID,
      payload: {
        consentLevel: shareWithNilManager ? 'summary' : 'withheld',
        pitchNote: placeholder,
      },
    });
  }, [apply, openDealId, placeholder, shareWithNilManager]);

  return (
    <View style={[styles.card, styles.applyCard]}>
      <View style={styles.applyHead}>
        <SectionHead label="Apply to this deal" icon="paper-plane-outline" tint={TEAL} />
        {submitted ? <StatusPill label="Submitted" color={TEAL} icon="checkmark" /> : null}
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formLabel}>Proposed rate</Text>
        <View style={styles.formField}>
          <Text style={styles.formFieldValue}>{proposedRate}</Text>
          <Text style={styles.formFieldHint}>Default range based on category — editable later</Text>
        </View>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formLabel}>Why I&apos;m a fit</Text>
        <View style={[styles.formField, styles.formFieldTextarea]}>
          <Text style={styles.formFieldValue}>{placeholder}</Text>
        </View>
      </View>

      <View style={styles.consentRow}>
        <View style={styles.flex}>
          <Text style={styles.consentLabel}>Share with NIL Manager?</Text>
          <Text style={styles.consentBody}>
            Sharing exposes a SUMMARY-level view of this application to your NIL Manager. Toggle
            off to keep this application withheld.
          </Text>
        </View>
        <Switch
          value={shareWithNilManager}
          onValueChange={setShareWithNilManager}
          trackColor={{ false: 'rgba(255,255,255,0.14)', true: `${TEAL}88` }}
          thumbColor={shareWithNilManager ? TEAL : 'rgba(255,255,255,0.55)'}
          accessibilityLabel="Share application with NIL Manager"
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={submitting || submitted}
        style={({ pressed }) => [
          styles.submitButton,
          (pressed || submitting) && styles.submitButtonPressed,
          submitted && styles.submitButtonSubmitted,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Submit application"
      >
        {submitting ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <>
            <Ionicons
              name={submitted ? 'checkmark' : 'paper-plane'}
              size={15}
              color="#000000"
            />
            <Text style={styles.submitButtonText}>
              {submitted ? 'Application submitted' : 'Submit application'}
            </Text>
          </>
        )}
      </Pressable>

      {apply.isError ? (
        <Text style={styles.submitError}>
          Couldn't submit — please try again.
        </Text>
      ) : null}
    </View>
  );
}

function ApprovalGateBanner() {
  return (
    <View style={styles.gateBanner}>
      <View style={styles.gateIcon}>
        <Ionicons name="shield-half-outline" size={16} color={ACCENT} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.gateTitle}>Brand reviews via AI rank + human approval</Text>
        <Text style={styles.gateBody}>
          Submitting does not guarantee a deal. Every applicant is ranked by the AI pass and then
          manually reviewed by the brand and (where applicable) your NIL Manager.
        </Text>
      </View>
    </View>
  );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.metricTile}>
      <Text style={[styles.metricValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionHead({
  label,
  icon,
  tint,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function LoadingState() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
      <DarkGradientBg />
      <ActivityIndicator color={ACCENT} />
    </View>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.notFound, { paddingTop: insets.top + 72 }]}>
      <DarkGradientBg />
      <Text style={styles.notFoundTitle}>Opportunity not found</Text>
      <Text style={styles.notFoundBody}>
        This opportunity is no longer available or has been filled.
      </Text>
      <Pressable onPress={onBack} style={styles.notFoundButton} accessibilityRole="button">
        <Text style={styles.notFoundButtonText}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { gap: 14, paddingHorizontal: 16 },
  flex: { flex: 1 },
  heroCard: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 16,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
  },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricTile: {
    flex: 1,
    minHeight: 60,
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 10,
  },
  metricValue: { fontSize: 13, fontWeight: '900' },
  metricLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  sourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceFooterText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '800',
  },
  card: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  applyCard: {
    borderColor: `${TEAL}55`,
    backgroundColor: `${TEAL}10`,
  },
  applyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: VIOLET,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  kvRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 9,
  },
  kvLabel: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 0.55,
  },
  kvValue: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1.45,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  chipRow: {
    flex: 1.45,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.32)',
    backgroundColor: 'rgba(0,198,176,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  formBlock: { gap: 6 },
  formLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formField: {
    gap: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  formFieldTextarea: { minHeight: 70 },
  formFieldValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  formFieldHint: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontStyle: 'italic',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  consentLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  consentBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: TEAL,
    paddingVertical: 13,
  },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonSubmitted: { backgroundColor: `${TEAL}AA` },
  submitButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  submitError: {
    color: '#FF5A5F',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  notFoundTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
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
