// ── BRAND · OPEN DEAL DETAIL ──────────────────────────────
// Sprint 2.3 buyer surface. Renders:
//   - Hero: title, brand, budget band, slots, exclusivity, posted /
//     deadline, status pill
//   - Activation requirements (nilCategory, disclosure modes, funding)
//   - Applicant review — ranked list (rank, score, rationale, trust)
//     with visual-only approve / skip / reject actions per row
//   - Approval-gate banner above the action row
//
// Visual tokens match `deal-detail-spine`:
//   radius 10, border rgba(255,255,255,0.10), bg rgba(255,255,255,0.055)
//   accent #EB621A, teal #00C6B0, violet #C8A2FF

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

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { DataRow, StatusPill } from '@/components/shared/ui-kit';
import { useOpenDeal, useRankedApplicants } from '@/hooks/use-open-deals';
import type { AiApplicantRank, AiTrustMeta } from '@/lib/api/ai-review';
import type { RankedApplicant } from '@/lib/api/open-deals';
import type {
  OpenDealApplicantReviewAction,
  OpenDealStatus,
  OpenDealSurfaceRecord,
} from '@/lib/types/open-deal.types';

const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';
const WARN = '#FFD60A';

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

function statusLabel(status: OpenDealStatus): string {
  switch (status) {
    case 'live':
    case 'open':
      return 'Live';
    case 'reviewing':
      return 'Reviewing';
    case 'awarded':
      return 'Awarded';
    case 'closed':
    case 'closed-filled':
    case 'closed-cancelled':
      return 'Closed';
    case 'draft':
    default:
      return 'Draft';
  }
}

function statusColor(status: OpenDealStatus): string {
  const label = statusLabel(status);
  if (label === 'Live') return TEAL;
  if (label === 'Reviewing') return ACCENT;
  if (label === 'Awarded') return VIOLET;
  if (label === 'Closed') return 'rgba(255,255,255,0.45)';
  return WARN;
}

export default function OpenDealDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = normalizeParam(params.id);
  const { data: record, isLoading: dealLoading } = useOpenDeal(id);
  const { data: ranked, isLoading: rankLoading } = useRankedApplicants(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {dealLoading && !record ? (
        <LoadingState />
      ) : record ? (
        <OpenDealDetail
          record={record}
          ranked={ranked}
          rankLoading={rankLoading}
          onBack={() => router.back()}
        />
      ) : (
        <NotFound onBack={() => router.back()} />
      )}
    </>
  );
}

function OpenDealDetail({
  record,
  ranked,
  rankLoading,
  onBack,
}: {
  record: OpenDealSurfaceRecord;
  ranked: Awaited<ReturnType<typeof import('@/lib/api/open-deals').openDealsApi.getRankedApplicants>> | undefined;
  rankLoading: boolean;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { deal, brandLabel, budget, slots, postedAt, deadline, source } = record;
  const color = statusColor(deal.status);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 44 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(320)} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <StatusPill label={statusLabel(deal.status)} color={color} size="md" />
          </View>

          <Text style={[styles.eyebrow, { color: ACCENT }]}>OPEN DEAL · {deal.category.toUpperCase()}</Text>
          <Text style={styles.heroTitle} numberOfLines={3}>{deal.title}</Text>
          <Text style={styles.heroMeta} numberOfLines={1}>
            {brandLabel} · {deal.exclusivityRequired ? 'Exclusive' : 'Non-exclusive'} · {slots === 1 ? '1 slot' : `${slots} slots`}
          </Text>
          <Text style={styles.heroBody}>{deal.briefMarkdown}</Text>

          <View style={styles.metricRow}>
            <MetricTile label="Budget" value={`${formatMoney(budget.low.cents)}–${formatMoney(budget.high.cents)}`} accent={ACCENT} />
            <MetricTile label="Posted" value={formatShort(postedAt)} accent="#FFFFFF" />
            <MetricTile label="Deadline" value={formatShort(deadline)} accent={WARN} />
          </View>

          <View style={styles.sourceFooter}>
            <Ionicons name="flask-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.sourceFooterText}>{source.label}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(320)}>
          <ActivationCard record={record} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(320)}>
          <ApprovalGateBanner />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(320)}>
          <ApplicantReviewSection
            applicants={ranked?.applicants ?? []}
            rankings={ranked?.ranking.rankings ?? []}
            packetTrust={ranked?.ranking.trust}
            isLoading={rankLoading}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ActivationCard({ record }: { record: OpenDealSurfaceRecord }) {
  const { deal, disclosureModes, fundingSource } = record;
  return (
    <View style={styles.card}>
      <SectionHead label="Activation requirements" icon="megaphone-outline" />
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

function ApprovalGateBanner() {
  return (
    <View style={styles.gateBanner}>
      <View style={styles.gateIcon}>
        <Ionicons name="shield-half-outline" size={16} color={ACCENT} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.gateTitle}>Human approval required</Text>
        <Text style={styles.gateBody}>
          AI rankings are auto-suggested only. Approve a row before any outbound contact — per PLAN §2.3 AI ranking governance.
        </Text>
      </View>
    </View>
  );
}

function ApplicantReviewSection({
  applicants,
  rankings,
  packetTrust,
  isLoading,
}: {
  applicants: RankedApplicant[];
  rankings: AiApplicantRank[];
  packetTrust: AiTrustMeta | undefined;
  isLoading: boolean;
}) {
  const rankingsById = React.useMemo(
    () => new Map(rankings.map((r) => [r.applicantId, r])),
    [rankings],
  );

  // Local optimistic reviewer state — promotes the previously visual-only
  // Approve/Skip/Reject pills to a real per-row decision the brand can toggle
  // before any outbound contact (see ApprovalGateBanner). Keyed by the stable
  // application id; tapping the active pill clears the decision.
  const [decisions, setDecisions] = React.useState<
    Record<string, OpenDealApplicantReviewAction>
  >({});

  const onDecide = React.useCallback(
    (applicationId: string, action: OpenDealApplicantReviewAction) => {
      setDecisions((prev) => {
        const next = { ...prev };
        if (next[applicationId] === action) {
          delete next[applicationId];
        } else {
          next[applicationId] = action;
        }
        return next;
      });
    },
    [],
  );

  const approvedCount = React.useMemo(
    () => Object.values(decisions).filter((d) => d === 'approve').length,
    [decisions],
  );
  const reviewedCount = Object.keys(decisions).length;

  return (
    <View style={styles.card}>
      <SectionHead label="Applicant review" icon="people-outline" />
      {packetTrust ? <TrustBand trust={packetTrust} kicker="AI ranking trust" /> : null}
      {isLoading && applicants.length === 0 ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={ACCENT} />
          <Text style={styles.loadingText}>Ranking applicants…</Text>
        </View>
      ) : applicants.length === 0 ? (
        <Text style={styles.bodyText}>No applicants yet. Open the deal to start the pool.</Text>
      ) : (
        <>
          <Text style={styles.reviewProgress}>
            {reviewedCount === 0
              ? `${applicants.length} to review · no decisions yet`
              : `${approvedCount} approved · ${reviewedCount} of ${applicants.length} reviewed`}
          </Text>
          {applicants.map((item, index) => {
            const ranking = rankingsById.get(item.application.id);
            return (
              <ApplicantRow
                key={item.application.id}
                applicant={item}
                ranking={ranking}
                rank={ranking?.rank ?? index + 1}
                decision={decisions[item.application.id]}
                onDecide={onDecide}
              />
            );
          })}
        </>
      )}
    </View>
  );
}

function ApplicantRow({
  applicant,
  ranking,
  rank,
  decision,
  onDecide,
}: {
  applicant: RankedApplicant;
  ranking: AiApplicantRank | undefined;
  rank: number;
  decision: OpenDealApplicantReviewAction | undefined;
  onDecide: (applicationId: string, action: OpenDealApplicantReviewAction) => void;
}) {
  const router = useRouter();
  const athlete = applicant.athlete;
  const name = athlete?.name ?? applicant.application.athleteId;
  const school = athlete?.school ?? '—';
  const followers = athlete?.followers ? `${athlete.followers} reach` : 'reach n/a';
  const score = ranking?.matchScore ?? athlete?.fitScore ?? 0;
  const rationale = ranking?.rationale.join(' · ') ?? '—';
  const ask = applicant.application.askCents
    ? formatMoney(applicant.application.askCents)
    : '—';
  const applicantId = applicant.application.athleteId;
  const applicationId = applicant.application.id;

  const onOpenPermissions = React.useCallback(() => {
    if (!applicantId) {
      // Defensive — applicant payload should always carry an athleteId.
      console.warn(
        '[open-deals] applicant missing athleteId, navigating to permissions list',
      );
      router.push('/athlete/permissions');
      return;
    }
    router.push(`/athlete/permissions?athleteId=${applicantId}`);
  }, [router, applicantId]);

  const dimmed = decision === 'skip' || decision === 'reject';

  return (
    <View style={[styles.applicantRow, dimmed && styles.applicantRowDimmed]}>
      <View style={styles.applicantHead}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>#{rank}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.applicantName} numberOfLines={1}>{name}</Text>
          <Text style={styles.applicantMeta} numberOfLines={1}>
            {school} · {followers} · ask {ask}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{Math.round(score)}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>

      <Text style={styles.rationaleText} numberOfLines={3}>{rationale}</Text>

      {ranking ? <TrustBand trust={ranking.trust} compact /> : null}

      <Pressable
        onPress={onOpenPermissions}
        style={styles.permissionsChip}
        accessibilityRole="link"
        accessibilityLabel={`Permission grants for ${name}`}
      >
        <Ionicons name="key-outline" size={12} color={VIOLET} />
        <Text style={styles.permissionsChipText}>Permission grants</Text>
        <Ionicons name="arrow-forward" size={11} color={VIOLET} />
      </Pressable>

      <View style={styles.actionRow}>
        <ActionPill
          label="Approve"
          icon="checkmark"
          tint={TEAL}
          selected={decision === 'approve'}
          athleteName={name}
          onPress={() => onDecide(applicationId, 'approve')}
        />
        <ActionPill
          label="Skip"
          icon="ellipsis-horizontal"
          tint="rgba(255,255,255,0.55)"
          selected={decision === 'skip'}
          athleteName={name}
          onPress={() => onDecide(applicationId, 'skip')}
        />
        <ActionPill
          label="Reject"
          icon="close"
          tint="#FF5A5F"
          selected={decision === 'reject'}
          athleteName={name}
          onPress={() => onDecide(applicationId, 'reject')}
        />
      </View>
    </View>
  );
}

function TrustBand({
  trust,
  compact,
  kicker,
}: {
  trust: AiTrustMeta;
  compact?: boolean;
  kicker?: string;
}) {
  return (
    <View style={[styles.trustBand, compact && styles.trustBandCompact]}>
      <View style={styles.trustHead}>
        <Ionicons name="sparkles-outline" size={12} color={VIOLET} />
        <Text style={styles.trustKicker}>
          {kicker ?? 'AI rationale'} · provider: {trust.provider === 'mock' ? 'AI' : trust.provider}
        </Text>
      </View>
      <View style={styles.trustMetaRow}>
        <Text style={styles.trustChip}>confidence: {trust.confidence}</Text>
        <Text style={styles.trustChip}>reviewer: {trust.reviewerState}</Text>
      </View>
    </View>
  );
}

function ActionPill({
  label,
  icon,
  tint,
  selected,
  athleteName,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  selected: boolean;
  athleteName: string;
  onPress: () => void;
}) {
  // Selected = solid tint chip with dark glyph; idle = ghost chip with tinted
  // glyph. A neutral skip selection keeps a light glyph for contrast.
  const isNeutral = tint.startsWith('rgba');
  const glyphColor = selected ? (isNeutral ? '#FFFFFF' : '#0E0E10') : tint;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionPill,
        {
          borderColor: selected ? tint : `${tint}55`,
          backgroundColor: selected
            ? tint
            : pressed
              ? `${tint}22`
              : `${tint}10`,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        selected
          ? `${label} selected for ${athleteName} — tap to clear`
          : `${label} ${athleteName}`
      }
    >
      <Ionicons name={icon} size={13} color={glyphColor} />
      <Text style={[styles.actionPillText, { color: glyphColor }]}>{label}</Text>
    </Pressable>
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

function SectionHead({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHead}>
      <Ionicons name={icon} size={16} color={ACCENT} />
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
      <Text style={styles.notFoundTitle}>Open deal not found</Text>
      <Text style={styles.notFoundBody}>
        This open deal is no longer available or has been closed.
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
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
  },
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
    flexWrap: 'wrap',
  },
  sourceFooterText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sourceCaveat: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontStyle: 'italic',
    flex: 1,
  },
  card: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  bodyText: {
    color: 'rgba(255,255,255,0.66)',
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
  gateTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  gateBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '700',
  },
  applicantRow: {
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  applicantRowDimmed: {
    opacity: 0.5,
  },
  reviewProgress: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  applicantHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}1C`,
  },
  rankBadgeText: {
    color: ACCENT,
    fontSize: 11.5,
    fontWeight: '900',
  },
  applicantName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  applicantMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 50,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.42)',
    backgroundColor: 'rgba(0,198,176,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreValue: {
    color: TEAL,
    fontSize: 16,
    fontWeight: '900',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rationaleText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 17,
  },
  trustBand: {
    gap: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200,162,255,0.32)',
    backgroundColor: 'rgba(200,162,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  trustBandCompact: {
    paddingVertical: 6,
  },
  trustHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustKicker: {
    color: VIOLET,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  trustMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustChip: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 10.5,
    fontWeight: '700',
  },
  permissionsChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${VIOLET}55`,
    backgroundColor: `${VIOLET}14`,
  },
  permissionsChipText: {
    color: VIOLET,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
