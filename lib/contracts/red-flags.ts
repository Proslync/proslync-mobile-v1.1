// lib/contracts/red-flags.ts
// Re-export shim so TypeScript consumers can import from the .ts path.
// The actual implementation lives in red-flags.mjs (plain JS for node:test).
export type { ScanFlag, ScanResult } from './red-flags.d';
export { scanContract, LLM_READY } from './red-flags.mjs';
