// ── MOCK PERMISSION GRANTS ────────────────────────────────
// Sprint 3.7 fixture — hand-authored grants for three BRAND_ATHLETES:
//   a-1 Kiyan Anthony  (Syracuse, signed)
//   a-2 Jordan Miles   (Paul VI, signed)
//   a-4 JJ Starling    (Syracuse, signed)
//
// Mix of role / individual / organization grantees, the three
// ConsentLevel values, and the full GrantStatus lifecycle. Each row is
// tagged `kind: 'synthetic'` per Proslync's source-policy discipline.

import type {
  PermissionGrant,
  PermissionGrantAuditEntry,
} from '@/lib/types/permission-grant.types';
import type { ComparableDealSourceRef } from '@/lib/types/comparable-deal.types';

function syntheticSource(id: string, label: string, retrievedAt: string, freshnessDays: number): ComparableDealSourceRef {
  return {
    id,
    label,
    kind: 'synthetic',
    retrievedAt,
    freshnessDays,
    caveat: 'Hand-authored fixture for Sprint 3.7 — not a real consent record.',
  };
}

function audit(
  at: string,
  actor: PermissionGrantAuditEntry['actor'],
  action: PermissionGrantAuditEntry['action'],
  note?: string,
): PermissionGrantAuditEntry {
  return { at, actor, action, note };
}

const ATHLETE_ACTOR = (name: string): PermissionGrantAuditEntry['actor'] => ({
  kind: 'athlete',
  label: name,
});

const MANAGER_ACTOR: PermissionGrantAuditEntry['actor'] = {
  kind: 'manager',
  label: 'NIL Manager · L. Wilson',
};

const SYSTEM_ACTOR: PermissionGrantAuditEntry['actor'] = {
  kind: 'system',
  label: 'Proslync · System',
};

export const MOCK_PERMISSION_GRANTS: PermissionGrant[] = [
  // ── Kiyan Anthony (a-1) ────────────────────────────────
  {
    id: 'pg-001',
    athleteId: 'a-1',
    grantee: {
      kind: 'role',
      roleKey: 'agent',
    },
    level: 'full',
    scopes: ['all'],
    rationale: 'Primary representation — full visibility for active negotiations.',
    createdAt: '2026-01-12T15:04:00Z',
    activatedAt: '2026-01-12T15:04:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-12T15:00:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'created', 'Initial grant to representing-agent role.'),
      audit('2026-01-12T15:04:00Z', SYSTEM_ACTOR, 'activated'),
      audit('2026-04-02T18:21:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'updated-scopes', 'Expanded to all scopes for the renewal cycle.'),
    ],
    source: syntheticSource('src-pg-001', 'Demo fixture · a-1', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-002',
    athleteId: 'a-1',
    grantee: {
      kind: 'individual',
      individualName: 'Tosan E.',
      individualRoleLabel: 'Nike — Brand Owner',
    },
    level: 'full',
    scopes: ['contracts', 'commitments'],
    rationale: 'Direct deal partner — needs deliverables + contract visibility.',
    createdAt: '2026-02-14T19:30:00Z',
    activatedAt: '2026-02-14T19:30:00Z',
    expiresAt: '2026-05-20T00:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-02-14T19:30:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'created', 'Per the Nike exclusive — direct grant to brand point-of-contact.'),
      audit('2026-02-14T19:30:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-002', 'Demo fixture · a-1', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-003',
    athleteId: 'a-1',
    grantee: {
      kind: 'role',
      roleKey: 'school',
    },
    level: 'summary',
    scopes: ['compliance', 'commitments'],
    rationale: 'Compliance office visibility — aggregates only, no payment detail.',
    createdAt: '2026-01-12T15:10:00Z',
    activatedAt: '2026-01-12T15:10:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-12T15:10:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'created'),
      audit('2026-01-12T15:10:00Z', SYSTEM_ACTOR, 'activated'),
      audit('2026-03-08T11:15:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'updated-level', 'Downgraded from full to summary after compliance review.'),
    ],
    source: syntheticSource('src-pg-003', 'Demo fixture · a-1', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-004',
    athleteId: 'a-1',
    grantee: {
      kind: 'organization',
      organizationName: 'Hayes Sports Group',
    },
    level: 'summary',
    scopes: ['financials'],
    rationale: 'Family-office partner — quarterly earnings summaries only.',
    createdAt: '2026-03-01T20:00:00Z',
    activatedAt: '2026-03-01T20:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-03-01T20:00:00Z', ATHLETE_ACTOR('Kiyan Anthony'), 'created'),
      audit('2026-03-01T20:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-004', 'Demo fixture · a-1', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-005',
    athleteId: 'a-1',
    grantee: {
      kind: 'role',
      roleKey: 'fan',
    },
    level: 'withheld',
    scopes: ['social'],
    rationale: 'Default — fan role gets no consent. Recorded explicitly so the audit story is unambiguous.',
    createdAt: '2026-01-12T15:00:00Z',
    activatedAt: '2026-01-12T15:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-12T15:00:00Z', SYSTEM_ACTOR, 'created', 'Default withheld grant attached at athlete onboarding.'),
      audit('2026-01-12T15:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-005', 'Demo fixture · a-1', '2026-05-09T00:00:00Z', 1),
  },

  // ── Jordan Miles (a-2) ─────────────────────────────────
  {
    id: 'pg-006',
    athleteId: 'a-2',
    grantee: {
      kind: 'individual',
      individualName: 'Maya L.',
      individualRoleLabel: 'Nike — Deal Owner',
    },
    level: 'full',
    scopes: ['contracts', 'commitments', 'communications'],
    rationale: 'Active deal owner on the Paul VI exclusive.',
    createdAt: '2026-02-06T14:00:00Z',
    activatedAt: '2026-02-06T14:00:00Z',
    expiresAt: '2026-05-15T00:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-02-06T14:00:00Z', ATHLETE_ACTOR('Jordan Miles'), 'created', 'Granted at signing.'),
      audit('2026-02-06T14:00:00Z', SYSTEM_ACTOR, 'activated'),
      audit('2026-04-22T09:42:00Z', ATHLETE_ACTOR('Jordan Miles'), 'updated-scopes', 'Added communications scope after live activation.'),
    ],
    source: syntheticSource('src-pg-006', 'Demo fixture · a-2', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-007',
    athleteId: 'a-2',
    grantee: {
      kind: 'role',
      roleKey: 'school',
    },
    level: 'summary',
    scopes: ['compliance', 'commitments', 'comp-evidence'],
    rationale: 'School compliance — aggregate view for the AD back-office.',
    createdAt: '2026-01-20T16:00:00Z',
    activatedAt: '2026-01-20T16:00:00Z',
    status: 'paused',
    auditLog: [
      audit('2026-01-20T16:00:00Z', ATHLETE_ACTOR('Jordan Miles'), 'created'),
      audit('2026-01-20T16:00:00Z', SYSTEM_ACTOR, 'activated'),
      audit('2026-04-28T13:00:00Z', ATHLETE_ACTOR('Jordan Miles'), 'paused', 'Paused while transferring schools — will revisit after enrollment confirms.'),
    ],
    source: syntheticSource('src-pg-007', 'Demo fixture · a-2', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-008',
    athleteId: 'a-2',
    grantee: {
      kind: 'individual',
      individualName: 'Ari Kohn',
      individualRoleLabel: 'Former representation',
    },
    level: 'withheld',
    scopes: ['contracts'],
    rationale: 'Revoked after representation change.',
    createdAt: '2025-09-12T17:00:00Z',
    activatedAt: '2025-09-12T17:00:00Z',
    status: 'revoked',
    auditLog: [
      audit('2025-09-12T17:00:00Z', ATHLETE_ACTOR('Jordan Miles'), 'created'),
      audit('2025-09-12T17:00:00Z', SYSTEM_ACTOR, 'activated'),
      audit('2026-01-19T10:30:00Z', ATHLETE_ACTOR('Jordan Miles'), 'updated-level', 'Downgraded to withheld pending revocation review.'),
      audit('2026-01-21T12:00:00Z', MANAGER_ACTOR, 'revoked', 'Confirmed revocation after representation change.'),
    ],
    source: syntheticSource('src-pg-008', 'Demo fixture · a-2', '2026-05-09T00:00:00Z', 1),
  },

  // ── JJ Starling (a-4) ──────────────────────────────────
  {
    id: 'pg-009',
    athleteId: 'a-4',
    grantee: {
      kind: 'role',
      roleKey: 'coach',
    },
    level: 'summary',
    scopes: ['commitments'],
    rationale: 'Coaching staff visibility — practice / appearance conflicts only.',
    createdAt: '2026-02-22T18:00:00Z',
    activatedAt: '2026-02-22T18:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-02-22T18:00:00Z', ATHLETE_ACTOR('JJ Starling'), 'created'),
      audit('2026-02-22T18:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-009', 'Demo fixture · a-4', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-010',
    athleteId: 'a-4',
    grantee: {
      kind: 'organization',
      organizationName: 'Excel Sports Management',
    },
    level: 'full',
    scopes: ['all'],
    rationale: 'New representation — onboarding in progress, activates on contract counter-sign.',
    createdAt: '2026-05-06T13:00:00Z',
    status: 'pending',
    auditLog: [
      audit('2026-05-06T13:00:00Z', ATHLETE_ACTOR('JJ Starling'), 'created', 'Pending counter-sign on representation agreement.'),
    ],
    source: syntheticSource('src-pg-010', 'Demo fixture · a-4', '2026-05-09T00:00:00Z', 1),
  },

  // ── Cooper Flagg (a-3) ──────────────────────────────────
  {
    id: 'pg-011',
    athleteId: 'a-3',
    grantee: { kind: 'individual', individualName: 'Rich Paul', individualRoleLabel: 'Klutch Sports Group' },
    level: 'full',
    scopes: ['all'],
    rationale: 'Primary representation — full visibility for renewal and BWW negotiations.',
    createdAt: '2026-01-08T14:00:00Z',
    activatedAt: '2026-01-08T14:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-08T14:00:00Z', ATHLETE_ACTOR('Cooper Flagg'), 'created'),
      audit('2026-01-08T14:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-011', 'Demo fixture · a-3', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-012',
    athleteId: 'a-3',
    grantee: { kind: 'role', roleKey: 'school' },
    level: 'summary',
    scopes: ['compliance', 'commitments'],
    rationale: 'Duke AD reviewer — aggregate compliance view, no payment detail.',
    createdAt: '2026-01-08T14:10:00Z',
    activatedAt: '2026-01-08T14:10:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-08T14:10:00Z', ATHLETE_ACTOR('Cooper Flagg'), 'created'),
      audit('2026-01-08T14:10:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-012', 'Demo fixture · a-3', '2026-05-09T00:00:00Z', 1),
  },
  // ── AJ Dybantsa (a-8) ───────────────────────────────────
  {
    id: 'pg-013',
    athleteId: 'a-8',
    grantee: { kind: 'individual', individualName: 'Aaron Mintz', individualRoleLabel: 'CAA Sports' },
    level: 'full',
    scopes: ['all'],
    rationale: 'Primary representation.',
    createdAt: '2026-01-22T12:00:00Z',
    activatedAt: '2026-01-22T12:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-22T12:00:00Z', ATHLETE_ACTOR('AJ Dybantsa'), 'created'),
      audit('2026-01-22T12:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-013', 'Demo fixture · a-8', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-014',
    athleteId: 'a-8',
    grantee: { kind: 'role', roleKey: 'school' },
    level: 'summary',
    scopes: ['compliance'],
    rationale: 'BYU NIL desk — compliance summary.',
    createdAt: '2026-01-22T12:05:00Z',
    activatedAt: '2026-01-22T12:05:00Z',
    status: 'active',
    auditLog: [
      audit('2026-01-22T12:05:00Z', ATHLETE_ACTOR('AJ Dybantsa'), 'created'),
      audit('2026-01-22T12:05:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-014', 'Demo fixture · a-8', '2026-05-09T00:00:00Z', 1),
  },
  // ── Kon Knueppel (a-9) ─────────────────────────────────
  {
    id: 'pg-015',
    athleteId: 'a-9',
    grantee: { kind: 'role', roleKey: 'agent' },
    level: 'full',
    scopes: ['contracts', 'commitments'],
    rationale: 'Agent of record.',
    createdAt: '2026-02-15T15:00:00Z',
    activatedAt: '2026-02-15T15:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-02-15T15:00:00Z', ATHLETE_ACTOR('Kon Knueppel'), 'created'),
      audit('2026-02-15T15:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-015', 'Demo fixture · a-9', '2026-05-09T00:00:00Z', 1),
  },
  // ── Donnie Freeman (a-10) ──────────────────────────────
  {
    id: 'pg-016',
    athleteId: 'a-10',
    grantee: { kind: 'role', roleKey: 'agent' },
    level: 'full',
    scopes: ['contracts'],
    rationale: 'Active draft review.',
    createdAt: '2026-04-30T13:00:00Z',
    activatedAt: '2026-04-30T13:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-04-30T13:00:00Z', ATHLETE_ACTOR('Donnie Freeman'), 'created'),
      audit('2026-04-30T13:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-016', 'Demo fixture · a-10', '2026-05-09T00:00:00Z', 1),
  },
  // ── RJ Davis (a-12) ────────────────────────────────────
  {
    id: 'pg-017',
    athleteId: 'a-12',
    grantee: { kind: 'organization', organizationName: 'Roc Nation Sports' },
    level: 'full',
    scopes: ['all'],
    rationale: 'Primary representation.',
    createdAt: '2025-09-01T10:00:00Z',
    activatedAt: '2025-09-01T10:00:00Z',
    status: 'active',
    auditLog: [
      audit('2025-09-01T10:00:00Z', ATHLETE_ACTOR('RJ Davis'), 'created'),
      audit('2025-09-01T10:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-017', 'Demo fixture · a-12', '2026-05-09T00:00:00Z', 1),
  },
  // ── JuJu Watkins (a-15) ────────────────────────────────
  {
    id: 'pg-018',
    athleteId: 'a-15',
    grantee: { kind: 'organization', organizationName: 'Excel Sports Management' },
    level: 'full',
    scopes: ['all'],
    rationale: 'Primary representation — full deal visibility.',
    createdAt: '2025-08-10T11:00:00Z',
    activatedAt: '2025-08-10T11:00:00Z',
    status: 'active',
    auditLog: [
      audit('2025-08-10T11:00:00Z', ATHLETE_ACTOR('JuJu Watkins'), 'created'),
      audit('2025-08-10T11:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-018', 'Demo fixture · a-15', '2026-05-09T00:00:00Z', 1),
  },
  {
    id: 'pg-019',
    athleteId: 'a-15',
    grantee: { kind: 'role', roleKey: 'school' },
    level: 'summary',
    scopes: ['compliance', 'commitments'],
    rationale: 'USC NIL desk — aggregate view.',
    createdAt: '2025-08-10T11:10:00Z',
    activatedAt: '2025-08-10T11:10:00Z',
    status: 'active',
    auditLog: [
      audit('2025-08-10T11:10:00Z', ATHLETE_ACTOR('JuJu Watkins'), 'created'),
      audit('2025-08-10T11:10:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-019', 'Demo fixture · a-15', '2026-05-09T00:00:00Z', 1),
  },
  // ── Hannah Hidalgo (a-16) ──────────────────────────────
  {
    id: 'pg-020',
    athleteId: 'a-16',
    grantee: { kind: 'role', roleKey: 'agent' },
    level: 'full',
    scopes: ['contracts', 'commitments'],
    rationale: 'Agent of record.',
    createdAt: '2026-02-05T14:00:00Z',
    activatedAt: '2026-02-05T14:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-02-05T14:00:00Z', ATHLETE_ACTOR('Hannah Hidalgo'), 'created'),
      audit('2026-02-05T14:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-020', 'Demo fixture · a-16', '2026-05-09T00:00:00Z', 1),
  },
  // ── Ryan Williams (a-18) ───────────────────────────────
  {
    id: 'pg-021',
    athleteId: 'a-18',
    grantee: { kind: 'role', roleKey: 'agent' },
    level: 'full',
    scopes: ['all'],
    rationale: 'Active football-side negotiations.',
    createdAt: '2026-03-15T16:00:00Z',
    activatedAt: '2026-03-15T16:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-03-15T16:00:00Z', ATHLETE_ACTOR('Ryan Williams'), 'created'),
      audit('2026-03-15T16:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-021', 'Demo fixture · a-18', '2026-05-09T00:00:00Z', 1),
  },
  // ── Dylan Harper (a-5) ─────────────────────────────────
  {
    id: 'pg-022',
    athleteId: 'a-5',
    grantee: { kind: 'individual', individualName: 'Aaron Mintz', individualRoleLabel: 'CAA Sports' },
    level: 'full',
    scopes: ['contracts', 'commitments'],
    rationale: 'Agent of record on the Nike negotiation.',
    createdAt: '2026-03-12T11:00:00Z',
    activatedAt: '2026-03-12T11:00:00Z',
    status: 'active',
    auditLog: [
      audit('2026-03-12T11:00:00Z', ATHLETE_ACTOR('Dylan Harper'), 'created'),
      audit('2026-03-12T11:00:00Z', SYSTEM_ACTOR, 'activated'),
    ],
    source: syntheticSource('src-pg-022', 'Demo fixture · a-5', '2026-05-09T00:00:00Z', 1),
  },
];

export function getMockPermissionGrantsForAthlete(athleteId: string): PermissionGrant[] {
  return MOCK_PERMISSION_GRANTS.filter((g) => g.athleteId === athleteId);
}

export function getMockPermissionGrantById(id: string): PermissionGrant | undefined {
  return MOCK_PERMISSION_GRANTS.find((g) => g.id === id);
}
