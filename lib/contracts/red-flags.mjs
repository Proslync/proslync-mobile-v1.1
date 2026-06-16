// lib/contracts/red-flags.mjs
// ═══════════════════════════════════════════════════════════════════════════
// NIL CONTRACT RED-FLAG SCANNER — rule-based, LLM-ready swap point.
// Plain JS (.mjs) so node:test can run without TS toolchain.
// Metro bundles .mjs fine (same as lib/athlete/truth.mjs).
//
// ── LLM SWAP POINT ──────────────────────────────────────────────────────────
// `scanContract` is the single swap point for a future LLM call.
// To upgrade: replace the function body with an async LLM call that returns
// the same `ScanResult` shape. The screen (app/athlete/contract-scan.tsx)
// and any callers need no changes — they just `await scanContract(text)`.
//
// Keep `LLM_READY = false` until the LLM path is wired in; the screen
// uses this flag to render the "Automated scan — not legal advice" footer.
// ════════════════════════════════════════════════════════════════════════════

/** @type {false} */
export const LLM_READY = false;

// ── Severity weights ─────────────────────────────────────────────────────────
const WEIGHTS = { high: 3, medium: 2, low: 1 };

// ── Excerpt helper ───────────────────────────────────────────────────────────
/**
 * Return up to 80 chars centred around the match index, trimmed + ellipsis.
 * @param {string} text — lowercased input
 * @param {number} index — match start index
 * @param {number} [len=80]
 * @returns {string}
 */
function excerpt(text, index, len = 80) {
  const half = Math.floor(len / 2);
  const start = Math.max(0, index - half);
  const end = Math.min(text.length, index + half);
  let slice = text.slice(start, end).trim();
  if (start > 0) slice = '…' + slice;
  if (end < text.length) slice = slice + '…';
  return slice;
}

// ── Rule definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {{ id: string; severity: 'high'|'medium'|'low'; title: string; why: string; excerpt: string }} ScanFlag
 * @typedef {{ level: 'clear'|'caution'|'high-risk'; score: number; flags: ScanFlag[] }} ScanResult
 */

/**
 * @param {string} lower — already-lowercased contract text
 * @returns {ScanFlag|null}
 */
function checkPerpetualLikeness(lower) {
  // "all rights" alone is too broad — only flag when paired with grant/assign/transfer
  // to avoid matching "all rights revert" (which is athlete-favourable)
  const termRe = /perpetu|in perpetuity|irrevocab|forever|worldwide.{0,30}licen|(all rights).{0,30}(grant|assign|transfer|convey)/;
  const likenessRe = /likeness|image|name/;
  const m = termRe.exec(lower);
  if (!m) return null;
  // must also mention likeness/image/name somewhere nearby (within 150 chars)
  const window = lower.slice(Math.max(0, m.index - 150), m.index + 150);
  if (!likenessRe.test(window)) return null;
  return {
    id: 'perpetual-likeness',
    severity: 'high',
    title: 'Perpetual / irrevocable likeness grant',
    why: "Grants your name/image rights with no end date — you could never reclaim them.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkAiReplica(lower) {
  const aiRe = /(\bai\b|artificial intelligence|synthetic|deepfake|digital (replica|double|twin|likeness)|generat(e|ive|ed)|train.{0,20}model|machine learning)/;
  const likenessRe = /likeness|image|voice/;
  const m = aiRe.exec(lower);
  if (!m) return null;
  const window = lower.slice(Math.max(0, m.index - 150), m.index + 150);
  if (!likenessRe.test(window)) return null;
  return {
    id: 'ai-replica',
    severity: 'high',
    title: 'AI / synthetic likeness clause',
    why: "Lets them generate unlimited AI content in your likeness from one payment.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkPaymentVague(lower) {
  const re = /(upon|subject to|at).{0,25}(approval|satisfaction|sole discretion|discretion)|withhold|may reduce|net (60|90|120)/;
  const m = re.exec(lower);
  if (!m) return null;
  // Skip false positives like "not subject to approval" (negated clause)
  const beforeMatch = lower.slice(Math.max(0, m.index - 20), m.index);
  if (/\bnot\b/.test(beforeMatch)) return null;
  return {
    id: 'payment-vague',
    severity: 'high',
    title: 'Vague or conditional payment terms',
    why: "Payment isn’t guaranteed — they can delay, reduce, or withhold it.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkAgentFeeHigh(lower) {
  // 20–99% (two digits) OR 100%+ (three or more digits). Single-digit and
  // teens (≤19%, within the 10–20% norm) must NOT fire.
  const pctRe = /\b([2-9][0-9]|[1-9][0-9]{2,})\s?%/g;
  const nearWords = /commission|fee|agent|representation/;
  let m;
  while ((m = pctRe.exec(lower)) !== null) {
    const window = lower.slice(Math.max(0, m.index - 40), m.index + 40);
    if (nearWords.test(window)) {
      return {
        id: 'agent-fee-high',
        severity: 'high',
        title: 'Agent / representation fee above norm',
        why: "Agent fee well above the 10–20% norm (3–5% in pro sports).",
        excerpt: excerpt(lower, m.index),
      };
    }
  }
  return null;
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkExclusivityBroad(lower) {
  if (!/exclusiv/.test(lower)) return null;
  const broadRe = /(category|competitor|any (similar|competing)|entire|all (other )?brands)/;
  const m = broadRe.exec(lower);
  if (!m) return null;
  return {
    id: 'exclusivity-broad',
    severity: 'medium',
    title: 'Broad category exclusivity',
    why: "Locks you out of a whole category of other deals.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkBuyoutClawback(lower) {
  const re = /buy-?out|claw-?back|liquidated damages|repay|refund.{0,30}(transfer|leave)/;
  const m = re.exec(lower);
  if (!m) return null;
  return {
    id: 'buyout-clawback',
    severity: 'medium',
    title: 'Buyout / clawback provision',
    why: "You may owe money back if you transfer or the deal ends early.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkAutoRenewal(lower) {
  const re = /auto(matic)?(ally)? ?renew|evergreen|renews? unless|roll(s)? over/;
  const m = re.exec(lower);
  if (!m) return null;
  return {
    id: 'auto-renewal',
    severity: 'medium',
    title: 'Automatic renewal clause',
    why: "Renews automatically unless you cancel in time.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkIpAssignment(lower) {
  const re = /assign.{0,30}(intellectual property|all rights|work product)|work[- ]made[- ]for[- ]hire/;
  const m = re.exec(lower);
  if (!m) return null;
  return {
    id: 'ip-assignment',
    severity: 'medium',
    title: 'IP / work-made-for-hire assignment',
    why: "Signs over ownership of content/IP, not just usage.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkMoralityBroad(lower) {
  const re = /moral(s|ity) clause|terminate.{0,30}sole discretion|damage.{0,20}reputation/;
  const m = re.exec(lower);
  if (!m) return null;
  return {
    id: 'morality-broad',
    severity: 'low',
    title: 'Subjective morality / termination clause',
    why: "Lets them cancel based on subjective judgment.",
    excerpt: excerpt(lower, m.index),
  };
}

/** @param {string} lower @returns {ScanFlag|null} */
function checkMissingFtc(lower) {
  const hasSocialDeliverable = /post|social|instagram|tiktok/.test(lower);
  if (!hasSocialDeliverable) return null;
  const hasDisclosure = /#ad|sponsored|disclosure|material connection/.test(lower);
  if (hasDisclosure) return null;
  // flag at position of first social keyword
  const m = /post|social|instagram|tiktok/.exec(lower);
  return {
    id: 'missing-ftc',
    severity: 'low',
    title: 'No FTC disclosure language',
    why: "No FTC #ad disclosure mentioned — required for paid posts.",
    excerpt: excerpt(lower, m ? m.index : 0),
  };
}

// ── Severity order ────────────────────────────────────────────────────────────
const SEV_ORDER = { high: 0, medium: 1, low: 2 };

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Scan a contract text for NIL red flags.
 *
 * This is the LLM swap point: replace the body with an async LLM call that
 * returns the same `ScanResult` shape (same `flags`, `score`, `level`).
 *
 * @param {string} text — raw contract text (any case)
 * @returns {ScanResult}
 */
export function scanContract(text) {
  const lower = text.toLowerCase();

  /** @type {Array<(t: string) => ScanFlag|null>} */
  const rules = [
    checkPerpetualLikeness,
    checkAiReplica,
    checkPaymentVague,
    checkAgentFeeHigh,
    checkExclusivityBroad,
    checkBuyoutClawback,
    checkAutoRenewal,
    checkIpAssignment,
    checkMoralityBroad,
    checkMissingFtc,
  ];

  // Dedupe: each rule fires at most once (rules return null if no match)
  /** @type {ScanFlag[]} */
  const flags = rules.reduce((acc, rule) => {
    const flag = rule(lower);
    if (flag) acc.push(flag);
    return acc;
  }, []);

  // Order by severity (high first)
  flags.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const score = flags.reduce((sum, f) => sum + WEIGHTS[f.severity], 0);

  /** @type {'clear'|'caution'|'high-risk'} */
  const level = score === 0 ? 'clear' : score <= 3 ? 'caution' : 'high-risk';

  return { level, score, flags };
}
