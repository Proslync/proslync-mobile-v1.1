// ── AD AUDIT-DEFENSE RISK REPORT CARD ────────────────────
// Sprint 3.10 buyer-side governance surface. Renders inside the
// existing School view (Compliance sub-tab). Visual tokens match
// `deal-detail-spine` (radius 10, hairline borders, dark glass).
//
// PLAN anchors:
//   - §3.10  AD audit-defense risk report primitive
//   - P4     House-v.-NCAA cap context — reference display only

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  RiskCategory,
  RiskReport,
  RiskReportCategoryRollup,
  RiskReportReviewerState,
  RiskSeverity,
} from '@/lib/types/risk-report.types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Visual tokens match deal-detail-spine.
const ACCENT = '#EB621A';
const TEAL = '#00C6B0';
const VIOLET = '#C8A2FF';
const WARNING = '#FFD60A';
const DANGER = '#FF453A';
const LIGHT_BLUE = '#7BAFD4';

export function severityColor(severity: RiskSeverity): string {
  switch (severity) {
    case 'clear':
      return TEAL;
    case 'watch':
      return LIGHT_BLUE;
    case 'flagged':
      return WARNING;
    case 'critical':
      return DANGER;
  }
}

export function severityLabel(severity: RiskSeverity): string {
  switch (severity) {
    case 'clear':
      return 'Clear';
    case 'watch':
      return 'Watch';
    case 'flagged':
      return 'Flagged';
    case 'critical':
      return 'Critical';
  }
}

const REVIEWER_LABELS: Record<RiskReportReviewerState, string> = {
  'auto-suggested': 'Suggested',
  'pending-review': 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const REVIEWER_COLORS: Record<RiskReportReviewerState, string> = {
  'auto-suggested': 'rgba(255,255,255,0.55)',
  'pending-review': WARNING,
  approved: TEAL,
  rejected: DANGER,
};

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; icon: IconName }
> = {
  allocation: { label: 'Allocation', icon: 'pie-chart-outline' },
  'associated-entity-cap-circumvention': {
    label: 'Associated-entity / cap circumvention',
    icon: 'git-branch-outline',
  },
  'dispute-clawback': { label: 'Dispute / clawback', icon: 'shield-half-outline' },
  'tampering-evidence': {
    label: 'Tampering-evidence preservation',
    icon: 'lock-closed-outline',
  },
  'source-freshness': {
    label: 'Source freshness',
    icon: 'time-outline',
  },
};

export const CATEGORY_ORDER: RiskCategory[] = [
  'allocation',
  'associated-entity-cap-circumvention',
  'dispute-clawback',
  'tampering-evidence',
  'source-freshness',
];

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    const value = dollars / 1_000_000;
    const formatted = value >= 10 ? value.toFixed(1) : value.toFixed(2);
    return `$${formatted.replace(/\.?0+$/, '')}M`;
  }
  if (dollars >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatRefreshedAt(iso: string): string {
  // e.g. 2026-05-10
  return iso.slice(0, 10);
}

/**
 * The attribution.source field is an internal slug
 * (e.g. "proslync-ad-audit-defense"). Render a human attribution so the
 * reviewer footer reads as a product name, not a code identifier.
 */
function humanizeAttribution(source: string): string {
  const KNOWN: Record<string, string> = {
    'proslync-ad-audit-defense': 'Proslync Audit Defense',
  };
  if (KNOWN[source]) return KNOWN[source];
  // Fallback: title-case the slug so any future source still reads clean.
  return source
    .split('-')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

type RiskReportCardProps = {
  report: RiskReport;
  /** Tapping the hero or a category row routes to the full screen. */
  onPressHero?: () => void;
  onPressCategory?: (category: RiskCategory) => void;
  /** Hides the "tap to expand" affordance when the card is the route itself. */
  compact?: boolean;
};

export function RiskReportCard({
  report,
  onPressHero,
  onPressCategory,
  compact = true,
}: RiskReportCardProps) {
  const sortedCategories = React.useMemo(() => {
    const byKey = new Map(report.categories.map((c) => [c.category, c]));
    return CATEGORY_ORDER.map((key) => byKey.get(key)).filter(
      (c): c is RiskReportCategoryRollup => Boolean(c),
    );
  }, [report.categories]);

  return (
    <View style={styles.card}>
      <HeroBlock report={report} onPress={onPressHero} compact={compact} />

      <CapTracker report={report} />

      <View style={styles.kicker}>
        <Text style={styles.kickerText}>Audit-defense categories</Text>
      </View>

      <View style={styles.categoryStack}>
        {sortedCategories.map((rollup) => (
          <CategoryRow
            key={rollup.category}
            rollup={rollup}
            onPress={onPressCategory ? () => onPressCategory(rollup.category) : undefined}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerSourceRow}>
          <Ionicons name="document-text-outline" size={12} color="rgba(255,255,255,0.55)" />
          <Text style={styles.footerSourceText} numberOfLines={2}>
            Source: {humanizeAttribution(report.attribution.source)}
            {report.attribution.schemaLicense
              ? ` · ${report.attribution.schemaLicense}`
              : ''}
          </Text>
        </View>
        <View style={styles.caveatBox}>
          <View style={styles.inlineRow}>
            <Ionicons name="warning-outline" size={13} color={WARNING} />
            <Text style={styles.caveatText}>
              Reviewer must approve before legal use.
            </Text>
          </View>
          {report.caveats.map((caveat) => (
            <View key={caveat} style={styles.inlineRow}>
              <Ionicons name="ellipse-outline" size={10} color="rgba(255,255,255,0.45)" />
              <Text style={styles.caveatText}>{caveat}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function HeroBlock({
  report,
  onPress,
  compact,
}: {
  report: RiskReport;
  onPress?: () => void;
  compact: boolean;
}) {
  const color = severityColor(report.overallSeverity);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.hero}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Open full risk report' : undefined}
    >
      <View style={styles.heroHeadRow}>
        <View style={styles.heroEyebrowCol}>
          <Text style={styles.heroEyebrow}>AD audit-defense</Text>
          <Text style={styles.heroTitle}>Risk Report</Text>
          <Text style={styles.heroMeta}>
            {report.period.label} · refreshed {formatRefreshedAt(report.audit.lastRefreshedAt)}
          </Text>
        </View>
        <View
          style={[
            styles.severityPill,
            { borderColor: `${color}66`, backgroundColor: `${color}1f` },
          ]}
        >
          <View style={[styles.severityDot, { backgroundColor: color }]} />
          <Text style={[styles.severityPillText, { color }]}>
            {severityLabel(report.overallSeverity)}
          </Text>
        </View>
      </View>
      {compact && onPress ? (
        <View style={styles.heroFootRow}>
          <Text style={styles.heroFootHint}>Tap to open full report</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.45)" />
        </View>
      ) : null}
    </Pressable>
  );
}

function CapTracker({ report }: { report: RiskReport }) {
  const { houseCapContext } = report;
  const usedCents = houseCapContext.capUsed.cents;
  const capCents = houseCapContext.annualCap.cents;
  const pct = Math.min(1, capCents > 0 ? usedCents / capCents : 0);
  return (
    <View style={styles.capBlock}>
      <View style={styles.capHeadRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.capEyebrow}>House-v.-NCAA cap · reference</Text>
          <Text style={styles.capTitle}>{houseCapContext.fiscalYear}</Text>
        </View>
        <Text style={styles.capPct}>{Math.round(pct * 100)}%</Text>
      </View>

      <View style={styles.capBarTrack}>
        <View style={[styles.capBarFill, { width: `${pct * 100}%` }]} />
      </View>

      <View style={styles.capLegendRow}>
        <View style={styles.capLegendCol}>
          <Text style={styles.capLegendLabel}>Used</Text>
          <Text style={styles.capLegendValue}>
            {formatMoney(houseCapContext.capUsed.cents)}
          </Text>
        </View>
        <View style={styles.capLegendCol}>
          <Text style={styles.capLegendLabel}>Cap</Text>
          <Text style={styles.capLegendValue}>
            {formatMoney(houseCapContext.annualCap.cents)}
          </Text>
        </View>
        <View style={styles.capLegendCol}>
          <Text style={styles.capLegendLabel}>Remaining</Text>
          <Text style={[styles.capLegendValue, { color: TEAL }]}>
            {formatMoney(houseCapContext.capRemaining.cents)}
          </Text>
        </View>
      </View>

      <View style={styles.capSeparationBox}>
        <View style={styles.capSeparationRow}>
          <View style={[styles.capSeparationDot, { backgroundColor: ACCENT }]} />
          <Text style={styles.capSeparationLabel}>Proslync ↔ AD rev-share</Text>
          <Text style={styles.capSeparationNote}>
            Platform fee (separate · not capped)
          </Text>
        </View>
        <View style={styles.capSeparationRow}>
          <View style={[styles.capSeparationDot, { backgroundColor: VIOLET }]} />
          <Text style={styles.capSeparationLabel}>School ↔ athlete rev-share</Text>
          <Text style={styles.capSeparationNote}>
            House-v.-NCAA cap above
          </Text>
        </View>
      </View>

      {houseCapContext.caveat ? (
        <View style={styles.capCaveat}>
          <Ionicons name="information-circle-outline" size={13} color={LIGHT_BLUE} />
          <Text style={styles.capCaveatText}>{houseCapContext.caveat}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CategoryRow({
  rollup,
  onPress,
}: {
  rollup: RiskReportCategoryRollup;
  onPress?: () => void;
}) {
  const meta = CATEGORY_META[rollup.category];
  const sevColor = severityColor(rollup.severity);
  const reviewerColor = REVIEWER_COLORS[rollup.reviewerState];
  const firstFinding = rollup.findings[0];

  return (
    <Pressable
      style={styles.categoryRow}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${meta.label} — severity ${severityLabel(rollup.severity)}`}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={meta.icon} size={15} color="rgba(255,255,255,0.78)" />
      </View>
      <View style={styles.categoryBody}>
        <View style={styles.categoryHeadRow}>
          <Text style={styles.categoryLabel} numberOfLines={1}>
            {meta.label}
          </Text>
          <View style={styles.categoryHeadRight}>
            <View style={[styles.severityDotSmall, { backgroundColor: sevColor }]} />
            <Text style={[styles.categorySeverityText, { color: sevColor }]}>
              {severityLabel(rollup.severity)}
            </Text>
          </View>
        </View>
        <Text style={styles.categorySummary} numberOfLines={2}>
          {rollup.summary}
        </Text>
        <View style={styles.categoryMetaRow}>
          <Text style={styles.categoryFindingCount}>
            {rollup.findings.length} finding{rollup.findings.length === 1 ? '' : 's'}
          </Text>
          <View
            style={[
              styles.reviewerPill,
              {
                borderColor: `${reviewerColor}55`,
                backgroundColor: `${reviewerColor}14`,
              },
            ]}
          >
            <Text style={[styles.reviewerPillText, { color: reviewerColor }]}>
              {REVIEWER_LABELS[rollup.reviewerState]}
            </Text>
          </View>
        </View>
        {firstFinding ? (
          <Text style={styles.categoryFirstRationale} numberOfLines={2}>
            {firstFinding.rationale}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 14,
  },

  // Hero
  hero: {
    gap: 8,
  },
  heroHeadRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroEyebrowCol: {
    flex: 1,
    gap: 3,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
  severityPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  severityPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  severityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  severityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroFootRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  heroFootHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
  },

  // Cap tracker
  capBlock: {
    gap: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 12,
  },
  capHeadRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  capEyebrow: {
    color: 'rgba(200,162,255,0.85)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  capTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  capPct: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  capBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  capBarFill: {
    height: '100%',
    backgroundColor: VIOLET,
    borderRadius: 3,
  },
  capLegendRow: {
    flexDirection: 'row',
    gap: 10,
  },
  capLegendCol: {
    flex: 1,
  },
  capLegendLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  capLegendValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  capSeparationBox: {
    gap: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  capSeparationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capSeparationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capSeparationLabel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  capSeparationNote: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  capCaveat: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  capCaveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    lineHeight: 14,
  },

  // Categories
  kicker: {
    marginTop: 2,
  },
  kickerText: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  categoryStack: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.16)',
    padding: 11,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 1,
  },
  categoryBody: {
    flex: 1,
    gap: 4,
  },
  categoryHeadRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  categoryLabel: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 12.5,
    fontWeight: '900',
  },
  categoryHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categorySeverityText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  categorySummary: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  categoryFindingCount: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '800',
  },
  reviewerPill: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reviewerPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  categoryFirstRationale: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  // Footer
  footer: {
    gap: 8,
    marginTop: 2,
  },
  footerSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerSourceText: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '700',
  },
  caveatBox: {
    gap: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.25)',
    backgroundColor: 'rgba(255,214,10,0.06)',
    padding: 10,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  caveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 15,
  },
});
