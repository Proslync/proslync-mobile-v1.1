import type {
  BrandDealCommitmentStatus,
  BrandDealDetail,
  BrandDealReviewStatus,
} from '@/lib/data/mock-brand-data';
import type { ProfileRole } from '@/lib/providers/role-provider';
import { TONE_COLOR } from '@/components/shared/ui-kit/tokens';

export type DealLensKey = 'brand' | 'athlete' | 'ad' | 'agent';
export type DealTone = 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export type DealLens = {
  key: DealLensKey;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  primaryMetric: string;
  primaryLabel: string;
  secondaryMetric: string;
  secondaryLabel: string;
  actionLabel: string;
  visibility: string;
  color: string;
  icon: 'briefcase-outline' | 'person-outline' | 'school-outline' | 'shield-checkmark-outline' | 'people-outline';
  checks: DealLensCheck[];
};

export type DealLensCheck = {
  id: string;
  label: string;
  note: string;
  tone: DealTone;
};

export type DealSpineStep = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: DealTone;
};

export type DealTimelineRow = {
  id: string;
  label: string;
  title: string;
  note: string;
  tone: DealTone;
};

export const DEAL_LENS_ORDER: DealLensKey[] = ['brand', 'athlete', 'ad', 'agent'];

export function roleToDealLens(role: ProfileRole): DealLensKey {
  if (role === 'brand') return 'brand';
  if (role === 'agent') return 'agent';
  if (role === 'school') return 'ad';
  // collective is the payer — same deal view as brand
  if (role === 'collective') return 'brand';
  return 'athlete';
}

export function formatDealStatus(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function splitAthleteContext(athlete: string): { athleteName: string; organization: string } {
  const [athleteName, organization] = athlete.split(' · ');
  return {
    athleteName: athleteName ?? athlete,
    organization: organization ?? 'School / roster',
  };
}

export function reviewTone(status: BrandDealReviewStatus): DealTone {
  if (status === 'cleared') return 'success';
  if (status === 'flagged') return 'danger';
  return 'warning';
}

export function commitmentTone(status: BrandDealCommitmentStatus): DealTone {
  if (status === 'done') return 'success';
  if (status === 'blocked') return 'danger';
  if (status === 'queued') return 'warning';
  return 'accent';
}

export function toneColor(tone: DealTone): string {
  // DealTone is a strict subset of ui-kit Tone; delegate so the spine,
  // brand HQ, and explore surface read from one map (Brand.signal-derived).
  return TONE_COLOR[tone];
}

export function buildDealLenses(detail: BrandDealDetail): Record<DealLensKey, DealLens> {
  const { athleteName, organization } = splitAthleteContext(detail.deal.athlete);
  const openCommitments = detail.commitments.filter((item) => item.status !== 'done').length;
  const reviewTracks = detail.aiCompliance.tracks.filter((track) => track.status !== 'cleared').length;
  const missingAttachments = detail.evidence.attachments.filter((item) => item.state !== 'attached').length;
  const sourceState = detail.evidence.confidence === 'high' ? 'High confidence' : 'Needs source review';

  return {
    brand: {
      key: 'brand',
      label: 'Brand',
      eyebrow: 'Brand HQ lens',
      title: `${detail.companyOverview.name} deal command`,
      summary:
        'Own the offer terms, budget, creative scope, human approval, and source packet before outbound action.',
      primaryMetric: detail.money.total,
      primaryLabel: 'Offer value',
      secondaryMetric: `${openCommitments}`,
      secondaryLabel: 'Open commitments',
      actionLabel: 'Approve next outbound step',
      visibility: 'Full brand packet: economics, contacts, commitments, evidence, and AI review.',
      color: '#EB621A',
      icon: 'briefcase-outline',
      checks: [
        {
          id: 'brand-budget',
          label: 'Budget separated',
          note: `${detail.money.guaranteed}; usage reserve tracked separately.`,
          tone: 'success',
        },
        {
          id: 'brand-approval',
          label: 'Human approval required',
          note: detail.aiCompliance.caveats[0] ?? 'AI review is advisory only.',
          tone: reviewTracks > 0 ? 'warning' : 'success',
        },
        {
          id: 'brand-evidence',
          label: 'Evidence packet',
          note: `${detail.evidence.matchScore} match score, ${sourceState.toLowerCase()}.`,
          tone: detail.evidence.confidence === 'high' ? 'success' : 'warning',
        },
      ],
    },
    athlete: {
      key: 'athlete',
      label: 'Athlete',
      eyebrow: 'Athlete lens',
      title: `${athleteName} obligations and rights`,
      summary:
        'See what is owed, when content proof is due, which usage rights are requested, and who can view the packet.',
      primaryMetric: detail.money.guaranteed,
      primaryLabel: 'Guaranteed',
      secondaryMetric: detail.deal.term,
      secondaryLabel: 'Term',
      actionLabel: 'Review obligations',
      visibility: 'Athlete view highlights commitments, compensation timing, rights, and reviewer caveats.',
      color: '#00C6B0',
      icon: 'person-outline',
      checks: [
        {
          id: 'athlete-payment',
          label: 'Payment timing',
          note: detail.money.paymentTiming,
          tone: 'accent',
        },
        {
          id: 'athlete-rights',
          label: 'Usage rights',
          note: detail.money.usageRights,
          tone: 'warning',
        },
        {
          id: 'athlete-proof',
          label: 'Proof packet',
          note: `${openCommitments} commitment${openCommitments === 1 ? '' : 's'} still need owner follow-up.`,
          tone: openCommitments > 0 ? 'warning' : 'success',
        },
      ],
    },
    ad: {
      key: 'ad',
      label: 'AD',
      eyebrow: 'AD audit lens',
      title: `${organization} audit-defense view`,
      summary:
        'Separate platform revenue, House cap context, school review state, and source caveats before reporting.',
      primaryMetric: formatDealStatus(detail.aiCompliance.status),
      primaryLabel: 'Compliance state',
      secondaryMetric: `${reviewTracks}`,
      secondaryLabel: 'Review tracks',
      actionLabel: 'Open audit packet',
      visibility: 'AD view is review-only: deal value, risk, evidence state, reviewer notes, and timeline.',
      color: '#7BAFD4',
      icon: 'school-outline',
      checks: [
        {
          id: 'ad-school',
          label: 'School review',
          note:
            detail.aiCompliance.tracks.find((track) => track.label === 'School compliance')?.note ??
            'School review track not attached.',
          tone: reviewTone(
            detail.aiCompliance.tracks.find((track) => track.label === 'School compliance')?.status ?? 'review',
          ),
        },
        {
          id: 'ad-sources',
          label: 'Source posture',
          note: `${missingAttachments} attachment${missingAttachments === 1 ? '' : 's'} not attached.`,
          tone: missingAttachments > 0 ? 'warning' : 'success',
        },
        {
          id: 'ad-rev-share',
          label: 'Revenue-share dependency',
          note: 'Ledger persistence is backend-owned; this screen only reserves the audit slot.',
          tone: 'muted',
        },
      ],
    },
    agent: {
      key: 'agent',
      label: 'Agent',
      eyebrow: 'Agent lens',
      title: `${athleteName} representation overview`,
      summary:
        'Track negotiated economics, athlete workload, usage rights, contacts, and blockers before signature.',
      primaryMetric: detail.money.performance,
      primaryLabel: 'Upside pool',
      secondaryMetric: detail.money.usageRights,
      secondaryLabel: 'Rights reserve',
      actionLabel: 'Prepare counter memo',
      visibility: 'Agent view emphasizes economics, workload, usage rights, and counterparty message lanes.',
      color: '#14B8A6',
      icon: 'people-outline',
      checks: [
        {
          id: 'agent-economics',
          label: 'Economics review',
          note: `${detail.money.total} total with ${detail.money.performance.toLowerCase()}.`,
          tone: 'accent',
        },
        {
          id: 'agent-workload',
          label: 'Workload window',
          note: detail.commitments[0]?.proof ?? 'Commitment proof is not attached.',
          tone: openCommitments > 0 ? 'warning' : 'success',
        },
        {
          id: 'agent-contact',
          label: 'Message lanes',
          note: `${detail.contacts.length} counterparties available for negotiation context.`,
          tone: 'success',
        },
      ],
    },
  };
}

export function buildDealSpineSteps(detail: BrandDealDetail): DealSpineStep[] {
  const openCommitments = detail.commitments.filter((item) => item.status !== 'done').length;
  const reviewTracks = detail.aiCompliance.tracks.filter((track) => track.status !== 'cleared').length;
  const sourceGaps = detail.evidence.attachments.filter((item) => item.state !== 'attached').length;

  return [
    {
      id: 'terms',
      label: 'Terms',
      value: detail.stage.label,
      note: detail.stage.description,
      tone: detail.deal.stage === 'live' || detail.deal.stage === 'signed' ? 'success' : 'accent',
    },
    {
      id: 'money',
      label: 'Money',
      value: detail.money.total,
      note: detail.money.paymentTiming,
      tone: 'accent',
    },
    {
      id: 'commitments',
      label: 'Commitments',
      value: `${openCommitments} open`,
      note: `${detail.commitments.length} obligations attached to the packet.`,
      tone: openCommitments > 0 ? 'warning' : 'success',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      value: formatDealStatus(detail.aiCompliance.status),
      note: `${reviewTracks} tracks still need reviewer attention.`,
      tone: reviewTone(detail.aiCompliance.status),
    },
    {
      id: 'evidence',
      label: 'Evidence',
      value: `${detail.evidence.matchScore}`,
      note: `${sourceGaps} source or attachment gaps remain.`,
      tone: sourceGaps > 0 ? 'warning' : 'success',
    },
  ];
}

export function buildDealTimeline(detail: BrandDealDetail): DealTimelineRow[] {
  return [
    {
      id: `${detail.id}-stage`,
      label: 'Stage',
      title: detail.stage.label,
      note: detail.stage.description,
      tone: detail.deal.stage === 'live' || detail.deal.stage === 'signed' ? 'success' : 'accent',
    },
    ...detail.commitments.map<DealTimelineRow>((commitment) => ({
      id: commitment.id,
      label: formatDealStatus(commitment.status),
      title: commitment.title,
      note: `${commitment.due} - ${commitment.owner}`,
      tone: commitmentTone(commitment.status),
    })),
    ...detail.evidence.attachments.map<DealTimelineRow>((attachment) => ({
      id: `${detail.id}-${attachment.label}`,
      label: formatDealStatus(attachment.state),
      title: attachment.label,
      note:
        attachment.state === 'attached'
          ? 'Attached to the current evidence packet.'
          : 'Backend persistence or reviewer upload still needs to attach this item.',
      tone: attachment.state === 'attached' ? 'success' : 'warning',
    })),
  ];
}
