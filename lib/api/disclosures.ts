// ── ATHLETE DISCLOSURES API ──────────────────────────────
// r6-api-1: thin re-export shim. Canonical implementation lives in
// `lib/api/_internal/disclosures-impl.ts` and is mounted onto
// `apiClient.disclosures` via `lib/api/client.ts`. This file exists
// only to keep existing call sites (`import { disclosuresApi } from
// '@/lib/api/disclosures'`) compiling.

export { disclosuresApi } from './client';
