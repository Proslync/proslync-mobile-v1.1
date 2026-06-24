// ── MOCK OPEN-DEAL FIXTURES ───────────────────────────────
// Sprint 2.3 (PLAN §5 — open-deal posting + apply/rank flow).
//
// Hand-authored OpenDeals for the Nike Hoops brand (anchored on
// `BRAND_PROFILE`). Every row is tagged with `source.kind = 'synthetic'`
// per the precedent in `mock-deal-comps.ts` — these are demo fixtures,
// not real disclosed deals. Once Q17 (PLAN §9) clears we'll swap to the
// backend `/api/open-deals` endpoint.
//
// Applicants reference the existing athletes in `BRAND_ATHLETES`
// (ids `a-1` … `a-7`). Status enum is the buyer-surface alias set
// (`draft | live | reviewing | awarded | closed`).
//
// All money is integer cents (USD) — matches `MoneyAmount`.

import type {
  OpenDealApplication,
  OpenDealSurfaceRecord,
} from '@/lib/types/open-deal.types';

import { BRAND_ATHLETES, BRAND_PROFILE } from './mock-brand-data';

const BRAND_ID = 'brand-puma-hoops';
const BRAND_LABEL = BRAND_PROFILE.name;
const NOW_ISO = '2026-05-10T00:00:00.000Z';

const SYNTHETIC_CAVEAT =
  'Synthetic fixture for the Proslync demo. Replace with reviewer-approved post before publishing.';

/**
 * Pre-canned pitches / asks per athlete. Realistic but obviously
 * synthetic — keep deltas between athletes visible so the AI ranking
 * surface has a non-trivial pool to sort.
 */
function applicantFor(
  openDealId: string,
  athleteId: string,
  pitch: string,
  askCents: number,
  proposedDeliverables: string[],
  appliedDaysAgo: number,
  workloadWindow: string,
): OpenDealApplication {
  const appliedAt = new Date(
    Date.parse(NOW_ISO) - appliedDaysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return {
    id: `app-${openDealId}-${athleteId}`,
    openDealId,
    athleteId,
    status: 'submitted',
    pitchMarkdown: pitch,
    proposedDeliverables,
    askCents,
    workloadWindow,
    appliedAt,
  };
}

export const MOCK_OPEN_DEALS: OpenDealSurfaceRecord[] = [
  {
    deal: {
      id: 'od-1',
      brandId: BRAND_ID,
      title: 'Signature Capsule — Lead Guard Spotlight',
      category: 'endorsement',
      nilCategory: 'endorsement',
      briefMarkdown:
        'Two-year exclusive endorsement for a top-25 PG. Signature colorway + summer EYBL appearance tour. Brand pays for travel, creative team handles capsule launch reel. Strong fit if you have DMV/ATL reach and clean off-court presence.',
      budgetMinCents: 280_000_00,
      budgetMaxCents: 420_000_00,
      exclusivityRequired: true,
      applicationOpensAt: '2026-04-22T00:00:00.000Z',
      applicationClosesAt: '2026-05-22T23:59:59.000Z',
      status: 'live',
      selectionPolicy: 'ai-ranked-shortlist',
      desiredAttributes: {
        sports: ['Basketball'],
        classYears: ['Fr', 'So'],
        minFollowerCount: 250_000,
      },
      applicationCount: 6,
      createdAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z',
    },
    brandLabel: BRAND_LABEL,
    budget: {
      low: { cents: 280_000_00, currency: 'USD' },
      high: { cents: 420_000_00, currency: 'USD' },
    },
    slots: 1,
    postedAt: '2026-04-22T00:00:00.000Z',
    deadline: '2026-05-22T23:59:59.000Z',
    disclosureModes: ['on-screen', 'caption'],
    fundingSource: 'brand-direct',
    source: {
      kind: 'synthetic',
      label: 'Proslync deal registry',
      caveat: SYNTHETIC_CAVEAT,
    },
    applicants: [
      applicantFor(
        'od-1',
        'a-1',
        'Three-year Syracuse PG with 1.2M cross-platform. EYBL roots in DMV. Ready to anchor the capsule + summer tour.',
        380_000_00,
        ['Signature colorway reveal reel', 'EYBL camp appearance', '2 Instagram drop posts'],
        2,
        'in-season',
      ),
      applicantFor(
        'od-1',
        'a-5',
        'Rutgers freshman, top-3 ranked PG, 910K reach. Open to exclusive — strong NIL Go disclosure record.',
        410_000_00,
        ['Capsule launch reel', '4 short-video edits', 'EYBL camp appearance'],
        3,
        'off-season',
      ),
      applicantFor(
        'od-1',
        'a-7',
        'GT sophomore PG; smaller audience (180K) but ACC reach. Willing to commit to exclusive for under-band budget.',
        220_000_00,
        ['2 short-video edits', '1 capsule story drop'],
        5,
        'in-season',
      ),
      applicantFor(
        'od-1',
        'a-4',
        'Syracuse SG (290K). Position drift OK if capsule framing flexes — pitching as combo guard.',
        260_000_00,
        ['Capsule launch reel', 'EYBL appearance'],
        6,
        'in-season',
      ),
      applicantFor(
        'od-1',
        'a-2',
        'Paul VI senior; SG fit, but EYBL pedigree + 480K reach offsets. Already Nike-aligned.',
        300_000_00,
        ['Capsule reveal reel', '2 short-video edits', 'EYBL appearance'],
        7,
        'off-season',
      ),
      applicantFor(
        'od-1',
        'a-6',
        'Rutgers F (top-10). Off-position pitch — would explore F-led capsule extension.',
        340_000_00,
        ['Capsule launch reel', '1 short-video edit'],
        8,
        'off-season',
      ),
    ],
  },
  {
    deal: {
      id: 'od-2',
      brandId: BRAND_ID,
      title: 'EYBL Weekend Affiliate Push',
      category: 'affiliate',
      nilCategory: 'affiliate',
      briefMarkdown:
        'Non-exclusive affiliate program for the August EYBL weekend. Trackable shop link, on-screen FTC disclosure required. Brand provides product samples and creator marketplace access. Open to 4 slots.',
      budgetMinCents: 15_000_00,
      budgetMaxCents: 45_000_00,
      exclusivityRequired: false,
      applicationOpensAt: '2026-05-01T00:00:00.000Z',
      applicationClosesAt: '2026-06-15T23:59:59.000Z',
      status: 'live',
      selectionPolicy: 'shortlist-then-pick',
      desiredAttributes: {
        sports: ['Basketball'],
        minFollowerCount: 100_000,
      },
      applicationCount: 5,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z',
    },
    brandLabel: BRAND_LABEL,
    budget: {
      low: { cents: 15_000_00, currency: 'USD' },
      high: { cents: 45_000_00, currency: 'USD' },
    },
    slots: 4,
    postedAt: '2026-05-01T00:00:00.000Z',
    deadline: '2026-06-15T23:59:59.000Z',
    disclosureModes: ['on-screen', 'caption', 'platform-tool'],
    fundingSource: 'affiliate-commission',
    source: {
      kind: 'synthetic',
      label: 'Proslync deal registry',
      caveat: SYNTHETIC_CAVEAT,
    },
    applicants: [
      applicantFor(
        'od-2',
        'a-2',
        'Paul VI SG; 480K, strong short-video output. Will run 3 affiliate edits with tracking URL.',
        35_000_00,
        ['3 short-video edits', 'Story tag rotation'],
        4,
        'off-season',
      ),
      applicantFor(
        'od-2',
        'a-4',
        'JJ Starling — 290K Syracuse audience, EYBL-aligned. Comfortable with on-screen FTC disclosure.',
        22_000_00,
        ['2 short-video edits', '1 livestream try-on'],
        5,
        'in-season',
      ),
      applicantFor(
        'od-2',
        'a-7',
        'GT PG, smaller reach (180K) but on-screen disclosure consistently clean.',
        18_000_00,
        ['2 short-video edits'],
        6,
        'in-season',
      ),
      applicantFor(
        'od-2',
        'a-3',
        'Cooper Flagg — 3.1M. Premium ask, would expect headline slot.',
        45_000_00,
        ['1 short-video edit', 'Story tag'],
        7,
        'in-season',
      ),
      applicantFor(
        'od-2',
        'a-1',
        'Syracuse PG; running a parallel capsule application but open to a small affiliate.',
        30_000_00,
        ['2 short-video edits'],
        9,
        'in-season',
      ),
    ],
  },
  {
    deal: {
      id: 'od-3',
      brandId: BRAND_ID,
      title: 'McDonald\'s All-American Appearance Series',
      category: 'appearance',
      nilCategory: 'appearance',
      briefMarkdown:
        'Single-event appearance + post-event content rights. Brand books the travel and venue, athlete delivers a 90-minute meet-and-greet + 2 content pieces. Reviewing applicants now; window closed last Friday.',
      budgetMinCents: 25_000_00,
      budgetMaxCents: 60_000_00,
      exclusivityRequired: false,
      applicationOpensAt: '2026-03-15T00:00:00.000Z',
      applicationClosesAt: '2026-05-02T23:59:59.000Z',
      status: 'reviewing',
      selectionPolicy: 'ai-ranked-shortlist',
      desiredAttributes: {
        sports: ['Basketball'],
        classYears: ['Sr', 'Fr'],
      },
      applicationCount: 5,
      createdAt: '2026-03-15T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z',
    },
    brandLabel: BRAND_LABEL,
    budget: {
      low: { cents: 25_000_00, currency: 'USD' },
      high: { cents: 60_000_00, currency: 'USD' },
    },
    slots: 2,
    postedAt: '2026-03-15T00:00:00.000Z',
    deadline: '2026-05-02T23:59:59.000Z',
    disclosureModes: ['on-screen', 'verbal'],
    fundingSource: 'appearance-fee',
    source: {
      kind: 'synthetic',
      label: 'Proslync deal registry',
      caveat: SYNTHETIC_CAVEAT,
    },
    applicants: [
      applicantFor(
        'od-3',
        'a-3',
        'Cooper Flagg — McD\'s AA roster lock, post-event reel + meet-and-greet.',
        60_000_00,
        ['90-min meet and greet', '2 content pieces'],
        10,
        'off-season',
      ),
      applicantFor(
        'od-3',
        'a-5',
        'Rutgers PG, AA caliber. Can land same-week travel.',
        50_000_00,
        ['90-min meet and greet', '2 content pieces'],
        12,
        'off-season',
      ),
      applicantFor(
        'od-3',
        'a-6',
        'Rutgers F, AA caliber. Same-week travel possible.',
        45_000_00,
        ['90-min meet and greet', '2 content pieces'],
        13,
        'off-season',
      ),
      applicantFor(
        'od-3',
        'a-2',
        'Paul VI senior — AA invite pending, willing to flex.',
        28_000_00,
        ['90-min meet and greet', '1 content piece'],
        15,
        'in-season',
      ),
      applicantFor(
        'od-3',
        'a-1',
        'Syracuse freshman — open to AA-adjacent series content.',
        35_000_00,
        ['Meet and greet', '1 content piece'],
        16,
        'in-season',
      ),
    ],
  },
  {
    deal: {
      id: 'od-4',
      brandId: BRAND_ID,
      title: 'Bay Area Saturation — Multi-Athlete Drop',
      category: 'endorsement',
      nilCategory: 'endorsement',
      briefMarkdown:
        'Regional saturation play for the Bay. 3 athlete slots, 6-month deal, joint content series. Looking for two wings and one big with Bay roots OR Bay-program ties.',
      budgetMinCents: 90_000_00,
      budgetMaxCents: 180_000_00,
      exclusivityRequired: false,
      applicationOpensAt: '2026-05-05T00:00:00.000Z',
      applicationClosesAt: '2026-06-30T23:59:59.000Z',
      status: 'draft',
      selectionPolicy: 'shortlist-then-pick',
      desiredAttributes: {
        sports: ['Basketball'],
        states: ['CA'],
      },
      applicationCount: 0,
      createdAt: '2026-05-05T00:00:00.000Z',
      updatedAt: '2026-05-09T00:00:00.000Z',
    },
    brandLabel: BRAND_LABEL,
    budget: {
      low: { cents: 90_000_00, currency: 'USD' },
      high: { cents: 180_000_00, currency: 'USD' },
    },
    slots: 3,
    postedAt: '2026-05-05T00:00:00.000Z',
    deadline: '2026-06-30T23:59:59.000Z',
    disclosureModes: ['on-screen', 'caption'],
    fundingSource: 'brand-direct',
    source: {
      kind: 'synthetic',
      label: 'Proslync deal registry',
      caveat: SYNTHETIC_CAVEAT,
    },
    applicants: [],
  },
];

export function getMockOpenDeals(): OpenDealSurfaceRecord[] {
  return MOCK_OPEN_DEALS;
}

export function getMockOpenDeal(id: string): OpenDealSurfaceRecord | null {
  return MOCK_OPEN_DEALS.find((d) => d.deal.id === id) ?? null;
}

/**
 * Resolve `OpenDealApplication.athleteId` → display fields from the
 * `BRAND_ATHLETES` fixture. Returns a `null` row when the id has no
 * match (defensive — the fixture is curated, but the surface should
 * still render).
 */
export function resolveApplicantAthlete(athleteId: string) {
  return BRAND_ATHLETES.find((a) => a.id === athleteId) ?? null;
}
