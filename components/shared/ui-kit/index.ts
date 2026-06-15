// ── UI-KIT BARREL ─────────────────────────────────────────
// Tiny shared-primitive set used across deal-detail, Brand HQ,
// NIL Manager, Explore, and Open Deals. Anything screen-specific
// (LensChip, MetricTile, ApplicantRow, TrustBand, …) stays in
// the screen's own file — only stable, repeated primitives live
// here.

export { Avatar } from './avatar';
export type { AvatarProps, AvatarSize, AvatarStatus } from './avatar';
export { DataRow } from './data-row';
export type { DataRowProps, DataRowTone } from './data-row';
export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';
export { HeroHeader } from './hero-header';
export type { HeroHeaderProps } from './hero-header';
export { InlineMeter } from './inline-meter';
export type { InlineMeterProps, InlineMeterSize, InlineMeterTone } from './inline-meter';
export { KpiTile } from './kpi-tile';
export type { KpiDelta, KpiTileProps, KpiTileSize, KpiTileTone } from './kpi-tile';
export { MetricGroup } from './metric-group';
export type { MetricGroupItem, MetricGroupProps } from './metric-group';
export { MoneyDelta } from './money-delta';
export type { MoneyDeltaProps, MoneyDeltaSize } from './money-delta';
export { RoleChip } from './role-chip';
export type { RoleChipProps, RoleChipSize, RoleChipVariant } from './role-chip';
export { Skeleton } from './skeleton';
export type { SkeletonProps, SkeletonVariant } from './skeleton';
export { SectionCard } from './section-card';
export type { SectionCardProps } from './section-card';
export { Sparkline } from './sparkline';
export type { SparklineProps } from './sparkline';
export { StatPill } from './stat-pill';
export type { StatPillProps, StatPillSize } from './stat-pill';
export { StatusPill } from './status-pill';
export type { StatusPillProps, StatusPillSize } from './status-pill';
export { PipelineChip, PIPELINE_LABEL } from './pipeline-chip';
export type { PipelineChipProps, PipelineStage } from './pipeline-chip';
export { PipelineStageBar, PipelineStageBarMini, PIPELINE_STAGE_ORDER } from './pipeline-stage-bar';
export type {
  PipelineStageBarProps,
  PipelineStageBarMiniProps,
} from './pipeline-stage-bar';
export { ComplianceTrackChip, TRACK_LABEL } from './compliance-track-chip';
export type {
  ComplianceTrackChipProps,
  ComplianceTrackKey,
  ComplianceTrackState,
} from './compliance-track-chip';
export { ComplianceRing } from './compliance-ring';
export type { ComplianceRingProps, ComplianceRingState } from './compliance-ring';
export { DealRow } from './deal-row';
export type {
  DealRowProps,
  DealRowComplianceProps,
  DealRowComplianceState,
} from './deal-row';
export { FilterBar } from './filter-bar';
export type { FilterBarProps, FilterBarOption, FilterBarMode } from './filter-bar';
export { EmptyDealsState } from './empty-deals-state';
export type { EmptyDealsStateProps } from './empty-deals-state';
export { StageBandBackground, STAGE_TO_BAND } from './stage-band-background';
export type {
  StageBandBackgroundProps,
  StageBand,
  StageBandIntensity,
} from './stage-band-background';
export { EvidencePacketCard } from './evidence-packet-card';
export type {
  EvidencePacketCardProps,
  EvidencePacketCommitment,
  EvidencePacketSource,
  EvidenceCommitmentStatus,
} from './evidence-packet-card';
export { ConsentLevelChip } from './consent-level-chip';
export type { ConsentLevelChipProps, ConsentLevel } from './consent-level-chip';
export {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  TONE_COLOR,
} from './tokens';
export type { Tone } from './tokens';
