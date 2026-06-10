// ── AD AUDIT-DEFENSE RISK REPORT ROUTE ───────────────────
// Sprint 3.10 full-screen route. Renders the RiskReportCard
// expanded with full per-category finding lists. Reached from
// the School view → Compliance sub-tab → Risk Report card.
//
// Deep link: status:///school/risk-report (or ?schoolId=...).

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import {
  CATEGORY_ORDER,
  RiskReportCard,
  severityColor,
  severityLabel,
} from '@/components/school/risk-report-card';
import { useRiskReport } from '@/hooks/use-risk-report';
import type {
  RiskCategory,
  RiskReportCategoryRollup,
  RiskReportFinding,
  RiskReportReviewerState,
} from '@/lib/types/risk-report.types';

const TEAL = '#00C6B0';

const REVIEWER_LABELS: Record<RiskReportReviewerState, string> = {
  'auto-suggested': 'Suggested',
  'pending-review': 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  allocation: 'Allocation',
  'associated-entity-cap-circumvention': 'Associated-entity / cap circumvention',
  'dispute-clawback': 'Dispute / clawback',
  'tampering-evidence': 'Tampering-evidence preservation',
  'source-freshness': 'Source freshness',
};

export default function RiskReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ schoolId?: string; focus?: string }>();
  const schoolId = params.schoolId ?? 'school:syracuse';
  const focusCategory = (params.focus as RiskCategory | undefined) ?? null;

  const { data: report, isLoading } = useRiskReport(schoolId);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : !report ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={26} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyTitle}>No risk report available</Text>
            <Text style={styles.emptyBody}>
              No audit-defense rollup exists for {schoolId}. Once compliance
              data lands the report will populate here.
            </Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(320)}>
              <RiskReportCard report={report} compact={false} />
            </Animated.View>

            {CATEGORY_ORDER.map((category, idx) => {
              const rollup = report.categories.find((c) => c.category === category);
              if (!rollup) return null;
              return (
                <Animated.View
                  key={category}
                  entering={FadeInDown.delay(60 + idx * 40).duration(320)}
                >
                  <CategoryDetailSection
                    rollup={rollup}
                    initiallyExpanded={focusCategory === category}
                  />
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CategoryDetailSection({
  rollup,
  initiallyExpanded,
}: {
  rollup: RiskReportCategoryRollup;
  initiallyExpanded: boolean;
}) {
  const [expanded, setExpanded] = React.useState(initiallyExpanded);
  const sevColor = severityColor(rollup.severity);

  return (
    <View style={styles.detailCard}>
      <Pressable
        style={styles.detailHead}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${CATEGORY_LABELS[rollup.category]} — ${severityLabel(rollup.severity)}`}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.detailEyebrow}>{CATEGORY_LABELS[rollup.category]}</Text>
          <Text style={styles.detailSummary}>{rollup.summary}</Text>
          <View style={styles.detailMetaRow}>
            <View style={[styles.sevPill, { borderColor: `${sevColor}55`, backgroundColor: `${sevColor}1a` }]}>
              <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
              <Text style={[styles.sevPillText, { color: sevColor }]}>
                {severityLabel(rollup.severity)}
              </Text>
            </View>
            <Text style={styles.detailFindingCount}>
              {rollup.findings.length} finding{rollup.findings.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.detailReviewer}>
              {REVIEWER_LABELS[rollup.reviewerState]}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(255,255,255,0.5)"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.findingStack}>
          {rollup.findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
          {rollup.reviewerNote ? (
            <View style={styles.noteBox}>
              <Ionicons name="chatbubble-outline" size={12} color={TEAL} />
              <Text style={styles.noteText}>Reviewer note: {rollup.reviewerNote}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function FindingRow({ finding }: { finding: RiskReportFinding }) {
  const sevColor = severityColor(finding.severity);
  return (
    <View style={styles.findingRow}>
      <View style={styles.findingHead}>
        <View style={[styles.findingDot, { backgroundColor: sevColor }]} />
        <Text style={styles.findingHeadline} numberOfLines={3}>
          {finding.headline}
        </Text>
      </View>
      <Text style={styles.findingRationale}>{finding.rationale}</Text>

      {finding.recommendedAction ? (
        <View style={styles.recBox}>
          <Ionicons name="arrow-forward-circle-outline" size={13} color={TEAL} />
          <Text style={styles.recText}>{finding.recommendedAction}</Text>
        </View>
      ) : null}

      {(finding.relatedDealIds?.length ?? 0) > 0 ||
      (finding.relatedAthleteIds?.length ?? 0) > 0 ||
      (finding.relatedEntityIds?.length ?? 0) > 0 ? (
        <View style={styles.relatedRow}>
          {finding.relatedDealIds?.map((id) => (
            <RelatedChip key={`d-${id}`} icon="briefcase-outline" label={id} />
          ))}
          {finding.relatedAthleteIds?.map((id) => (
            <RelatedChip key={`a-${id}`} icon="person-outline" label={id} />
          ))}
          {finding.relatedEntityIds?.map((id) => (
            <RelatedChip key={`e-${id}`} icon="business-outline" label={id} />
          ))}
        </View>
      ) : null}

      <View style={styles.sourceList}>
        {finding.sources.map((source) => (
          <View key={source.id} style={styles.sourceRow}>
            <Ionicons name="document-text-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.sourceText} numberOfLines={2}>
              {source.label} · {source.kind} · {formatFreshness(source.freshnessDays)}
              {source.caveat ? ` — ${source.caveat}` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RelatedChip({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={styles.relatedChip}>
      <Ionicons name={icon} size={10} color="rgba(255,255,255,0.6)" />
      <Text style={styles.relatedChipText}>{label}</Text>
    </View>
  );
}

function formatFreshness(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months <= 1 ? '1mo ago' : `${months}mo ago`;
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
    gap: 8,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  loadingBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyBox: {
    gap: 8,
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 17,
  },

  detailCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    overflow: 'hidden',
  },
  detailHead: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    alignItems: 'flex-start',
  },
  detailEyebrow: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  detailSummary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sevPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sevDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailFindingCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    fontWeight: '800',
  },
  detailReviewer: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  findingStack: {
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  findingRow: {
    gap: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 11,
  },
  findingHead: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  findingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  findingHeadline: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  findingRationale: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  recBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    borderRadius: 6,
    backgroundColor: 'rgba(0,198,176,0.08)',
    padding: 8,
  },
  recText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11.5,
    lineHeight: 15,
  },
  relatedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  relatedChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  sourceList: {
    gap: 4,
    marginTop: 2,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  sourceText: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    lineHeight: 14,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.25)',
    backgroundColor: 'rgba(0,198,176,0.06)',
    padding: 9,
  },
  noteText: {
    flex: 1,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    lineHeight: 15,
  },
});

