// lib/contracts/red-flags.d.ts
// TypeScript declarations for lib/contracts/red-flags.mjs.
// Follows the lib/athlete/truth.d.ts pattern — lets TS resolve the .mjs
// functions when imported as '@/lib/contracts/red-flags.mjs'.

export declare const LLM_READY: false;

export interface ScanFlag {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  why: string;
  excerpt: string;
}

export interface ScanResult {
  level: 'clear' | 'caution' | 'high-risk';
  score: number;
  flags: ScanFlag[];
}

/**
 * Scan a contract text for NIL red flags.
 * LLM swap point: replace body with async LLM call returning the same ScanResult.
 */
export declare function scanContract(text: string): ScanResult;
