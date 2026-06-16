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

// ── Regression: 3-digit (>=100%) agent fees must still flag ─────────────────
// BUG: the percentage matcher was /\b([2-9][0-9])\s?%/ — two-digit only — so a
// 100% (or higher) agent commission produced ZERO flags, despite being the most
// egregious "fee above norm" case the rule is meant to catch.
test('agent-fee-high fires on "100% commission" (regression: 3-digit pct)', () => {
  const text = `Agent is entitled to a 100% commission on all gross earnings.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'agent-fee-high');
  assert.ok(flag, 'agent-fee-high should fire for 100%');
  assert.equal(flag.severity, 'high');
});

test('agent-fee-high fires on "250% commission" (3-digit pct)', () => {
  const result = scanContract('Agent commission of 250% on all earnings applies.');
  assert.ok(result.flags.find(f => f.id === 'agent-fee-high'), '250% should flag');
});

test('agent-fee-high does NOT fire on "19% commission" (within 10–20% norm)', () => {
  const result = scanContract('Agent fee of 19% on all payments.');
  assert.equal(result.flags.find(f => f.id === 'agent-fee-high'), undefined, '19% must not fire');
});

test('agent-fee-high does NOT false-positive on a non-fee "100 days" figure', () => {
  // No percent sign + no fee/commission/agent word nearby → must not fire.
  const result = scanContract('The campaign runs for 100 days across all channels.');
  assert.equal(result.flags.find(f => f.id === 'agent-fee-high'), undefined, '100 days must not fire');
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

test('score exactly 3 → caution (boundary: <=3 is caution)', () => {
  // A single high-severity flag is worth exactly 3.
  const text = `Brand granted a perpetual worldwide license to use Athlete name and likeness.`;
  const result = scanContract(text);
  assert.equal(result.score, 3, `expected score 3, got ${result.score}`);
  assert.equal(result.level, 'caution', 'score 3 sits on the caution side of the boundary');
});

test('score exactly 4 → high-risk (boundary: >3 is high-risk)', () => {
  // Two medium flags (2 + 2) = exactly 4, with no other rule firing.
  const text = `This agreement automatically renews unless cancelled. Upon transfer Athlete must repay all advance amounts as liquidated damages.`;
  const result = scanContract(text);
  assert.equal(result.score, 4, `expected score 4, got ${result.score}`);
  assert.equal(result.level, 'high-risk', 'score 4 crosses into high-risk');
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

// ── Edge cases: branch coverage for the negation / window guards ─────────────

test('perpetual-likeness does NOT fire on "all rights revert" (athlete-favourable)', () => {
  // "all rights" alone must not trip the rule — only when paired with a
  // grant/assign/transfer verb. "all rights revert to Athlete" is favourable.
  const text = `Upon expiration of the term, all rights to Athlete's name and
    likeness revert fully to Athlete with no further obligation.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'perpetual-likeness');
  assert.equal(flag, undefined, 'should not fire when rights revert to athlete');
});

test('perpetual-likeness fires on "all rights ... assign" + likeness pairing', () => {
  // Exercise the (all rights).{0,30}(grant|assign|transfer|convey) alternative.
  const text = `Athlete shall assign all rights and transfer all interest in
    Athlete's likeness and image to Brand under this agreement.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'perpetual-likeness');
  assert.ok(flag, 'perpetual-likeness should fire on all-rights+assign+likeness');
  assert.equal(flag.severity, 'high');
});

test('perpetual-likeness does NOT fire when no likeness term within window', () => {
  // "perpetual" present but nothing about name/image/likeness nearby → null.
  const text = `This software license is granted in perpetuity for use of the
    Brand's proprietary scheduling platform and back-office tooling.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'perpetual-likeness');
  assert.equal(flag, undefined, 'no likeness in window → no flag');
});

test('ai-replica does NOT fire when AI term has no likeness/image/voice nearby', () => {
  const text = `Brand uses artificial intelligence to optimize ad placement and
    audience targeting across its programmatic media buys.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'ai-replica');
  assert.equal(flag, undefined, 'AI without likeness in window → no flag');
});

test('payment-vague does NOT fire on negated "not subject to approval"', () => {
  // The `\bnot\b` lookbehind guard should suppress the false positive.
  const text = `Payment of $8,000 is guaranteed and not subject to approval or
    satisfaction by Brand, due within 15 days of signing.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'payment-vague');
  assert.equal(flag, undefined, 'negated approval clause should not fire');
});

test('missing-ftc does NOT fire when "material connection" disclosure present', () => {
  // Exercises the disclosure alternative other than #ad/sponsored.
  const text = `Athlete shall post monthly TikTok content. Each post must clearly
    state the material connection between Athlete and Brand.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'missing-ftc');
  assert.equal(flag, undefined, 'material-connection disclosure should suppress');
});

test('excerpt gets a leading ellipsis when match is deep into long text', () => {
  // Pad with >150 chars of filler before a high-fee clause so the match index
  // is far from 0, triggering the `start > 0` leading-ellipsis branch.
  const filler = 'general boilerplate terms and conditions section. '.repeat(6);
  const text = `${filler} Agent is entitled to a 40% commission on all earnings.`;
  const result = scanContract(text);
  const flag = result.flags.find(f => f.id === 'agent-fee-high');
  assert.ok(flag, 'agent-fee-high should fire on 40%');
  assert.ok(flag.excerpt.startsWith('…'), `expected leading ellipsis, got: ${flag.excerpt}`);
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
