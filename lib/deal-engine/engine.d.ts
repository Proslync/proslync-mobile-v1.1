// lib/deal-engine/engine.d.ts
// TypeScript declarations for lib/deal-engine/engine.mjs.
// Follows the lib/athlete/truth.d.ts pattern.

export declare function generateDealId(year: number, rand: () => string): string;
export declare function defaultRand(): string;

export interface FeeResult {
  athleteCents: number;
  brandFeeCents: number;
  brandTotalCents: number;
}

export declare function computeFees(amountCents: number, feeRate?: number): FeeResult;

export declare function milestoneAutoApproveAt(submittedISO: string): string;
export declare function isAutoApproved(submittedISO: string, nowISO: string): boolean;

export interface EscrowCoverageResult {
  totalMilestoneCents: number;
  fundedCents: number;
  shortfallCents: number;
  isCovered: boolean;
}

export declare function escrowCoverage(
  milestones: Array<{ amountCents: number }>,
  fundedCents: number,
): EscrowCoverageResult;
