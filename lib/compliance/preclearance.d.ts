// lib/compliance/preclearance.d.ts
// TypeScript declarations for lib/compliance/preclearance.mjs.

export type TestResult = 'pass' | 'warn' | 'fail';
export type PreclearanceVerdict = 'likely-clear' | 'needs-review' | 'likely-rejected';

export interface PreflightFlag {
  kind: string;
  label: string;
  detail: string;
}

export interface PreclearanceInput {
  amountCents: number;
  dealKind: string;
  deliverableDescription: string;
  payerEntityType: string;
  compRange?: { lowCents: number; highCents: number } | null;
}

export interface PreclearanceResult {
  verdict: PreclearanceVerdict;
  flags: PreflightFlag[];
  tests: {
    businessPurpose: TestResult;
    activation: TestResult;
    compRange: TestResult;
  };
}

export declare function scorePreclearance(input: PreclearanceInput): PreclearanceResult;
export declare function nilGoDeadline(executedISO: string): string;
