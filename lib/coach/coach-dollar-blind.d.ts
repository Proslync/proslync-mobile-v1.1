// lib/coach/coach-dollar-blind.d.ts
// TypeScript declarations for lib/coach/coach-dollar-blind.mjs.

export declare function formatDealStageLabel(
  stage: 'draft' | 'sent' | 'negotiation' | 'signed' | 'live',
): string;

export declare function findMoneyLeak(
  value: unknown,
  path?: string,
): { ok: boolean; offendingPath: string | null; offendingValue: unknown };
