// ── PERMISSION GRANT TYPES ────────────────────────────────
// Sprint 3.7 (PLAN §3.7) — athlete consent + permission grant model.
// Per W22, an athlete may grant access to a *role* (e.g. agent, school,
// NIL Manager), to a *named individual*, or to a *named organization*.
// Field-level redaction is intentionally NOT modeled here — this slice
// is coarse-grained per Mrs. Wilson's 2026-04-06 build-sequence ask.
//
// ConsentLevel is the single source of truth from
// `lib/data/mock-nil-manager-data.ts`. Do not redefine here — we
// re-export it so callers have one import path.
//
// Read semantics (coarse-grained):
//   level: 'full'      → grantee may read everything in `scopes`
//   level: 'summary'   → grantee may read aggregates/counts only;
//                        reads of individual rows are automatically
//                        scoped-down by the consumer
//   level: 'withheld'  → grantee may NOT read anything for that
//                        athlete, even if a scope intersects. The
//                        record exists so the audit log can show that
//                        consent was actively *removed*, not absent.
//
// A grant carries a ComparableDealSourceRef so the audit story stays
// consistent with the rest of Proslync — every state-changing record
// reports where it came from and how fresh it is.

import type {
  ComparableDealSourceRef,
} from '@/lib/types/comparable-deal.types';
import type { ProfileRole } from '@/lib/providers/role-provider';

// Re-export ConsentLevel so callers only need one import path.
export type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';

/** Who the grant is pointed at. */
export type GranteeKind = 'role' | 'individual' | 'organization';

/** Lifecycle state for a single permission grant. */
export type GrantStatus =
  | 'active'
  | 'pending'
  | 'paused'
  | 'revoked'
  | 'expired';

/**
 * Coarse-grained read scope. `'all'` is a convenience superset — the UI
 * may render it as a single chip but it is equivalent to enumerating
 * every other value. Field-level redaction (e.g. show endorsement type
 * but hide payment amount) is intentionally a *future* iteration.
 */
export type PermissionScope =
  | 'financials'
  | 'contracts'
  | 'commitments'
  | 'comp-evidence'
  | 'compliance'
  | 'social'
  | 'communications'
  | 'all';

/** The "to whom" side of a grant. Exactly one of the optional fields
 *  is populated, gated by `kind`. */
export interface PermissionGrantee {
  kind: GranteeKind;
  /** Set when `kind === 'role'`. References ProfileRole so a single
   *  grant covers every actor wearing that role. */
  roleKey?: ProfileRole;
  /** Set when `kind === 'individual'`. */
  individualName?: string;
  /** Optional role label paired with `individualName` — purely
   *  cosmetic for the UI, not a permission boundary. */
  individualRoleLabel?: string;
  /** Set when `kind === 'organization'`. */
  organizationName?: string;
}

/** Action types in the grant's audit log. */
export type PermissionGrantAuditAction =
  | 'created'
  | 'activated'
  | 'paused'
  | 'updated-scopes'
  | 'updated-level'
  | 'revoked';

export interface PermissionGrantAuditEntry {
  at: string; // ISO 8601
  actor: {
    kind: 'athlete' | 'system' | 'manager';
    label: string;
  };
  action: PermissionGrantAuditAction;
  note?: string;
}

/**
 * Full grant record. Field-level redaction is NOT modeled — that is a
 * future iteration. Today, granting `level: 'summary'` is interpreted
 * by the consumer as "aggregate-only reads"; granting `level:
 * 'withheld'` blocks all reads for the grantee even when a scope
 * appears in `scopes`.
 */
export interface PermissionGrant {
  id: string;
  athleteId: string;
  grantee: PermissionGrantee;
  level: import('@/lib/data/mock-nil-manager-data').ConsentLevel;
  scopes: PermissionScope[];
  rationale?: string;
  createdAt: string; // ISO 8601
  activatedAt?: string; // ISO 8601, absent while pending
  expiresAt?: string; // ISO 8601, used for expiring-soon UI
  status: GrantStatus;
  /** Chronological — earliest first as stored. UI renders latest first. */
  auditLog: PermissionGrantAuditEntry[];
  source: ComparableDealSourceRef;
}
