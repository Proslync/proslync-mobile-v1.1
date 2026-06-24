// ── MOCK AD AUDIT-DEFENSE RISK REPORT FIXTURE ────────────
// Hand-authored Sprint 3.10 fixture for `school:syracuse`. Every
// finding is tagged `synthetic` per `mock-deal-comps.ts` precedent.
// Replace with reviewer-approved sources before any external use.
//
// Money is integer cents (USD). House-v.-NCAA reference cap is the
// $20.5M/year/school figure published with the settlement (PLAN P4 /
// `lib/data/ncaa-cap-reference.ts` once that lands).

import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';
import type { RiskReport } from '@/lib/types/risk-report.types';

const NOW_ISO = '2026-05-10T00:00:00.000Z';

function syntheticSource(
  id: string,
  label: string,
  freshnessDays = 0,
  caveat?: string,
): ComparableDealSourceRef {
  return {
    id,
    label,
    kind: 'synthetic',
    retrievedAt: NOW_ISO,
    freshnessDays,
    caveat,
  };
}

const SYRACUSE_RISK_REPORT: RiskReport = {
  id: 'rr-syr-fy2026-h1',
  schoolId: 'school:syracuse',
  generatedAt: NOW_ISO,
  period: {
    start: '2025-07-01',
    end: '2026-01-01',
    label: 'FY 2025-26 H1',
  },
  overallSeverity: 'watch',
  houseCapContext: {
    fiscalYear: 'FY 2025-26',
    annualCap: { cents: 20_500_000_00, currency: 'USD' },
    capUsed: { cents: 15_780_000_00, currency: 'USD' },
    capRemaining: { cents: 4_720_000_00, currency: 'USD' },
    caveat:
      'Reference display only. The school is source-of-truth for cap usage; Proslync does not reconcile House-v.-NCAA disbursements.',
  },
  categories: [
    {
      category: 'allocation',
      severity: 'clear',
      summary:
        'Title IX / EADA allocation: 58% men\'s sports, 42% women\'s — within EADA reporting band.',
      reviewerState: 'approved',
      reviewerNote:
        'Approved by L. Whitcombe 2026-04-30 — ratios match the Q3 EADA filing.',
      evidenceRefs: [
        syntheticSource('src-rr-alloc-ref', 'EADA Q3 internal export'),
      ],
      findings: [
        {
          id: 'f-alloc-001',
          severity: 'clear',
          headline:
            'Per-gender split 58/42 within EADA equity band for cap-affected sports.',
          rationale:
            'Men\'s basketball + football account for 71% of cap-affected dollar volume; women\'s basketball + Olympic sports balance the remaining 29% within Title IX reporting tolerances.',
          recommendedAction:
            'No action — re-check at end of FY when football roster bonuses settle.',
          sources: [
            syntheticSource(
              'src-rr-alloc-001',
              'EADA-shaped allocation export',
              0,
              'Hand-authored for demo; replace with reviewer-approved EADA filing.',
            ),
          ],
        },
        {
          id: 'f-alloc-002',
          severity: 'clear',
          headline:
            'No single-sport concentration above 45% threshold flagged.',
          rationale:
            'Highest single-sport share: men\'s basketball at 38% — below the 45% policy threshold.',
          sources: [
            syntheticSource(
              'src-rr-alloc-002',
              'per-sport allocation snapshot',
            ),
          ],
        },
      ],
    },
    {
      category: 'associated-entity-cap-circumvention',
      severity: 'watch',
      summary:
        '2 deals with payor association status unverified pending Bylaw 22 receipts.',
      reviewerState: 'pending-review',
      evidenceRefs: [
        syntheticSource('src-rr-bylaw22-batch', 'Bylaw 22 receipt batch · in-flight'),
      ],
      findings: [
        {
          id: 'f-asc-001',
          severity: 'watch',
          headline:
            '2 brand payors show shared registered-agent overlap with active collective.',
          rationale:
            'Bylaw 22 association test inconclusive — registered-agent overlap does not auto-trigger circumvention but warrants the structured layering review before cap attribution.',
          relatedDealIds: ['d-2', 'd-3'],
          recommendedAction:
            'Request structured layering disclosure from both payors before period close.',
          sources: [
            syntheticSource(
              'src-rr-asc-001',
              'registered-agent overlap report',
              1,
              'Public Secretary-of-State cross-reference; not yet reviewer-confirmed.',
            ),
          ],
        },
      ],
    },
    {
      category: 'dispute-clawback',
      severity: 'flagged',
      summary:
        '1 high-value deal lacks signed disclosure attestation — escalate to school compliance.',
      reviewerState: 'pending-review',
      evidenceRefs: [
        syntheticSource('src-rr-disp-batch', 'Disclosure attestation queue'),
      ],
      findings: [
        {
          id: 'f-disp-001',
          severity: 'flagged',
          headline:
            'High-value endorsement (>$200K) missing signed athlete disclosure attestation past 14-day window.',
          rationale:
            'Without the signed attestation the deal is exposed to clawback under the school\'s NIL policy v2.4 §6.2 if the payor disputes downstream. Sits 3 days past the 14-day disclosure SLA.',
          relatedDealIds: ['d-1'],
          recommendedAction:
            'Escalate to L. Whitcombe; collect attestation or pause activation until signed.',
          sources: [
            syntheticSource(
              'src-rr-disp-001',
              'disclosure-SLA monitor',
              0,
              'Mocked SLA monitor; replace with the real disclosure-room export.',
            ),
          ],
        },
        {
          id: 'f-disp-002',
          severity: 'clear',
          headline: 'No active arbitration or settlement filings against the AD.',
          rationale:
            'Public docket scan returns 0 NIL-related filings naming Syracuse Athletics for the period.',
          sources: [
            syntheticSource(
              'src-rr-disp-002',
              'public-docket scan',
              2,
            ),
          ],
        },
      ],
    },
    {
      category: 'tampering-evidence',
      severity: 'clear',
      summary:
        'Tampering-evidence preservation: 0 retention gaps detected in current period.',
      reviewerState: 'approved',
      reviewerNote: 'Verified against the audit-log integrity hash 2026-04-30.',
      evidenceRefs: [
        syntheticSource(
          'src-rr-tamp-batch',
          'Audit-log integrity export',
        ),
      ],
      findings: [
        {
          id: 'f-tamp-001',
          severity: 'clear',
          headline:
            'All deal/disclosure events for the period have an unbroken audit-log hash chain.',
          rationale:
            'Daily hash-chain checks pass for every deal-state transition; 0 gaps, 0 reverted writes.',
          sources: [
            syntheticSource('src-rr-tamp-001', 'audit-log integrity report'),
          ],
        },
      ],
    },
    {
      category: 'source-freshness',
      severity: 'watch',
      summary:
        '3 of 12 source refs older than 30 days — refresh before external attestation.',
      reviewerState: 'auto-suggested',
      evidenceRefs: [
        syntheticSource('src-rr-fresh-batch', 'Source freshness rollup'),
      ],
      findings: [
        {
          id: 'f-fresh-001',
          severity: 'watch',
          headline:
            '3 source refs (EADA filing, registered-agent scan, prior-year cap baseline) exceed the 30-day freshness window.',
          rationale:
            'Reports older than 30 days should not anchor an external attestation. Refresh batch scheduled but not yet executed.',
          recommendedAction:
            'Run the source-freshness refresh job before sharing this report externally.',
          sources: [
            syntheticSource(
              'src-rr-fresh-001',
              'freshness scan',
              35,
              'Source freshness > 30d — this finding itself anchors on a stale baseline.',
            ),
          ],
        },
      ],
    },
  ],
  audit: {
    lastRefreshedAt: NOW_ISO,
    refreshedByActor: 'L. Whitcombe (compliance officer)',
    versionTag: 'rr-syr-fy2026-h1@v1',
  },
  caveats: [
    'Reviewer must approve every finding before any legal or external use.',
    'House-v.-NCAA cap figures are a reference display of the school\'s reported usage — Proslync does not reconcile cap disbursements.',
  ],
  attribution: {
    source: 'proslync-ad-audit-defense',
    note:
      'Hand-authored AD audit-defense rollup for Sprint 3.10. Replace findings + sources with reviewer-approved data before any external attestation.',
  },
};

// ── Duke risk report — alongside Syracuse for cross-school comparison ─
const DUKE_RISK_REPORT: RiskReport = {
  id: 'rr-duke-fy2026-h1',
  schoolId: 'school:duke',
  generatedAt: NOW_ISO,
  period: {
    start: '2025-07-01',
    end: '2026-01-01',
    label: 'FY 2025-26 H1',
  },
  overallSeverity: 'watch',
  houseCapContext: {
    fiscalYear: 'FY 2025-26',
    annualCap: { cents: 20_500_000_00, currency: 'USD' },
    capUsed: { cents: 17_240_000_00, currency: 'USD' },
    capRemaining: { cents: 3_260_000_00, currency: 'USD' },
    caveat:
      'Reference display only. Duke Athletics is source-of-truth for cap usage; Proslync does not reconcile House-v.-NCAA disbursements.',
  },
  categories: [
    {
      category: 'allocation',
      severity: 'clear',
      summary:
        'Title IX / EADA allocation: 56% men\'s sports, 44% women\'s — within EADA reporting band. Duke runs the women\'s side slightly higher than Syracuse.',
      reviewerState: 'approved',
      reviewerNote: 'Approved by D. Roach 2026-04-29 — ratios match the Q3 EADA filing.',
      evidenceRefs: [syntheticSource('src-rr-duke-alloc-ref', 'EADA Q3 internal export — Duke')],
      findings: [
        {
          id: 'f-duke-alloc-001',
          severity: 'clear',
          headline: 'Per-gender split 56/44 within EADA equity band.',
          rationale:
            'Men\'s basketball + football account for 68% of cap-affected dollar volume; women\'s basketball + Olympic sports balance the remaining 32%.',
          sources: [
            syntheticSource('src-rr-duke-alloc-001', 'EADA-shaped allocation export — Duke'),
          ],
        },
      ],
    },
    {
      category: 'associated-entity-cap-circumvention',
      severity: 'watch',
      summary:
        '1 deal (Cooper Flagg renewal) cleared AD pre-approval; no current payor association overlap detected in remaining portfolio.',
      reviewerState: 'pending-review',
      evidenceRefs: [syntheticSource('src-rr-duke-bylaw22', 'Bylaw 22 receipt batch — Duke')],
      findings: [
        {
          id: 'f-duke-asc-001',
          severity: 'watch',
          headline: 'Cooper Flagg signature renewal cleared AD pre-approval but secondary review pending.',
          rationale:
            'Bylaw 22 association test for the payor passed initial screen; AD-level secondary review still in queue.',
          relatedDealIds: ['d-6'],
          recommendedAction: 'Confirm AD-level secondary review before activation enters live stage.',
          sources: [syntheticSource('src-rr-duke-asc-001', 'AD pre-approval memo', 1)],
        },
      ],
    },
    {
      category: 'dispute-clawback',
      severity: 'clear',
      summary:
        'All Duke disclosures attested within the 14-day SLA. d-6 renewal queued for AD review.',
      reviewerState: 'approved',
      evidenceRefs: [syntheticSource('src-rr-duke-disp', 'Duke disclosure attestation queue')],
      findings: [
        {
          id: 'f-duke-disp-001',
          severity: 'clear',
          headline: 'No high-value deals lack signed disclosure attestation.',
          rationale:
            'All FY26 H1 Duke deals (d-6, d-7, d-10, d-20-Reyes) have attestations on file or are inside the SLA window.',
          sources: [syntheticSource('src-rr-duke-disp-001', 'disclosure-SLA monitor — Duke')],
        },
      ],
    },
    {
      category: 'tampering-evidence',
      severity: 'clear',
      summary:
        'Tampering-evidence preservation: 0 retention gaps detected; daily hash-chain checks pass.',
      reviewerState: 'approved',
      reviewerNote: 'Verified against the audit-log integrity hash 2026-04-29.',
      evidenceRefs: [syntheticSource('src-rr-duke-tamp-batch', 'Audit-log integrity export — Duke')],
      findings: [
        {
          id: 'f-duke-tamp-001',
          severity: 'clear',
          headline: 'All deal/disclosure events have unbroken audit-log hash chain.',
          rationale: 'Daily hash-chain checks pass; 0 gaps, 0 reverted writes.',
          sources: [syntheticSource('src-rr-duke-tamp-001', 'audit-log integrity report — Duke')],
        },
      ],
    },
    {
      category: 'source-freshness',
      severity: 'watch',
      summary: '4 of 14 source refs older than 30 days — Duke side has slightly more stale sources than Syracuse.',
      reviewerState: 'auto-suggested',
      evidenceRefs: [syntheticSource('src-rr-duke-fresh-batch', 'Source freshness rollup — Duke')],
      findings: [
        {
          id: 'f-duke-fresh-001',
          severity: 'watch',
          headline: '4 source refs (registered-agent scan, prior cap baseline, EADA priors, AD memo archive) exceed 30-day freshness.',
          rationale:
            'Reports older than 30 days should not anchor external attestation. Duke refresh batch scheduled for end of week.',
          recommendedAction: 'Run the source-freshness refresh job before sharing this report externally.',
          sources: [syntheticSource('src-rr-duke-fresh-001', 'freshness scan — Duke', 38)],
        },
      ],
    },
  ],
  audit: {
    lastRefreshedAt: NOW_ISO,
    refreshedByActor: 'D. Roach (compliance officer)',
    versionTag: 'rr-duke-fy2026-h1@v1',
  },
  caveats: [
    'Reviewer must approve every finding before any legal or external use.',
    'House-v.-NCAA cap figures are a reference display of the school\'s reported usage — Proslync does not reconcile cap disbursements.',
    'Duke report exists alongside Syracuse for cross-school AD-cockpit comparison.',
  ],
  attribution: {
    source: 'proslync-ad-audit-defense',
    note:
      'Hand-authored AD audit-defense rollup for Duke — Phase C parallel to the Syracuse rollup. Replace findings + sources with reviewer-approved data before any external attestation.',
  },
};

export const MOCK_RISK_REPORTS: Record<string, RiskReport> = {
  'school:syracuse': SYRACUSE_RISK_REPORT,
  'school:duke': DUKE_RISK_REPORT,
};

export function getMockRiskReport(schoolId: string): RiskReport | null {
  return MOCK_RISK_REPORTS[schoolId] ?? null;
}
