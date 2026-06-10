// ── MOCK URGENCY FIXTURE ──────────────────────────────────
// Fallback urgency rows for the Today dashboard's Needs Attention zone.
// Used when contracts / offers hooks return empty data (thin-data-first law).
// Two items: one ~71h amber, one ~3d white. Always clearly labelled synthetic.
//
// EMPTY-VARIANT NOTE: When the live hooks return non-empty data, the
// `deriveUrgencyItems` selector should prefer real deadline fields from those
// rows. This fixture is only surfaced when both hooks resolve to 0 items OR
// when the deadline fields on real rows are missing/null.

/** ISO deadline for the amber item (~71h from 2026-06-10T00:00:00Z). */
const AMBER_DEADLINE = '2026-06-12T23:00:00.000Z'; // 71h out → amber <72h
/** ISO deadline for the white item (~3 days from 2026-06-10T00:00:00Z). */
const WHITE_DEADLINE = '2026-06-13T12:00:00.000Z'; // ~84h out → white (blue)

export interface MockUrgencyItem {
  id: string;
  label: string;
  sublabel: string;
  deadlineISO: string;
  kind: 'disclosure' | 'deliverable' | 'offer';
  cta: 'DISCLOSE' | 'SUBMIT' | 'RESPOND';
  route: string;
}

export const MOCK_URGENCY_ITEMS: MockUrgencyItem[] = [
  {
    id: 'urgency-fixture-1',
    label: 'Nike · Annual Disclosure Due',
    sublabel: 'Submit NIL earnings disclosure — deadline approaching',
    deadlineISO: AMBER_DEADLINE,
    kind: 'disclosure',
    cta: 'DISCLOSE',
    route: '/athlete/disclosures',
  },
  {
    id: 'urgency-fixture-2',
    label: 'Jordan Brand · Post Deliverable',
    sublabel: 'Submit Instagram post per campaign brief',
    deadlineISO: WHITE_DEADLINE,
    kind: 'deliverable',
    cta: 'SUBMIT',
    route: '/athlete/deals',
  },
];
