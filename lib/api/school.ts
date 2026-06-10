// ── SCHOOL / AD DASHBOARD API ORCHESTRATOR ───────────────
// r6-api-1: thin re-export shim. Canonical implementation lives in
// `lib/api/_internal/school-impl.ts` and is mounted onto
// `apiClient.school` via `lib/api/client.ts`. This file exists only to
// keep existing call sites (`import { ... } from '@/lib/api/school'`)
// compiling.

export {
  schoolApi,
  getSchoolDashboardSnapshot,
  type SchoolDashboardSnapshot,
  type SchoolDealRollup,
  type SchoolSnapshotSource,
  type GetSchoolDashboardSnapshotOptions,
  type NilManagerSnapshot,
} from './client';
