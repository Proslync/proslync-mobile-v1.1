// ── ROLE DASHBOARD ────────────────────────────────────────
// Page-rescue Home adapter. Professional cockpits use Buyer Brief:
// header, one lead item, one quiet ribbon, one action stream.

import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyerBriefPage } from '@/components/page-rescue';
import { ApprovalQueueSummaryTile } from '@/components/school/approval-queue-summary-tile';
import { RevShareSummaryTile } from '@/components/school/rev-share-summary-tile';
import { RiskReportSummaryTile } from '@/components/school/risk-report-summary-tile';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRole, type ProfileRole } from '@/lib/providers/role-provider';
import type {
  BuyerBriefHero,
  BuyerBriefRibbonItem,
  BuyerBriefStreamItem,
  PageRescueIntent,
} from '@/lib/types/page-rescue.types';

import { AthleteHome } from './athlete-home';
import { ROLE_DASHBOARD_CONFIGS, type RoleDashboardConfig } from './role-dashboard-configs';

const IOS_TAB_BAR_CHROME = 49;

const ROLE_PRIMARY_TARGETS: Partial<Record<ProfileRole, string>> = {
  player: '/athlete/disclosures',
  agent: '/agent/pipeline',
  brand: '/brand/casting',
  coach: '/coach/nil-watch',
  school: '/school/rev-share',
  nilManager: '/school/approval-queue?focus=pending',
};

const ROLE_HERO_COPY: Record<ProfileRole, Omit<BuyerBriefHero, 'primaryAction'>> = {
  player: {
    eyebrow: 'Today’s priority',
    title: 'Nike brief needs acceptance',
    value: '3 today',
    summary:
      'Review the newest brand brief, confirm terms, and keep the disclosure packet clean before the window closes.',
    intent: 'attention',
    icon: 'document-text',
  },
  agent: {
    eyebrow: 'Roster decision',
    title: 'Exclusivity review is waiting',
    value: '1 review',
    summary:
      'One athlete offer needs a conflict check before it can move from inbound interest to negotiable terms.',
    intent: 'attention',
    icon: 'warning',
  },
  brand: {
    eyebrow: 'Campaign requiring action',
    title: 'Fall NIL push has applicants',
    value: '8 reviews',
    summary:
      'The next useful brand action is applicant review, not more campaign setup. Pick the fit and move it forward.',
    intent: 'attention',
    icon: 'megaphone',
  },
  coach: {
    eyebrow: 'Team risk watch',
    title: 'Two NIL items need staff awareness',
    value: '2 flags',
    summary:
      'Keep roster visibility tight without turning coaching staff into the compliance owner.',
    intent: 'attention',
    icon: 'warning',
  },
  school: {
    eyebrow: 'AD revenue desk',
    title: 'Rev-share ledger needs review',
    value: '$94K',
    summary:
      'Proslync platform fee, school-to-athlete House-cap share, and audit posture stay visually separate here.',
    intent: 'attention',
    icon: 'trending-up',
  },
  nilManager: {
    eyebrow: 'AD walk decision',
    title: 'Oldest disclosure is ready to clear',
    value: '1 gate',
    summary:
      'Review the NIL Go-shaped packet, confirm NCAA / school / ethics tracks, and write the approval trail.',
    intent: 'attention',
    icon: 'shield-checkmark',
  },
  fan: {
    eyebrow: 'Live follow',
    title: 'Your game feed is moving',
    value: '7 live',
    summary:
      'Fan mode keeps the feed lightweight while pro cockpits stay focused on buyer and workflow decisions.',
    intent: 'positive',
    icon: 'flame',
  },
};

export function RoleDashboard() {
  const router = useRouter();
  const { role } = useRole();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const config = ROLE_DASHBOARD_CONFIGS[role];
  const displayName = user?.firstName ?? user?.userName ?? config.name;
  const hero = React.useMemo(() => buildHero(role), [role]);
  const ribbon = React.useMemo(() => buildRibbon(config), [config]);
  const stream = React.useMemo(() => buildStream(role, config), [role, config]);
  const supportingContent = React.useMemo(() => buildSupportingContent(role), [role]);

  const pushRoute = React.useCallback(
    (targetRoute?: string) => {
      if (!targetRoute) return;
      router.push(targetRoute as never);
    },
    [router],
  );

  // Branch the athlete role into its Triad-mirrored AthleteHome below the
  // hooks block so the hook order stays stable across role swaps.
  if (role === 'player') {
    return <AthleteHome />;
  }

  return (
    <BuyerBriefPage
      roleLabel={config.contextLabel}
      contextLabel={config.greeting}
      displayName={displayName}
      hero={hero}
      supportingContent={supportingContent}
      ribbon={ribbon}
      streamLabel={streamLabelForRole(role, config.activityLabel)}
      stream={stream}
      topInset={insets.top}
      bottomInset={insets.bottom + IOS_TAB_BAR_CHROME}
      onPrimaryAction={pushRoute}
      onStreamItemPress={(item) => pushRoute(item.targetRoute)}
    />
  );
}

function buildSupportingContent(role: ProfileRole): React.ReactNode {
  if (role === 'school' || role === 'nilManager') {
    return (
      <>
        <RevShareSummaryTile />
        <ApprovalQueueSummaryTile />
        <RiskReportSummaryTile />
      </>
    );
  }
  return null;
}

function buildHero(role: ProfileRole): BuyerBriefHero {
  const copy = ROLE_HERO_COPY[role];
  const targetRoute = ROLE_PRIMARY_TARGETS[role];
  return {
    ...copy,
    primaryAction: targetRoute
      ? {
          label: primaryActionLabelForRole(role),
          targetRoute,
        }
      : undefined,
    secondaryAction: undefined,
  };
}

function buildRibbon(config: RoleDashboardConfig): BuyerBriefRibbonItem[] {
  return config.liveSignals.slice(0, 3).map((item) => ({
    label: item.label,
    value: item.value,
    intent: toneToIntent(item.tone),
  }));
}

function buildStream(
  role: ProfileRole,
  config: RoleDashboardConfig,
): BuyerBriefStreamItem[] {
  if (role === 'nilManager') {
    return [
      {
        id: 'nil-approval',
        title: 'Open approval queue',
        subtitle: 'Review the oldest pending disclosure with evidence attached.',
        timestamp: 'now',
        intent: 'attention',
        icon: 'document-text',
        targetRoute: '/school/approval-queue?focus=pending',
      },
      {
        id: 'nil-evidence',
        title: 'Disclosure packet ready',
        subtitle: 'NIL Go-shaped disclosure, school rule check, and ethics track.',
        timestamp: '3m',
        intent: 'neutral',
        icon: 'folder-open',
        targetRoute: '/school/approval-queue?focus=pending',
      },
      {
        id: 'nil-risk',
        title: 'Escalation requires note',
        subtitle: 'Jurisdictional conflict needs reviewer comment before approval.',
        timestamp: '34m',
        intent: 'critical',
        icon: 'warning',
        targetRoute: '/school/risk-report',
      },
    ];
  }

  if (role === 'school') {
    return [
      {
        id: 'ad-rev-share',
        title: 'Rev-share ledger posted',
        subtitle: 'Platform fee remains separate from House-cap athlete share.',
        timestamp: '12m',
        intent: 'attention',
        icon: 'trending-up',
        targetRoute: '/school/rev-share',
      },
      {
        id: 'ad-approval',
        title: 'Disclosure decision pending',
        subtitle: 'One approval item can prove compliance workflow and audit trail.',
        timestamp: '34m',
        intent: 'neutral',
        icon: 'document-attach',
        targetRoute: '/school/approval-queue?focus=pending',
      },
      {
        id: 'ad-risk',
        title: 'Audit-defense packet updated',
        subtitle: 'Risk report shows open flags and reviewer rationale.',
        timestamp: '2h',
        intent: 'neutral',
        icon: 'shield-checkmark',
        targetRoute: '/school/risk-report',
      },
    ];
  }

  return config.activity.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle ?? 'No follow-up needed',
    timestamp: item.time,
    intent: toneToIntent(item.tone),
    icon: item.icon,
  }));
}

function toneToIntent(tone?: string): PageRescueIntent {
  switch (tone) {
    case 'success':
      return 'positive';
    case 'warning':
      return 'attention';
    case 'danger':
      return 'critical';
    case 'accent':
      return 'attention';
    default:
      return 'neutral';
  }
}

function primaryActionLabelForRole(role: ProfileRole): string {
  switch (role) {
    case 'nilManager':
      return 'Open queue';
    case 'school':
      return 'Review ledger';
    case 'brand':
      return 'Review applicants';
    case 'player':
      return 'Review disclosure';
    case 'agent':
      return 'Open pipeline';
    case 'coach':
      return 'Open NIL watch';
    default:
      return 'Open brief';
  }
}

function streamLabelForRole(role: ProfileRole, fallback: string): string {
  if (role === 'nilManager') return 'AD WALK STREAM';
  if (role === 'school') return 'AD WALK SIGNALS';
  return fallback;
}
