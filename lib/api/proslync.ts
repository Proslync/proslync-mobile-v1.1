// ── PROSLYNC PRODUCT-CONTRACT API ─────────────────────────
// Typed access to the proslync-backend product-core surfaces:
//   GET /api/health                 — service health + contract manifest
//   GET /api/role-spine             — canonical 5-slot role spine
//   GET /api/auth/me                — demo current user
//   GET /api/athletes | /brands     — demo collections
//   GET /api/deals                  — demo deal collection (with evidence)
//   GET /api/deals/:id/evidence     — full evidence packet
//   GET /api/deals/:id/detail       — viewer-role-shaped deal detail
//
// This module talks to the backend over HTTP using the existing apiClient.
// In mock mode (config.api.mode === 'mock') the apiClient returns shape-
// stable empty fallbacks — callers should use isBackendReachable() / the
// useProslyncBackendHealth hook to distinguish.
import { config } from '../config';
import { apiClient } from './client';

export type ProslyncRoleSpineSlot = {
  slot: string;
  routeName: string;
  route: string;
  productObject: string;
};

export interface ProslyncRoleSpineContract {
  slots: ProslyncRoleSpineSlot[];
  roles: Record<string, Record<string, string>>;
}

export interface ProslyncBackendHealth {
  ok: boolean;
  service: string;
  version: string;
  contract: {
    mode: string;
    target: string;
    clientSurfaces: string[];
    productPages: ProslyncRoleSpineSlot[];
    roleSpine: ProslyncRoleSpineContract;
    endpoints: string[];
    counts: {
      athletes: number;
      brands: number;
      deals: number;
      evidencePackets: number;
    };
  };
  timestamp: string;
}

export interface ProslyncCurrentUser {
  id: string;
  userName: string;
  displayName: string;
  role: string;
  updatedAt: string;
}

export interface ProslyncCollectionEnvelope<T> {
  data: T[];
  count: number;
  updatedAt: string;
}

export type ProslyncDealDetailViewerRole =
  | 'athlete'
  | 'brand'
  | 'agent'
  | 'compliance';

export interface ProslyncDealEvidencePacket {
  dealId: string;
  comparableDeals: Array<{
    id: string;
    label: string;
    brand: string;
    athlete: string;
    amountCents: number;
    rationale: string;
    sourceRef: string;
    retrievedAt: string;
    freshnessDays: number;
    reviewerState: 'pending' | 'approved' | 'rejected';
  }>;
  attachments: Array<{
    id: string;
    label: string;
    state: 'attached' | 'missing' | 'pending';
  }>;
  sources: Array<{
    id: string;
    label: string;
    state: 'attached' | 'missing' | 'pending';
    freshness: string;
    note: string;
  }>;
  trust: {
    matchScore: number;
    confidence: string;
    rationale: string[];
  };
  updatedAt: string;
}

const HEALTH_TIMEOUT_MS = 4500;

export const proslyncApi = {
  /**
   * Best-effort backend connectivity probe. Returns full health envelope
   * on success, or throws a clear error caller can surface. Never falls
   * back to mock — this is the truth telemetry.
   */
  async getBackendHealth(): Promise<ProslyncBackendHealth> {
    const url = `${config.api.baseUrl.replace(/\/$/, '')}/api/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as ProslyncBackendHealth;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Fetch the canonical role-spine contract from the backend. Use this
   * to verify the front-end 5-slot spine matches the backend contract.
   */
  async getRoleSpineContract(): Promise<ProslyncRoleSpineContract> {
    return apiClient.get<ProslyncRoleSpineContract>('/api/role-spine');
  },

  async getCurrentUser(): Promise<ProslyncCurrentUser> {
    return apiClient.get<ProslyncCurrentUser>('/api/auth/me');
  },

  async getDeals(): Promise<ProslyncCollectionEnvelope<unknown>> {
    return apiClient.get<ProslyncCollectionEnvelope<unknown>>('/api/deals');
  },

  async getDealEvidence(dealId: string): Promise<ProslyncDealEvidencePacket> {
    const envelope = await apiClient.get<{ data: ProslyncDealEvidencePacket }>(
      `/api/deals/${encodeURIComponent(dealId)}/evidence`,
    );
    return envelope.data;
  },
};

/**
 * Returns true when the runtime is configured to talk to a real backend
 * (i.e. not mock-only). Useful for gating dev surfaces.
 */
export function isBackendReachable(): boolean {
  return config.api.mode !== 'mock' && Boolean(config.api.baseUrl);
}

export function getBackendBaseUrl(): string {
  return config.api.baseUrl;
}

export function getBackendModeLabel(): 'mock' | 'fallback' | 'live' {
  return config.api.mode;
}
