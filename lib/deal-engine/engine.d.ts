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

export declare function athleteResponseDeadline(openedISO: string): string;
export declare function isResponseOverdue(deadlineISO: string, nowISO: string): boolean;

export interface DealNotification {
  id: string;
  dealId: string;
  atISO: string;
  kind:
    | 'escrow-funded'
    | 'milestone-submitted'
    | 'auto-approve-imminent'
    | 'milestone-auto-approved'
    | 'disputed'
    | 'response-due'
    | 'determination'
    | 'payout';
  title: string;
  body: string;
}

export declare function deriveDealNotifications(
  deals: Array<{
    dealId: string;
    escrow: { state: string; fundedCents: number; releasedCents: number };
    milestones: Array<{
      id: string;
      status: string;
      description: string;
      amountCents: number;
      submittedISO?: string;
      autoApproveAt?: string;
      dispute?: {
        athleteResponse?: string;
        athleteResponseDeadlineISO: string;
      };
    }>;
    events: Array<{ at: string; actor: string; kind: string; note?: string }>;
  }>,
  nowISO: string,
): DealNotification[];
