/**
 * Consent grants — athletes grant access to roles or individuals.
 *
 * Anchors:
 *   - W22: athletes grant access to roles or individuals with field-level
 *          granularity ("agent can see XYZ but not ABC")
 *
 * Spec: research-plane/cross-pollinators/schema-candidates/consent.md
 *
 * Reuse: `MarketplaceRole` from `marketplace.types.ts`.
 *
 * **MVP shape: coarse.** Q7 in PLAN.md §9 is unresolved (coarse role-level
 * vs fine-grained per-field). Both shapes are exported here as
 * discriminated-union members; consumers should default to `CoarseConsentGrant`
 * until Q7 lands and the fine-grained surface is feature-flagged on.
 */

import type { MarketplaceRole } from './marketplace.types';

export type GrantSubjectKind = 'role' | 'individual';

export interface GrantSubject {
  kind: GrantSubjectKind;
  /**
   * When `kind === 'role'`: a `MarketplaceRole` value.
   * When `kind === 'individual'`: a user id.
   */
  ref: MarketplaceRole | string;
}

/* ─── Coarse shape (MVP default) ───────────────────────────────────────── */

export type CoarseScope =
  /** See everything. */
  | 'all'
  /** See counts + aggregates, no per-deal detail. */
  | 'summary-only'
  /** See deal pipeline, not finances. */
  | 'deals-only'
  /** See earnings, not deals. */
  | 'finances-only';

export interface CoarseConsentGrant {
  id: string;
  granterAthleteId: string;
  subject: GrantSubject;
  scope: CoarseScope;
  /** ISO 8601 timestamp. */
  grantedAt: string;
  /** ISO 8601 timestamp; revocation kept as audit trail (do not hard-delete). */
  revokedAt?: string;
  notes?: string;
}

/* ─── Fine shape (kept behind feature flag pending Q7) ─────────────────── */

/**
 * Per-field allow/deny lists. Each entry is a dotted accessor relative to a
 * base entity (e.g. `'NilDeal.amountCents'`, `'Athlete.gpa'`).
 */
export interface FieldGrantPolicy {
  allow: string[];
  /** Explicit denies override allows. */
  deny: string[];
}

export interface FineConsentGrant {
  id: string;
  granterAthleteId: string;
  subject: GrantSubject;
  policy: FieldGrantPolicy;
  /** ISO 8601 timestamp. */
  grantedAt: string;
  /** ISO 8601 timestamp; revocation kept as audit trail. */
  revokedAt?: string;
  notes?: string;
}

/**
 * Discriminated-union export. MVP consumers (`consent-provider.tsx`,
 * `app/athlete/permissions.tsx`) read only the `'coarse'` variant by
 * default.
 */
export type ConsentGrant =
  | ({ shape: 'coarse' } & CoarseConsentGrant)
  | ({ shape: 'fine' } & FineConsentGrant);
