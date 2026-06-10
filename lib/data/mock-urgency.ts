// ── MOCK URGENCY FIXTURE ──────────────────────────────────
// Fallback urgency rows for the Today dashboard's Needs Attention zone.
// Used when contracts / offers hooks return empty data (thin-data-first law).
// Two items: one ~71h amber, one ~3.5d white. Always clearly labelled synthetic.
//
// EMPTY-VARIANT NOTE: When the live hooks return non-empty data, the
// `deriveUrgencyItems` selector should prefer real deadline fields from those
// rows. This fixture is only surfaced when both hooks resolve to 0 items OR
// when the deadline fields on real rows are missing/null.
//
// Deadlines are RELATIVE (computed at module load) so fixtures never expire.

/** ISO deadline for the amber item (~71h from now → amber <72h stripe). */
const AMBER_DEADLINE = new Date(Date.now() + 71 * 3600e3).toISOString();
/** ISO deadline for the white/blue item (~3.5 days from now). */
const WHITE_DEADLINE = new Date(Date.now() + 3.5 * 24 * 3600e3).toISOString();

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
    sublabel: 'Submit NIL earnings disclosure — deadline approaching · Sample',
    deadlineISO: AMBER_DEADLINE,
    kind: 'disclosure',
    cta: 'DISCLOSE',
    route: '/athlete/disclosures',
  },
  {
    id: 'urgency-fixture-2',
    label: 'Jordan Brand · Post Deliverable',
    sublabel: 'Submit Instagram post per campaign brief · Sample',
    deadlineISO: WHITE_DEADLINE,
    kind: 'deliverable',
    cta: 'SUBMIT',
    route: '/athlete/deals',
  },
];
