// ── ATHLETE PAYOUT API ───────────────────────────────────
// r6-api-1: thin re-export shim. Canonical implementation lives in
// `lib/api/_internal/athlete-payouts-impl.ts` and is mounted onto
// `apiClient.athletePayouts` via `lib/api/client.ts`. This file exists
// only to keep existing call sites (`import { athletePayoutsApi } from
// '@/lib/api/athlete-payouts'`) compiling.

export { athletePayoutsApi } from './client';
