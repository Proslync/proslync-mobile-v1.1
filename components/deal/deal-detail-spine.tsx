import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExportPacketButton } from '@/components/compliance/export-packet-button';
import { DealEnrichmentCard } from '@/components/deal/deal-enrichment-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { SectionCard, StatusPill } from '@/components/shared/ui-kit';
import { aiReviewApi } from '@/lib/api/ai-review';
import { useDealComparables } from '@/hooks/use-deal-comparables';
import type { BrandDealDetail } from '@/lib/data/mock-brand-data';
import type {
  ComparableDealEvidence,
  ComparableDealRow,
} from '@/lib/types/comparable-deal.types';

import {
  DEAL_LENS_ORDER,
  buildDealLenses,
  buildDealSpineSteps,
  buildDealTimeline,
  commitmentTone,
  formatDealStatus,
  reviewTone,
  splitAthleteContext,
  toneColor,
  type DealLens,
  type DealLensKey,
  type DealSpineStep,
  type DealTimelineRow,
  type DealTone,
} from './deal-detail-model';

type DealDetailSpineProps = {
  detail: BrandDealDetail;
  initialLens: DealLensKey;
  onBack: () => void;
};

const STAGE_ORDER = ['draft', 'sent', 'negotiation', 'signed', 'live'] as const;
const STAGE_COPY: Record<(typeof STAGE_ORDER)[number], string> = {
  draft: 'Draft',
  sent: 'Sent',
  negotiation: 'Negotiate',
  signed: 'Signed',
  live: 'Live',
};

export function DealDetailSpine({ detail, initialLens, onBack }: DealDetailSpineProps) {
  const insets = useSafeAreaInsets();
  const [activeLens, setActiveLens] = React.useState<DealLensKey>(initialLens);

  React.useEffect(() => {
    setActiveLens(initialLens);
  }, [detail.id, initialLens]);

  const lenses = React.useMemo(() => buildDealLenses(detail), [detail]);
  const spineSteps = React.useMemo(() => buildDealSpineSteps(detail), [detail]);
  const timeline = React.useMemo(() => buildDealTimeline(detail), [detail]);
  const { data: comparables } = useDealComparables(detail.deal.id);
  const lens = lenses[activeLens];
  const { athleteName, organization } = splitAthleteContext(detail.deal.athlete);
  const stageIndex = STAGE_ORDER.indexOf(detail.stage.key);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 44 },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(320)} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <StatusPill
              label={formatDealStatus(detail.aiCompliance.status)}
              tone={reviewTone(detail.aiCompliance.status)}
              icon="shield-checkmark-outline"
            />
          </View>

          <Text style={[styles.eyebrow, { color: lens.color }]}>{lens.eyebrow}</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {detail.companyOverview.name} x {athleteName}
          </Text>
          <Text style={styles.heroMeta} numberOfLines={1}>
            {organization} / {detail.deal.term} / {detail.deal.owner}
          </Text>
          <Text style={styles.heroBody}>{lens.summary}</Text>

          <View style={styles.metricRow}>
            <MetricTile label={lens.primaryLabel} value={lens.primaryMetric} />
            <MetricTile label={lens.secondaryLabel} value={lens.secondaryMetric} />
            <MetricTile label="Stage" value={detail.stage.label} />
          </View>

          <StageTrack activeIndex={stageIndex} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(320)} style={styles.lensBlock}>
          <Text style={styles.sectionKicker}>Role lens</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensRail}>
            {DEAL_LENS_ORDER.map((key) => (
              <LensChip
                key={key}
                lens={lenses[key]}
                active={activeLens === key}
                onPress={() => setActiveLens(key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(320)}>
          <RoleLensCard lens={lens} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(320)}>
          <SectionHeader label="Shared deal spine" />
          <View style={styles.spineGrid}>
            {spineSteps.map((step) => (
              <SpineStepCard key={step.id} step={step} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(320)}>
          <SectionCard title="Counterparties" icon="people-outline">
            <CounterpartyRow
              color="#EB621A"
              initials={detail.companyOverview.name.slice(0, 2).toUpperCase()}
              name={detail.companyOverview.name}
              meta={`${detail.companyOverview.headquarters} / brand owner ${detail.deal.owner}`}
            />
            <CounterpartyRow
              color="#00C6B0"
              initials={athleteName.slice(0, 2).toUpperCase()}
              name={athleteName}
              meta={`${organization} / athlete side`}
            />
            {detail.contacts.map((contact) => (
              <CounterpartyRow
                key={contact.id}
                color="#7BAFD4"
                initials={contact.name.slice(0, 2).toUpperCase()}
                name={contact.name}
                meta={`${contact.role} / ${contact.organization}`}
                note={contact.context}
              />
            ))}
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(210).duration(320)}>
          <SectionCard title="Economics and terms" icon="cash-outline">
            <MoneyLine label="Guaranteed" value={detail.money.guaranteed} />
            <MoneyLine label="Performance" value={detail.money.performance} />
            <MoneyLine label="Usage rights" value={detail.money.usageRights} />
            <MoneyLine label="Payment timing" value={detail.money.paymentTiming} />
            <View style={styles.breakdownBox}>
              {detail.money.breakdown.map((row) => (
                <View key={row.label} style={styles.breakdownRow}>
                  <View style={styles.flex}>
                    <Text style={styles.breakdownLabel}>{row.label}</Text>
                    <Text style={styles.breakdownNote}>{row.note}</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(320)}>
          <SectionCard title="Commitments" icon="checkbox-outline">
            {detail.commitments.map((commitment) => (
              <CommitmentRow key={commitment.id} commitment={commitment} />
            ))}
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(290).duration(320)}>
          <SectionCard title="Compliance triad" icon="shield-checkmark-outline">
            <Text style={styles.bodyText}>{detail.aiCompliance.summary}</Text>
            {detail.aiCompliance.tracks.map((track) => (
              <ReviewTrackRow key={track.label} track={track} />
            ))}
            <View style={styles.caveatBox}>
              {detail.aiCompliance.caveats.map((caveat) => (
                <View key={caveat} style={styles.inlineRow}>
                  <Ionicons name="warning-outline" size={14} color={toneColor('warning')} />
                  <Text style={styles.caveatText}>{caveat}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(330).duration(320)}>
          <EvidencePacketCard detail={detail} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(345).duration(320)}>
          <DealEnrichmentCard detail={detail} />
        </Animated.View>

        {comparables && comparables.rows.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(360).duration(320)}>
            <ComparableDealsCard evidence={comparables} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(365).duration(320)}>
          <ExportPacketButton
            kind="deal-evidence"
            subjectId={detail.deal.id}
            subjectLabel={`${detail.companyOverview.name} x ${detail.deal.athlete}`}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(370).duration(320)}>
          <SectionCard title="Audit timeline" icon="time-outline">
            {timeline.map((item) => (
              <TimelineRow key={item.id} item={item} />
            ))}
          </SectionCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StageTrack({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.stageTrack}>
      {STAGE_ORDER.map((stage, index) => {
        const active = index <= activeIndex;
        return (
          <View key={stage} style={styles.stageNode}>
            <View style={[styles.stageDot, active && styles.stageDotActive]} />
            <Text style={[styles.stageText, active && styles.stageTextActive]}>{STAGE_COPY[stage]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LensChip({
  lens,
  active,
  onPress,
}: {
  lens: DealLens;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.lensChip,
        active && {
          borderColor: lens.color,
          backgroundColor: `${lens.color}20`,
        },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={lens.icon} size={15} color={active ? lens.color : 'rgba(255,255,255,0.62)'} />
      <Text style={[styles.lensChipText, active && { color: '#FFFFFF' }]}>{lens.label}</Text>
    </Pressable>
  );
}

function RoleLensCard({ lens }: { lens: DealLens }) {
  return (
    <View style={[styles.card, { borderColor: `${lens.color}42` }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { borderColor: `${lens.color}66`, backgroundColor: `${lens.color}18` }]}>
          <Ionicons name={lens.icon} size={17} color={lens.color} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardEyebrow}>{lens.eyebrow}</Text>
          <Text style={styles.cardTitle}>{lens.title}</Text>
        </View>
      </View>
      <Text style={styles.bodyText}>{lens.visibility}</Text>
      <View style={styles.actionPill}>
        <Text style={[styles.actionPillText, { color: lens.color }]}>{lens.actionLabel}</Text>
      </View>
      <View style={styles.checkStack}>
        {lens.checks.map((check) => (
          <View key={check.id} style={styles.checkRow}>
            <View style={[styles.checkIcon, { backgroundColor: `${toneColor(check.tone)}24` }]}>
              <Ionicons name={check.tone === 'success' ? 'checkmark' : 'ellipse'} size={12} color={toneColor(check.tone)} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.checkLabel}>{check.label}</Text>
              <Text style={styles.checkNote}>{check.note}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionKicker}>{label}</Text>;
}

function SpineStepCard({ step }: { step: DealSpineStep }) {
  return (
    <View style={styles.spineCard}>
      <View style={styles.spineTop}>
        <Text style={styles.spineLabel}>{step.label}</Text>
        <View style={[styles.spineDot, { backgroundColor: toneColor(step.tone) }]} />
      </View>
      <Text style={styles.spineValue} numberOfLines={1}>{step.value}</Text>
      <Text style={styles.spineNote} numberOfLines={3}>{step.note}</Text>
    </View>
  );
}

function CounterpartyRow({
  color,
  initials,
  name,
  meta,
  note,
}: {
  color: string;
  initials: string;
  name: string;
  meta: string;
  note?: string;
}) {
  return (
    <View style={styles.counterpartyRow}>
      <View style={[styles.avatar, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={1}>{name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

function MoneyLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moneyLine}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={styles.moneyValue}>{value}</Text>
    </View>
  );
}

function CommitmentRow({
  commitment,
}: {
  commitment: BrandDealDetail['commitments'][number];
}) {
  const tone = commitmentTone(commitment.status);
  return (
    <View style={styles.commitmentRow}>
      <View style={[styles.statusIcon, { borderColor: `${toneColor(tone)}66` }]}>
        <Ionicons
          name={commitment.status === 'done' ? 'checkmark' : commitment.status === 'blocked' ? 'alert' : 'time-outline'}
          size={14}
          color={toneColor(tone)}
        />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle} numberOfLines={1}>{commitment.title}</Text>
          <StatusPill label={formatDealStatus(commitment.status)} tone={tone} />
        </View>
        <Text style={styles.rowMeta}>{commitment.due} / {commitment.owner}</Text>
        <Text style={styles.rowNote}>{commitment.proof}</Text>
      </View>
    </View>
  );
}

function ReviewTrackRow({
  track,
}: {
  track: BrandDealDetail['aiCompliance']['tracks'][number];
}) {
  const tone = reviewTone(track.status);
  return (
    <View style={styles.reviewTrack}>
      <View style={[styles.trackDot, { backgroundColor: toneColor(tone) }]} />
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{track.label}</Text>
        <Text style={styles.rowNote}>{track.note}</Text>
      </View>
      <StatusPill label={formatDealStatus(track.status)} tone={tone} />
    </View>
  );
}

function EvidencePacketCard({ detail }: { detail: BrandDealDetail }) {
  return (
    <SectionCard title="Evidence packet" icon="document-text-outline">
      <View style={styles.evidenceHead}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{detail.evidence.packetTitle}</Text>
          <Text style={styles.bodyText}>
            Comparable-deal context, source state, caveats, and reviewer-ready attachments.
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{detail.evidence.matchScore}</Text>
          <Text style={styles.scoreLabel}>{detail.evidence.confidence}</Text>
        </View>
      </View>

      <View style={styles.chipWrap}>
        {detail.evidence.rationale.map((item) => (
          <View key={item} style={styles.reasonChip}>
            <Ionicons name="checkmark-circle" size={12} color={toneColor('success')} />
            <Text style={styles.reasonText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.microLabel}>Attachments</Text>
      {detail.evidence.attachments.map((attachment) => (
        <View key={attachment.label} style={styles.sourceRow}>
          <Ionicons name="attach-outline" size={15} color="rgba(255,255,255,0.62)" />
          <Text style={styles.sourceTitle} numberOfLines={1}>{attachment.label}</Text>
          <StatusPill
            label={formatDealStatus(attachment.state)}
            tone={attachment.state === 'attached' ? 'success' : 'warning'}
          />
        </View>
      ))}

      <Text style={styles.microLabel}>Sources</Text>
      {detail.evidence.sources.map((source) => (
        <View key={source.id} style={styles.sourceBlock}>
          <View style={styles.sourceBlockTop}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{source.label}</Text>
              <Text style={styles.rowMeta}>{source.id} / {source.freshness}</Text>
            </View>
            <StatusPill label={formatDealStatus(source.state)} tone={source.state === 'attached' ? 'success' : 'warning'} />
          </View>
          <Text style={styles.rowNote}>{source.note}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

function ComparableDealsCard({ evidence }: { evidence: ComparableDealEvidence }) {
  const { summary, rows, attribution } = evidence;
  const visibleRows = rows.slice(0, 3);
  const aiCommentary = aiReviewApi.summarizeComparablesAsAiCommentary(evidence);
  return (
    <SectionCard title="Comparable deals" icon="bar-chart-outline">
      <View style={styles.compSummary}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{summary.summary}</Text>
          {summary.estimate ? (
            <View style={styles.compEstimateRow}>
              <Text style={styles.compEstimateValue}>
                {formatMoney(summary.estimate.cents)}
              </Text>
              {summary.range ? (
                <Text style={styles.compEstimateRange}>
                  {`${formatMoney(summary.range.low.cents)} – ${formatMoney(
                    summary.range.high.cents,
                  )}`}
                </Text>
              ) : null}
              <View style={styles.confidenceChip}>
                <Text style={styles.confidenceText}>
                  {`${summary.confidence} confidence`}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bodyText}>
              {`Insufficient comps for a midpoint estimate (${summary.confidence} confidence).`}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.aiCommentaryBox}>
        <View style={styles.inlineRow}>
          <Ionicons name="sparkles-outline" size={13} color="#7BAFD4" />
          <Text style={styles.aiCommentaryLabel}>AI commentary  ·  mock</Text>
        </View>
        <Text style={styles.bodyText}>{aiCommentary}</Text>
      </View>

      {visibleRows.map((row) => (
        <ComparableDealRowView key={row.id} row={row} />
      ))}

      <Text style={styles.microLabel}>Schema attribution</Text>
      <Text style={styles.rowNote}>
        {`${attribution.schemaSource} (${attribution.schemaLicense}). ${attribution.note}`}
      </Text>
    </SectionCard>
  );
}

const REVIEWER_STATE_LABELS: Record<ComparableDealRow['reviewerState'], string> = {
  'approved': 'Approved',
  'rejected': 'Rejected',
  'pending-review': 'In review',
  'auto-suggested': 'Suggested',
};

function formatFreshness(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1mo ago' : `${months}mo ago`;
}

function ComparableDealRowView({ row }: { row: ComparableDealRow }) {
  const tone: DealTone =
    row.reviewerState === 'approved'
      ? 'success'
      : row.reviewerState === 'rejected'
        ? 'danger'
        : row.reviewerState === 'pending-review'
          ? 'warning'
          : 'muted';
  const sourceKindLabel =
    row.source.kind === 'synthetic'
      ? 'Proslync comps'
      : row.source.kind.replace(/-/g, ' ');
  return (
    <View style={styles.compRow}>
      <View style={styles.compRowTop}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {row.athlete.displayName}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {`${row.brand.displayName}  ·  ${row.nilCategory}  ·  ${row.dealReportedAt}`}
          </Text>
        </View>
        <Text style={[styles.compAmount, { color: toneColor(tone) }]}>
          {formatMoney(row.amount.cents)}
        </Text>
      </View>
      <Text style={styles.rowNote}>{row.rationale}</Text>
      {row.caveats.length > 0 ? (
        <View style={styles.compCaveatBox}>
          {row.caveats.map((caveat) => (
            <View key={caveat} style={styles.inlineRow}>
              <Ionicons name="warning-outline" size={12} color={toneColor('warning')} />
              <Text style={styles.caveatText}>{caveat}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.compFooter}>
        <StatusPill
          label={REVIEWER_STATE_LABELS[row.reviewerState]}
          tone={tone}
          icon={tone === 'success' ? 'checkmark-circle-outline' : 'shield-outline'}
        />
        <Text style={styles.rowMeta} numberOfLines={1}>
          {`${sourceKindLabel}  ·  ${formatFreshness(row.source.freshnessDays)}`}
        </Text>
      </View>
    </View>
  );
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function TimelineRow({ item }: { item: DealTimelineRow }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: toneColor(item.tone) }]} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.timelineLabel}>{item.label}</Text>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowNote}>{item.note}</Text>
      </View>
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
  flex: {
    flex: 1,
  },
  heroCard: {
    gap: 14,
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
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    minHeight: 66,
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 10,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  stageTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  stageNode: {
    flex: 1,
    gap: 5,
  },
  stageDot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  stageDotActive: {
    backgroundColor: '#EB621A',
  },
  stageText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 9.5,
    fontWeight: '800',
  },
  stageTextActive: {
    color: 'rgba(255,255,255,0.84)',
  },
  lensBlock: {
    gap: 8,
  },
  lensRail: {
    gap: 8,
    paddingRight: 16,
  },
  lensChip: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  lensChipText: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionKicker: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    gap: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  cardIcon: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  cardEyebrow: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12.5,
    lineHeight: 18,
  },
  actionPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
    backgroundColor: 'rgba(255,111,60,0.08)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  actionPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  checkStack: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  checkIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginTop: 1,
    width: 24,
  },
  checkLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  checkNote: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  spineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spineCard: {
    width: '48.8%',
    minHeight: 118,
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 12,
  },
  spineTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spineLabel: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  spineDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  spineValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  spineNote: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
  },
  counterpartyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '900',
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  rowTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 17,
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 2,
  },
  rowNote: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  moneyLine: {
    alignItems: 'flex-start',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 9,
  },
  moneyLabel: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 11,
    fontWeight: '900',
  },
  moneyValue: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'right',
  },
  breakdownBox: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    overflow: 'hidden',
  },
  breakdownRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 11,
  },
  breakdownLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  breakdownNote: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },
  breakdownValue: {
    color: '#EB621A',
    fontSize: 13,
    fontWeight: '900',
  },
  commitmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    height: 28,
    justifyContent: 'center',
    marginTop: 1,
    width: 28,
  },
  reviewTrack: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 9,
    padding: 10,
  },
  trackDot: {
    borderRadius: 4,
    height: 8,
    marginTop: 5,
    width: 8,
  },
  caveatBox: {
    gap: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.25)',
    backgroundColor: 'rgba(255,214,10,0.08)',
    padding: 10,
  },
  inlineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
  },
  caveatText: {
    color: 'rgba(255,255,255,0.70)',
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  evidenceHead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  scoreBox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.42)',
    backgroundColor: 'rgba(0,198,176,0.14)',
    minWidth: 58,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  scoreValue: {
    color: '#00C6B0',
    fontSize: 21,
    fontWeight: '900',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  reasonChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.28)',
    backgroundColor: 'rgba(0,198,176,0.10)',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reasonText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 10.5,
    fontWeight: '700',
    maxWidth: 265,
  },
  microLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sourceRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 9,
  },
  sourceTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  sourceBlock: {
    gap: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    padding: 10,
  },
  sourceBlockTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineRail: {
    alignItems: 'center',
    width: 18,
  },
  timelineDot: {
    borderRadius: 5,
    height: 10,
    marginTop: 4,
    width: 10,
  },
  timelineLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  compSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  compRow: {
    gap: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  compRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  compAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  compCaveatBox: {
    gap: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,214,10,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  compFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  aiCommentaryBox: {
    gap: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(123,175,212,0.28)',
    backgroundColor: 'rgba(123,175,212,0.07)',
    padding: 11,
    marginTop: 6,
  },
  aiCommentaryLabel: {
    color: '#7BAFD4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  compEstimateRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  compEstimateValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  compEstimateRange: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(123,175,212,0.32)',
    backgroundColor: 'rgba(123,175,212,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceText: {
    color: '#7BAFD4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
