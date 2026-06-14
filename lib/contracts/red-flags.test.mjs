// lib/contracts/red-flags.test.mjs
// TDD suite for the NIL contract red-flag scanner.
// Run: node --test lib/contracts/red-flags.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanContract, LLM_READY } from './red-flags.mjs';

// ── LLM_READY sentinel ────────────────────────────────────────────────────────

test('LLM_READY is false (rule-based, not LLM)', () => {
  assert.equal(LLM_READY, false);
});

// ── Rule 1: perpetual-likeness ────────────────────────────────────────────────

test('perpetual-likeness fires on perpetual worldwide license for name and likeness', () => {
  const text = `Brand is granted a perpetual, worldwide license to use Athlete's name,
    likeness, and image in all marketing materials without limitation.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'perpetual-likeness');
  assert.ok(flag, 'perpetual-likeness flag should be present');
  assert.equal(flag.severity, 'high');
  assert.ok(flag.excerpt.length > 0, 'excerpt should not be empty');
});

// ── Rule 2: ai-replica ────────────────────────────────────────────────────────

test('ai-replica fires on AI-generated digital likeness clause', () => {
  const text = `Sponsor reserves the right to create AI-generated content using a
    digital replica of Athlete's likeness for use in all media formats.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'ai-replica');
  assert.ok(flag, 'ai-replica flag should be present');
  assert.equal(flag.severity, 'high');
});

// ── Rule 3: payment-vague ─────────────────────────────────────────────────────

test('payment-vague fires on "at sole discretion" payment terms', () => {
  const text = `Payment shall be made at Brand's sole discretion upon completion
    of deliverables, subject to Brand's satisfaction with the content.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'payment-vague');
  assert.ok(flag, 'payment-vague flag should be present');
  assert.equal(flag.severity, 'high');
});

test('payment-vague fires on net-90 payment terms', () => {
  const text = `Compensation of $5,000 will be processed on a net 90 basis following
    content approval and publication verification.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'payment-vague');
  assert.ok(flag, 'payment-vague flag should be present');
});

// ── Rule 4: agent-fee-high ────────────────────────────────────────────────────

test('agent-fee-high fires on "30% commission"', () => {
  const text = `Agent is entitled to a 30% commission on all gross earnings
    derived from this NIL agreement and any subsequent renewals.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'agent-fee-high');
  assert.ok(flag, 'agent-fee-high flag should be present for 30%');
  assert.equal(flag.severity, 'high');
});

test('agent-fee-high does NOT fire on "5% commission"', () => {
  const text = `Agent shall receive a standard 5% commission on all payments
    made pursuant to this representation agreement.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'agent-fee-high');
  assert.equal(flag, undefined, 'agent-fee-high should NOT fire for 5%');
});

// ── Rule 5: exclusivity-broad ─────────────────────────────────────────────────

test('exclusivity-broad fires on category-wide exclusivity', () => {
  const text = `This agreement grants Brand exclusive rights within the entire
    athletic footwear category. Athlete may not partner with any competitor
    or any similar brand during the term.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'exclusivity-broad');
  assert.ok(flag, 'exclusivity-broad flag should be present');
  assert.equal(flag.severity, 'medium');
});

// ── Rule 6: buyout-clawback ───────────────────────────────────────────────────

test('buyout-clawback fires on clawback provision', () => {
  const text = `In the event of early termination, Athlete agrees to a claw-back
    of all advance payments made within the prior 90 days if Athlete transfers
    to a competing program.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'buyout-clawback');
  assert.ok(flag, 'buyout-clawback flag should be present');
  assert.equal(flag.severity, 'medium');
});

// ── Rule 7: auto-renewal ──────────────────────────────────────────────────────

test('auto-renewal fires on evergreen renewal clause', () => {
  const text = `This agreement is evergreen and automatically renews for successive
    one-year terms unless either party provides 60 days written notice of
    termination prior to the renewal date.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'auto-renewal');
  assert.ok(flag, 'auto-renewal flag should be present');
  assert.equal(flag.severity, 'medium');
});

// ── Rule 8: ip-assignment ─────────────────────────────────────────────────────

test('ip-assignment fires on work-made-for-hire clause', () => {
  const text = `All content created under this agreement shall be considered
    work made for hire. Athlete hereby assigns all intellectual property
    rights, title, and interest to Brand in perpetuity.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'ip-assignment');
  assert.ok(flag, 'ip-assignment flag should be present');
  assert.equal(flag.severity, 'medium');
});

// ── Rule 9: morality-broad ────────────────────────────────────────────────────

test('morality-broad fires on morality clause', () => {
  const text = `Brand may terminate this agreement at sole discretion if Athlete
    engages in conduct that Brand determines may damage or harm Brand's
    reputation in any way.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'morality-broad');
  assert.ok(flag, 'morality-broad flag should be present');
  assert.equal(flag.severity, 'low');
});

// ── Rule 10: missing-ftc ──────────────────────────────────────────────────────

test('missing-ftc fires when social deliverable with no disclosure language', () => {
  const text = `Athlete shall post two Instagram reels and three TikTok videos
    per month. All social content must tag the Brand account.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'missing-ftc');
  assert.ok(flag, 'missing-ftc flag should be present');
  assert.equal(flag.severity, 'low');
});

test('missing-ftc does NOT fire when #ad disclosure is present', () => {
  const text = `Athlete shall post two Instagram reels per month. All posts must
    include the #ad or #sponsored disclosure per FTC guidelines.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'missing-ftc');
  assert.equal(flag, undefined, 'missing-ftc should NOT fire when disclosure is present');
});

// ── Clean contract → 'clear' ──────────────────────────────────────────────────

test('clean professional contract returns level clear and 0 flags', () => {
  const text = `
    This Name, Image, and Likeness Agreement ("Agreement") is entered into by
    and between SportsBrand Inc. ("Brand") and the Athlete for a term of one (1)
    year commencing January 1, 2026.

    COMPENSATION: Brand shall pay Athlete $10,000 within 30 days of execution.
    Payment is unconditional and not subject to approval or satisfaction.

    USAGE RIGHTS: Brand may use Athlete's name and likeness for Brand's
    footwear product line only, for the term of this Agreement. All rights
    revert to Athlete upon expiration.

    DELIVERABLES: Athlete shall create four (4) social media posts per month
    featuring Brand products. All posts must include #ad and #sponsored tags
    per FTC disclosure requirements and material connection disclosure.

    AGENT FEES: Athlete's agent shall receive a 10% commission on all
    payments pursuant to this Agreement.

    RENEWAL: This Agreement expires at the end of the term and does not
    renew automatically. Extension requires written consent of both parties.

    TERMINATION: Either party may terminate with 30 days written notice.
    Brand may not terminate based on subjective or reputational concerns
    without documented breach.
  `;
  const result = scanContract(text);
  assert.equal(result.level, 'clear', `expected clear, got ${result.level}`);
  assert.equal(result.score, 0, `expected score 0, got ${result.score}`);
  assert.equal(result.flags.length, 0, `expected 0 flags, got ${result.flags.length}`);
});

// ── Score → level thresholds ──────────────────────────────────────────────────

test('score 0 → clear', () => {
  const result = scanContract('This is a clean agreement with no problematic clauses.');
  assert.equal(result.level, 'clear');
  assert.equal(result.score, 0);
});

test('score ≤3 → caution (one medium flag)', () => {
  // One medium flag (score=2) → caution
  const text = `This agreement is evergreen and automatically renews for one-year
    terms unless either party provides 60 days written notice.`;
  const result = scanContract(text);
  assert.equal(result.level, 'caution');
  assert.ok(result.score <= 3, `score should be ≤3, got ${result.score}`);
});

test('score >3 → high-risk (two high flags)', () => {
  // two high flags = score 6 → high-risk
  const text = `Brand receives a perpetual, worldwide license for Athlete's likeness.
    Payment is at Brand's sole discretion subject to Brand's approval.`;
  const result = scanContract(text);
  assert.equal(result.level, 'high-risk');
  assert.ok(result.score > 3, `score should be >3, got ${result.score}`);
});

// ── Excerpt is captured ───────────────────────────────────────────────────────

test('flags include a non-empty excerpt', () => {
  const text = `Agent is entitled to a 35% commission on all gross earnings.`;
  const result = scanContract(text);
  const flag = result.flags[0];
  assert.ok(flag, 'should have at least one flag');
  assert.ok(typeof flag.excerpt === 'string' && flag.excerpt.length > 0, 'excerpt should be non-empty string');
});

// ── Deduplicate: each rule fires at most once ─────────────────────────────────

test('dedupe: morality clause mentioned twice fires exactly once', () => {
  const text = `Brand may terminate at sole discretion if Athlete damages Brand reputation.
    Additionally Brand may terminate at sole discretion for any conduct that
    may damage Brand reputation worldwide.`;
  const result = scanContract(text);
  const moralityFlags = result.flags.filter(f => f.id === 'morality-broad');
  assert.equal(moralityFlags.length, 1, 'morality-broad should fire at most once');
});

// ── Flags are ordered high → medium → low ────────────────────────────────────

test('flags are sorted: high severity comes before medium and low', () => {
  // hit perpetual-likeness (high) + auto-renewal (medium) + morality-broad (low)
  const text = `
    Brand receives a perpetual worldwide license to use Athlete's name and likeness.
    This agreement automatically renews unless cancelled.
    Brand may terminate at sole discretion if Athlete damages Brand reputation.
  `;
  const result = scanContract(text);
  const sevs = result.flags.map(f => f.severity);
  const ORDER = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < sevs.length; i++) {
    assert.ok(
      ORDER[sevs[i]] >= ORDER[sevs[i - 1]],
      `flags not sorted: ${sevs[i - 1]} came before ${sevs[i]}`
    );
  }
});
