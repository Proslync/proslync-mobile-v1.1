// ── NIL COMPARABLE DEALS API ─────────────────────────────
// r6-api-1: thin re-export shim. Canonical implementation lives in
// `lib/api/_internal/nil-comps-impl.ts` and is mounted onto
// `apiClient.nilComps` via `lib/api/client.ts`. This file exists only
// to keep existing call sites (`import { nilCompsApi } from
// '@/lib/api/nil-comps'`) compiling.

export { nilCompsApi } from './client';
