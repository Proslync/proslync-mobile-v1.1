// ── PERMISSION GRANTS API ─────────────────────────────────
// Mock-first façade for Sprint 3.7 (PLAN §3.7) athlete consent /
// permission-grant model. State changes mutate the in-memory fixture
// and append an audit entry so the UI can demonstrate the read /
// pause / revoke flow without a backend round-trip.
//
// Future iteration: field-level redaction is intentionally not
// exposed here.

import {
  MOCK_PERMISSION_GRANTS,
  getMockPermissionGrantById,
  getMockPermissionGrantsForAthlete,
} from '@/lib/data/mock-permission-grants';
import type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';
import type {
  GrantStatus,
  PermissionGrant,
  PermissionGrantAuditAction,
  PermissionScope,
} from '@/lib/types/permission-grant.types';

function nowIso(): string {
  return new Date().toISOString();
}

function appendAudit(
  grant: PermissionGrant,
  action: PermissionGrantAuditAction,
  note?: string,
): PermissionGrant {
  grant.auditLog.push({
    at: nowIso(),
    actor: { kind: 'athlete', label: 'Athlete' },
    action,
    note,
  });
  return grant;
}

export const permissionGrantsApi = {
  async listForAthlete(athleteId: string): Promise<PermissionGrant[]> {
    if (!athleteId) return [];
    return getMockPermissionGrantsForAthlete(athleteId);
  },

  async getGrant(id: string): Promise<PermissionGrant | null> {
    if (!id) return null;
    return getMockPermissionGrantById(id) ?? null;
  },

  async updateGrantStatus(id: string, status: GrantStatus): Promise<PermissionGrant | null> {
    const grant = MOCK_PERMISSION_GRANTS.find((g) => g.id === id);
    if (!grant) return null;

    const previousStatus = grant.status;
    grant.status = status;

    let action: PermissionGrantAuditAction = 'updated-scopes';
    if (status === 'paused') action = 'paused';
    else if (status === 'revoked') action = 'revoked';
    else if (status === 'active') action = 'activated';

    appendAudit(grant, action, `Status ${previousStatus} → ${status}.`);
    if (status === 'active' && !grant.activatedAt) {
      grant.activatedAt = nowIso();
    }
    return grant;
  },

  async setLevel(id: string, level: ConsentLevel): Promise<PermissionGrant | null> {
    const grant = MOCK_PERMISSION_GRANTS.find((g) => g.id === id);
    if (!grant) return null;

    const previousLevel = grant.level;
    grant.level = level;
    appendAudit(grant, 'updated-level', `Level ${previousLevel} → ${level}.`);
    return grant;
  },

  async setScopes(id: string, scopes: PermissionScope[]): Promise<PermissionGrant | null> {
    const grant = MOCK_PERMISSION_GRANTS.find((g) => g.id === id);
    if (!grant) return null;

    grant.scopes = [...scopes];
    appendAudit(grant, 'updated-scopes', `Scopes updated to: ${scopes.join(', ') || '(none)'}.`);
    return grant;
  },
};
