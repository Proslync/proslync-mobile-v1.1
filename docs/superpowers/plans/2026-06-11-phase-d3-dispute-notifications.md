# Phase D3 — Dispute Resolution + Deal Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full §5 dispute ladder (brand raises → athlete responds in 48h → admin determination → payment released or refunded) on the deal cockpit milestone board, plus wire deal-event notifications into a new bell icon on both the deal cockpit header and the athlete Deals tab header.

**Architecture:** Pure logic lives in `engine.mjs` + `.d.ts` (node-testable, no TS toolchain needed). Types extend `deal-engine.types.ts`. The cockpit dispute flow replaces the current `Alert.prompt` stub with bottom-sheet Modals following the `dev-login-sheet.tsx` pattern (Modal + FadeIn scrim + SlideInDown panel). Notifications use a new `deriveDealNotifications` engine function; `NotificationSheet` receives an optional `extraItems` prop so deal notifications prepend its existing list without touching its internals.

**Tech Stack:** React Native / Expo, TypeScript, node:test (pure logic), AsyncStorage, Ionicons, react-native-reanimated (`SlideInDown` / `FadeIn`), `@react-native-async-storage/async-storage`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/types/deal-engine.types.ts` | Modify | Add `DisputeCase`, `'refunded'` to `MilestoneStatus`, new event kinds, `dispute` field on `EngineMilestone` |
| `lib/deal-engine/engine.mjs` | Modify | Add `athleteResponseDeadline`, `isResponseOverdue`, `deriveDealNotifications` |
| `lib/deal-engine/engine.d.ts` | Modify | Declare new exports + `DealNotification` interface |
| `lib/deal-engine/engine.ts` | Modify | Re-export new typed wrappers |
| `lib/deal-engine/engine.test.mjs` | Modify | Add ≥6 new tests for the three new functions |
| `app/deal-engine/[id].tsx` | Modify | Replace `handleMilestoneDispute` Alert stub with full dispute flow; add `DisputePanel`, `DisputeSheet`, `ResponseSheet`, `DeterminationSheet`; add bell icon to navBar |
| `components/shared/notification-sheet.tsx` | Modify | Add optional `extraItems` prop prepended to activity list |
| `components/athlete/athlete-deals-section.tsx` | Modify | Add bell icon + unread count dot to `AthleteDealsSection` header row; mount `NotificationSheet` locally |

---

## Task 1: Extend Types

**Files:**
- Modify: `lib/types/deal-engine.types.ts`

- [ ] **Step 1: Add `DisputeCase` interface, `'refunded'` status, new event kinds**

  Open `lib/types/deal-engine.types.ts`. Make the following changes:

  Change the `MilestoneStatus` union (currently line 48-55) to add `'refunded'`:
  ```ts
  export type MilestoneStatus =
    | 'pending'
    | 'submitted'
    | 'approved'
    | 'auto-approved'
    | 'disputed'
    | 'paid'
    | 'refunded';
  ```

  Add `DisputeCase` interface after the `MilestoneStatus` block:
  ```ts
  export interface DisputeCase {
    reason: string;
    openedAtISO: string;
    openedBy: 'brand';
    athleteResponse?: string;
    respondedAtISO?: string;
    /** ISO of athlete's response deadline (+48h from openedAtISO) */
    athleteResponseDeadlineISO: string;
    determination?: {
      decision: 'release' | 'refund';
      reasoning: string;
      decidedAtISO: string;
    };
  }
  ```

  Add `dispute?: DisputeCase` to `EngineMilestone` (after `autoApproveAt?`):
  ```ts
  /** Present when status is disputed */
  dispute?: DisputeCase;
  ```

  Extend the `DealEventKind` union to add the new event kinds (after `'note-added'`):
  ```ts
  | 'dispute-opened'
  | 'dispute-response'
  | 'dispute-escalated'
  | 'dispute-determination'
  | 'milestone-refunded'
  | 'escrow-refunded'
  ```

- [ ] **Step 2: Verify TypeScript compiles without new errors**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: number ≤ 148.

- [ ] **Step 3: Commit**

  ```bash
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  git add lib/types/deal-engine.types.ts
  git commit -m "$(cat <<'EOF'
  feat(d3/types): DisputeCase + refunded status + dispute event kinds

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Engine Logic + Tests

**Files:**
- Modify: `lib/deal-engine/engine.mjs`
- Modify: `lib/deal-engine/engine.test.mjs`
- Modify: `lib/deal-engine/engine.d.ts`
- Modify: `lib/deal-engine/engine.ts`

- [ ] **Step 1: Write failing tests for the three new functions**

  Add these tests to the bottom of `lib/deal-engine/engine.test.mjs` (after the escrowCoverage block). Also add `athleteResponseDeadline`, `isResponseOverdue`, `deriveDealNotifications` to the import at the top:

  ```js
  import {
    generateDealId,
    computeFees,
    milestoneAutoApproveAt,
    isAutoApproved,
    escrowCoverage,
    athleteResponseDeadline,
    isResponseOverdue,
    deriveDealNotifications,
  } from './engine.mjs';
  ```

  Then add the tests:

  ```js
  // ── athleteResponseDeadline ───────────────────────────────────────────────

  test('athleteResponseDeadline: returns +48h from openedISO', () => {
    const opened = '2026-06-10T12:00:00.000Z';
    const deadline = athleteResponseDeadline(opened);
    const expected = new Date('2026-06-10T12:00:00.000Z');
    expected.setTime(expected.getTime() + 48 * 60 * 60 * 1000);
    assert.equal(deadline, expected.toISOString());
  });

  test('athleteResponseDeadline: 48h after midnight is correct', () => {
    const opened = '2026-06-12T00:00:00.000Z';
    const deadline = athleteResponseDeadline(opened);
    assert.equal(deadline, '2026-06-14T00:00:00.000Z');
  });

  // ── isResponseOverdue ─────────────────────────────────────────────────────

  test('isResponseOverdue: returns false before deadline', () => {
    const deadline = '2026-06-14T12:00:00.000Z';
    const now = '2026-06-13T12:00:00.000Z'; // 24h before
    assert.equal(isResponseOverdue(deadline, now), false);
  });

  test('isResponseOverdue: returns false at exactly deadline', () => {
    const deadline = '2026-06-14T12:00:00.000Z';
    const now = '2026-06-14T12:00:00.000Z';
    assert.equal(isResponseOverdue(deadline, now), false);
  });

  test('isResponseOverdue: returns true after deadline', () => {
    const deadline = '2026-06-14T12:00:00.000Z';
    const now = '2026-06-14T12:00:01.000Z'; // 1s after
    assert.equal(isResponseOverdue(deadline, now), true);
  });

  // ── deriveDealNotifications ───────────────────────────────────────────────

  test('deriveDealNotifications: escrow-funded event produces escrow-funded notification', () => {
    const deal = {
      dealId: 'PSY-2026-TEST001',
      escrow: { state: 'funded', fundedCents: 100000, releasedCents: 0 },
      milestones: [],
      events: [
        { at: '2026-06-10T10:00:00.000Z', actor: 'brand', kind: 'escrow-funded', note: 'Funded' },
      ],
    };
    const now = '2026-06-11T10:00:00.000Z';
    const notifs = deriveDealNotifications([deal], now);
    assert.ok(notifs.some((n) => n.kind === 'escrow-funded' && n.dealId === 'PSY-2026-TEST001'));
  });

  test('deriveDealNotifications: auto-approve-imminent when submitted milestone deadline <12h', () => {
    const submittedISO = '2026-06-08T13:00:00.000Z'; // submitted 71h ago
    // autoApproveAt = 2026-06-08T13:00:00 + 72h = 2026-06-11T13:00:00
    const now = '2026-06-11T02:00:00.000Z'; // 11h before autoApproveAt
    const deal = {
      dealId: 'PSY-2026-TEST002',
      escrow: { state: 'funded', fundedCents: 100000, releasedCents: 0 },
      milestones: [
        {
          id: 'ms-1',
          status: 'submitted',
          submittedISO,
          autoApproveAt: milestoneAutoApproveAt(submittedISO),
          description: 'Test milestone',
          amountCents: 50000,
        },
      ],
      events: [],
    };
    const notifs = deriveDealNotifications([deal], now);
    assert.ok(notifs.some((n) => n.kind === 'auto-approve-imminent' && n.dealId === 'PSY-2026-TEST002'));
  });

  test('deriveDealNotifications: result is capped at 10 and newest-first', () => {
    // Create 15 escrow-funded events across 15 deals
    const deals = Array.from({ length: 15 }, (_, i) => ({
      dealId: `PSY-2026-T${String(i).padStart(3, '0')}`,
      escrow: { state: 'funded', fundedCents: 10000, releasedCents: 0 },
      milestones: [],
      events: [{
        at: `2026-06-${String(1 + i).padStart(2, '0')}T10:00:00.000Z`,
        actor: 'brand',
        kind: 'escrow-funded',
        note: 'Funded',
      }],
    }));
    const now = '2026-06-20T00:00:00.000Z';
    const notifs = deriveDealNotifications(deals, now);
    assert.equal(notifs.length, 10);
    // newest-first: atISO should be descending
    for (let i = 0; i < notifs.length - 1; i++) {
      assert.ok(notifs[i].atISO >= notifs[i + 1].atISO);
    }
  });
  ```

- [ ] **Step 2: Run tests — confirm they all fail with "not exported" errors**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  node --test lib/deal-engine/engine.test.mjs 2>&1 | tail -8
  ```
  Expected: new tests fail with `TypeError: athleteResponseDeadline is not a function` or similar.

- [ ] **Step 3: Add the three functions to `engine.mjs`**

  Append to the bottom of `lib/deal-engine/engine.mjs`:

  ```js
  // ── Dispute deadline ──────────────────────────────────────────────────────

  /**
   * Compute the ISO timestamp at which an athlete's dispute response is due.
   * Response window is 48 hours from when the dispute was opened.
   *
   * @param {string} openedISO - ISO 8601 timestamp when brand opened the dispute
   * @returns {string} ISO 8601 response deadline (+48h)
   */
  export function athleteResponseDeadline(openedISO) {
    const d = new Date(openedISO);
    d.setTime(d.getTime() + 48 * 60 * 60 * 1000);
    return d.toISOString();
  }

  /**
   * Determine whether the athlete response window has passed.
   *
   * @param {string} deadlineISO - ISO 8601 response deadline
   * @param {string} nowISO      - ISO 8601 "current time" (injected for determinism)
   * @returns {boolean}
   */
  export function isResponseOverdue(deadlineISO, nowISO) {
    return new Date(nowISO).getTime() > new Date(deadlineISO).getTime();
  }

  // ── Deal notifications ────────────────────────────────────────────────────

  /**
   * Derive a newest-first list of deal notifications (max 10) from deal events
   * and live milestone state.
   *
   * Sources:
   *   - escrow-funded events          → kind 'escrow-funded'
   *   - milestone-submitted events    → kind 'milestone-submitted'
   *   - milestone-auto-approved events → kind 'milestone-auto-approved'
   *   - milestone-paid events         → kind 'payout'
   *   - dispute-opened events         → kind 'disputed'
   *   - dispute-determination events  → kind 'determination'
   *   - Live: submitted milestone with autoApproveAt <12h from now  → kind 'auto-approve-imminent'
   *   - Live: disputed milestone with unanswered response deadline <48h from now → kind 'response-due'
   *
   * @param {Array<object>} deals  - array of EngineDeal-shaped objects
   * @param {string} nowISO        - ISO 8601 current time (injected)
   * @returns {Array<{id: string, dealId: string, atISO: string, kind: string, title: string, body: string}>}
   */
  export function deriveDealNotifications(deals, nowISO) {
    const nowMs = new Date(nowISO).getTime();
    /** @type {Array<{id: string, dealId: string, atISO: string, kind: string, title: string, body: string}>} */
    const items = [];

    for (const deal of deals) {
      const dealId = deal.dealId;

      // ── Event-based notifications ──────────────────────────────────────────
      for (const ev of deal.events ?? []) {
        switch (ev.kind) {
          case 'escrow-funded':
            items.push({
              id: `${dealId}:${ev.at}:escrow-funded`,
              dealId,
              atISO: ev.at,
              kind: 'escrow-funded',
              title: 'Escrow Funded',
              body: `Escrow has been funded for deal ${dealId}.`,
            });
            break;
          case 'milestone-submitted':
            items.push({
              id: `${dealId}:${ev.at}:milestone-submitted`,
              dealId,
              atISO: ev.at,
              kind: 'milestone-submitted',
              title: 'Milestone Submitted',
              body: ev.note ?? `A milestone was submitted on deal ${dealId}.`,
            });
            break;
          case 'milestone-auto-approved':
            items.push({
              id: `${dealId}:${ev.at}:milestone-auto-approved`,
              dealId,
              atISO: ev.at,
              kind: 'milestone-auto-approved',
              title: 'Milestone Auto-Approved',
              body: ev.note ?? `A milestone was auto-approved on deal ${dealId}.`,
            });
            break;
          case 'milestone-paid':
            items.push({
              id: `${dealId}:${ev.at}:payout`,
              dealId,
              atISO: ev.at,
              kind: 'payout',
              title: 'Payout Released',
              body: ev.note ?? `Payout released on deal ${dealId}.`,
            });
            break;
          case 'dispute-opened':
            items.push({
              id: `${dealId}:${ev.at}:disputed`,
              dealId,
              atISO: ev.at,
              kind: 'disputed',
              title: 'Dispute Opened',
              body: ev.note ?? `A dispute was opened on deal ${dealId}.`,
            });
            break;
          case 'dispute-determination':
            items.push({
              id: `${dealId}:${ev.at}:determination`,
              dealId,
              atISO: ev.at,
              kind: 'determination',
              title: 'Dispute Determination',
              body: ev.note ?? `Admin determination issued on deal ${dealId}.`,
            });
            break;
          default:
            break;
        }
      }

      // ── Live-state notifications ───────────────────────────────────────────
      for (const m of deal.milestones ?? []) {
        // auto-approve-imminent: submitted + autoApproveAt within 12h
        if (
          m.status === 'submitted' &&
          m.autoApproveAt &&
          !items.some((i) => i.id === `${dealId}:${m.id}:auto-approve-imminent`)
        ) {
          const autoMs = new Date(m.autoApproveAt).getTime();
          const hoursRemaining = (autoMs - nowMs) / (1000 * 60 * 60);
          if (hoursRemaining > 0 && hoursRemaining < 12) {
            items.push({
              id: `${dealId}:${m.id}:auto-approve-imminent`,
              dealId,
              atISO: nowISO,
              kind: 'auto-approve-imminent',
              title: 'Auto-Approve Imminent',
              body: `Milestone "${m.description}" auto-approves in ${Math.ceil(hoursRemaining)}h on deal ${dealId}.`,
            });
          }
        }

        // response-due: disputed + no athleteResponse + deadline within 48h
        if (
          m.status === 'disputed' &&
          m.dispute &&
          !m.dispute.athleteResponse &&
          !items.some((i) => i.id === `${dealId}:${m.id}:response-due`)
        ) {
          const deadlineMs = new Date(m.dispute.athleteResponseDeadlineISO).getTime();
          const hoursRemaining = (deadlineMs - nowMs) / (1000 * 60 * 60);
          if (hoursRemaining > 0 && hoursRemaining <= 48) {
            items.push({
              id: `${dealId}:${m.id}:response-due`,
              dealId,
              atISO: nowISO,
              kind: 'response-due',
              title: 'Response Due',
              body: `You have ${Math.ceil(hoursRemaining)}h to respond to the dispute on deal ${dealId}.`,
            });
          }
        }
      }
    }

    // Sort newest-first, cap at 10
    items.sort((a, b) => new Date(b.atISO).getTime() - new Date(a.atISO).getTime());
    return items.slice(0, 10);
  }
  ```

- [ ] **Step 4: Run tests — all must pass**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  node --test lib/deal-engine/engine.test.mjs lib/compliance/preclearance.test.mjs lib/athlete/truth.test.mjs 2>&1 | tail -3
  ```
  Expected: `ℹ fail 0` on the last line.

- [ ] **Step 5: Update `engine.d.ts` to declare the new exports**

  Append to `lib/deal-engine/engine.d.ts`:

  ```ts
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
  ```

- [ ] **Step 6: Update `engine.ts` to re-export new typed wrappers**

  Add these imports and exports to `lib/deal-engine/engine.ts` (after the existing block):

  ```ts
  import {
    athleteResponseDeadline as _athleteResponseDeadline,
    isResponseOverdue as _isResponseOverdue,
    deriveDealNotifications as _deriveDealNotifications,
  } from './engine.mjs';

  import type { DealNotification } from './engine.d';

  export type { DealNotification };

  export const athleteResponseDeadline = _athleteResponseDeadline as (
    openedISO: string,
  ) => string;

  export const isResponseOverdue = _isResponseOverdue as (
    deadlineISO: string,
    nowISO: string,
  ) => boolean;

  export const deriveDealNotifications = _deriveDealNotifications as (
    deals: Parameters<typeof _deriveDealNotifications>[0],
    nowISO: string,
  ) => DealNotification[];
  ```

- [ ] **Step 7: Verify TS error count ≤ 148**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: ≤ 148.

- [ ] **Step 8: Commit**

  ```bash
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  git add lib/deal-engine/engine.mjs lib/deal-engine/engine.d.ts lib/deal-engine/engine.ts lib/deal-engine/engine.test.mjs
  git commit -m "$(cat <<'EOF'
  feat(d3/engine): athleteResponseDeadline + isResponseOverdue + deriveDealNotifications + 9 new tests

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: Cockpit Dispute Flow

**Files:**
- Modify: `app/deal-engine/[id].tsx`

This is the largest task. We'll replace the `handleMilestoneDispute` Alert stub and add:
1. `DisputeSheet` — bottom Modal for brand to enter a reason
2. `DisputePanel` — expanded section inside a disputed MilestoneRow showing reason, countdown, RESPOND button (athlete), ESCALATE button (both after response/overdue)
3. `ResponseSheet` — bottom Modal for athlete to enter a response
4. `DeterminationSheet` — bottom Modal for admin determination (DEMO pill)

New imports needed at the top of `[id].tsx`:
- `Modal` (already imported)
- `FadeIn, FadeOut, SlideInDown, SlideOutDown` from `react-native-reanimated`
- `athleteResponseDeadline` from `@/lib/deal-engine/engine`
- `DisputeCase` from `@/lib/types/deal-engine.types`
- `Ionicons` from `@expo/vector-icons`

- [ ] **Step 1: Add new imports to `app/deal-engine/[id].tsx`**

  At the top of the file, the existing import from `@/lib/deal-engine/engine` currently reads:
  ```ts
  import { computeFees, isAutoApproved, milestoneAutoApproveAt } from '@/lib/deal-engine/engine';
  ```
  Change it to:
  ```ts
  import { computeFees, isAutoApproved, milestoneAutoApproveAt, athleteResponseDeadline } from '@/lib/deal-engine/engine';
  ```

  Add to the existing RN import:
  ```ts
  import { ..., Modal, KeyboardAvoidingView, Platform } from 'react-native';
  ```
  (Add `Modal`, `KeyboardAvoidingView`, `Platform` to the existing destructured import — `Modal` may already be there; only add what's missing.)

  Add to the `react-native-reanimated` import (currently not imported in this file):
  ```ts
  import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
  ```

  Add to the `@/lib/types/deal-engine.types` import:
  ```ts
  import type { EngineDeal, EngineMilestone, DealEvent, MilestoneStatus, EngineDealStatus, DisputeCase } from '@/lib/types/deal-engine.types';
  ```

  Add Ionicons import:
  ```ts
  import { Ionicons } from '@expo/vector-icons';
  ```

- [ ] **Step 2: Add `statusColor` case for `'refunded'`**

  Find the `statusColor` function (around line 98). Add the `refunded` case:
  ```ts
  function statusColor(status: MilestoneStatus): string {
    switch (status) {
      case 'paid': return SUCCESS;
      case 'approved':
      case 'auto-approved': return SUCCESS;
      case 'submitted': return WARNING;
      case 'disputed': return DANGER;
      case 'refunded': return MUTED;
      case 'pending': return MUTED;
      default: return MUTED;
    }
  }
  ```

- [ ] **Step 3: Add `DisputeSheet` component (brand raises dispute)**

  Add this component before the `MilestoneRow` component definition:

  ```tsx
  // ── DisputeSheet ──────────────────────────────────────────────────────────

  function DisputeSheet({
    visible,
    onClose,
    onSubmit,
    milestoneDescription,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    milestoneDescription: string;
  }) {
    const insets = useSafeAreaInsets();
    const [reason, setReason] = React.useState('');
    const MIN_LENGTH = 10;
    const canSubmit = reason.trim().length >= MIN_LENGTH;

    function handleSubmit() {
      if (!canSubmit) return;
      onSubmit(reason.trim());
      setReason('');
    }

    function handleClose() {
      setReason('');
      onClose();
    }

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={sheetStyles.backdrop}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            <Animated.View
              entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
              exiting={SlideOutDown.duration(160)}
              style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 20 }]}
            >
              <View style={sheetStyles.handle} />
              <Text style={sheetStyles.sheetTitle}>Dispute Milestone</Text>
              <Text style={sheetStyles.sheetSubtitle} numberOfLines={2}>
                {milestoneDescription}
              </Text>
              <Text style={sheetStyles.fieldLabel}>Reason for dispute</Text>
              <TextInput
                style={sheetStyles.textInput}
                placeholder="Describe why this milestone does not meet the agreed specification…"
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={4}
                value={reason}
                onChangeText={setReason}
                autoFocus
                accessibilityLabel="Dispute reason"
              />
              <Text style={sheetStyles.charHint}>
                {reason.trim().length < MIN_LENGTH
                  ? `${MIN_LENGTH - reason.trim().length} more characters required`
                  : '✓ Ready to submit'}
              </Text>
              <TouchableOpacity
                style={[sheetStyles.submitBtn, !canSubmit && sheetStyles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Submit dispute"
              >
                <Text style={sheetStyles.submitBtnText}>SUBMIT DISPUTE</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  ```

- [ ] **Step 4: Add `ResponseSheet` component (athlete responds)**

  Add after `DisputeSheet`:

  ```tsx
  // ── ResponseSheet ─────────────────────────────────────────────────────────

  function ResponseSheet({
    visible,
    onClose,
    onSubmit,
    milestoneDescription,
    disputeReason,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (response: string) => void;
    milestoneDescription: string;
    disputeReason: string;
  }) {
    const insets = useSafeAreaInsets();
    const [response, setResponse] = React.useState('');
    const MIN_LENGTH = 10;
    const canSubmit = response.trim().length >= MIN_LENGTH;

    function handleSubmit() {
      if (!canSubmit) return;
      onSubmit(response.trim());
      setResponse('');
    }

    function handleClose() {
      setResponse('');
      onClose();
    }

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={sheetStyles.backdrop}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            <Animated.View
              entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
              exiting={SlideOutDown.duration(160)}
              style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 20 }]}
            >
              <View style={sheetStyles.handle} />
              <Text style={sheetStyles.sheetTitle}>Respond to Dispute</Text>
              <Text style={sheetStyles.sheetSubtitle} numberOfLines={2}>
                {milestoneDescription}
              </Text>
              <View style={sheetStyles.quoteBlock}>
                <Text style={sheetStyles.quoteLabel}>BRAND'S REASON</Text>
                <Text style={sheetStyles.quoteText}>{disputeReason}</Text>
              </View>
              <Text style={sheetStyles.fieldLabel}>Your response</Text>
              <TextInput
                style={sheetStyles.textInput}
                placeholder="Explain how the milestone was completed as agreed…"
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={4}
                value={response}
                onChangeText={setResponse}
                autoFocus
                accessibilityLabel="Dispute response"
              />
              <Text style={sheetStyles.charHint}>
                {response.trim().length < MIN_LENGTH
                  ? `${MIN_LENGTH - response.trim().length} more characters required`
                  : '✓ Ready to submit'}
              </Text>
              <TouchableOpacity
                style={[sheetStyles.submitBtn, !canSubmit && sheetStyles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Submit response"
              >
                <Text style={sheetStyles.submitBtnText}>SUBMIT RESPONSE</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  ```

- [ ] **Step 5: Add `DeterminationSheet` component (admin determination)**

  Add after `ResponseSheet`:

  ```tsx
  // ── DeterminationSheet ────────────────────────────────────────────────────

  function DeterminationSheet({
    visible,
    onClose,
    onSubmit,
    milestoneDescription,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (decision: 'release' | 'refund', reasoning: string) => void;
    milestoneDescription: string;
  }) {
    const insets = useSafeAreaInsets();
    const [decision, setDecision] = React.useState<'release' | 'refund' | null>(null);
    const [reasoning, setReasoning] = React.useState('');
    const MIN_LENGTH = 10;
    const canSubmit = decision !== null && reasoning.trim().length >= MIN_LENGTH;

    function handleSubmit() {
      if (!canSubmit || !decision) return;
      onSubmit(decision, reasoning.trim());
      setDecision(null);
      setReasoning('');
    }

    function handleClose() {
      setDecision(null);
      setReasoning('');
      onClose();
    }

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={sheetStyles.backdrop}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            <Animated.View
              entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
              exiting={SlideOutDown.duration(160)}
              style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 20 }]}
            >
              <View style={sheetStyles.handle} />
              <View style={sheetStyles.titleRow}>
                <Text style={sheetStyles.sheetTitle}>Admin Determination</Text>
                <View style={sheetStyles.demoPill}>
                  <Text style={sheetStyles.demoPillText}>DEMO</Text>
                </View>
              </View>
              <Text style={sheetStyles.sheetSubtitle} numberOfLines={2}>
                {milestoneDescription}
              </Text>
              <Text style={sheetStyles.fieldLabel}>Decision</Text>
              <View style={sheetStyles.decisionRow}>
                <TouchableOpacity
                  style={[
                    sheetStyles.decisionBtn,
                    decision === 'release' && sheetStyles.decisionBtnRelease,
                  ]}
                  onPress={() => setDecision('release')}
                  activeOpacity={0.82}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: decision === 'release' }}
                  accessibilityLabel="Release payment"
                >
                  <Text
                    style={[
                      sheetStyles.decisionBtnText,
                      decision === 'release' && sheetStyles.decisionBtnTextRelease,
                    ]}
                  >
                    RELEASE PAYMENT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    sheetStyles.decisionBtn,
                    decision === 'refund' && sheetStyles.decisionBtnRefund,
                  ]}
                  onPress={() => setDecision('refund')}
                  activeOpacity={0.82}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: decision === 'refund' }}
                  accessibilityLabel="Refund brand"
                >
                  <Text
                    style={[
                      sheetStyles.decisionBtnText,
                      decision === 'refund' && sheetStyles.decisionBtnTextRefund,
                    ]}
                  >
                    REFUND BRAND
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={sheetStyles.fieldLabel}>Reasoning</Text>
              <TextInput
                style={sheetStyles.textInput}
                placeholder="State the reasoning for this determination…"
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={4}
                value={reasoning}
                onChangeText={setReasoning}
                accessibilityLabel="Determination reasoning"
              />
              <Text style={sheetStyles.charHint}>
                {reasoning.trim().length < MIN_LENGTH
                  ? `${MIN_LENGTH - reasoning.trim().length} more characters required`
                  : '✓ Ready to confirm'}
              </Text>
              <TouchableOpacity
                style={[sheetStyles.submitBtn, !canSubmit && sheetStyles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Confirm determination"
              >
                <Text style={sheetStyles.submitBtnText}>CONFIRM DETERMINATION</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  ```

- [ ] **Step 6: Add shared `sheetStyles` StyleSheet**

  Add after the `DeterminationSheet` component (before `MilestoneRow`):

  ```ts
  const sheetStyles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: '#0F0F0F',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 12,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignSelf: 'center',
      marginBottom: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: WHITE,
      flex: 1,
    },
    demoPill: {
      backgroundColor: 'rgba(255,214,10,0.12)',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,214,10,0.4)',
    },
    demoPillText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#FFD60A',
      letterSpacing: 1.2,
    },
    sheetSubtitle: {
      fontSize: 13,
      color: MUTED,
      fontWeight: '500',
      lineHeight: 18,
    },
    quoteBlock: {
      backgroundColor: 'rgba(255,69,58,0.07)',
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,69,58,0.25)',
      padding: 12,
      gap: 4,
    },
    quoteLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: DANGER,
      letterSpacing: 1,
    },
    quoteText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 18,
      fontStyle: 'italic',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: MUTED,
      letterSpacing: 0.8,
      marginTop: 4,
    },
    textInput: {
      backgroundColor: 'rgba(255,255,255,0.055)',
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CARD_BORDER,
      color: WHITE,
      fontSize: 14,
      fontWeight: '500',
      padding: 14,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charHint: {
      fontSize: 11,
      color: MUTED,
      fontWeight: '500',
    },
    submitBtn: {
      backgroundColor: COPPER,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      minHeight: 50,
      justifyContent: 'center',
      marginTop: 4,
    },
    submitBtnDisabled: {
      opacity: 0.38,
    },
    submitBtnText: {
      color: WHITE,
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    decisionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    decisionBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CARD_BORDER,
      alignItems: 'center',
      backgroundColor: CARD_BG,
      minHeight: 44,
      justifyContent: 'center',
    },
    decisionBtnRelease: {
      backgroundColor: 'rgba(48,209,88,0.12)',
      borderColor: SUCCESS,
    },
    decisionBtnRefund: {
      backgroundColor: 'rgba(255,69,58,0.10)',
      borderColor: DANGER,
    },
    decisionBtnText: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
      color: MUTED,
    },
    decisionBtnTextRelease: {
      color: SUCCESS,
    },
    decisionBtnTextRefund: {
      color: DANGER,
    },
  });
  ```

- [ ] **Step 7: Add `DisputePanel` inside `MilestoneRow`**

  Rewrite the `MilestoneRow` component to accept new props and render the dispute panel. Replace the existing `MilestoneRow` function (lines 485–611) with:

  ```tsx
  function MilestoneRow({
    milestone,
    lens,
    onSubmit,
    onApprove,
    onDispute,
    onRespond,
    onEscalate,
  }: {
    milestone: EngineMilestone;
    lens: Lens;
    onSubmit: (id: string) => void;
    onApprove: (id: string) => void;
    onDispute: (id: string) => void;
    onRespond: (id: string) => void;
    onEscalate: (id: string) => void;
  }) {
    const hasDeadline =
      milestone.status === 'submitted' && milestone.autoApproveAt;

    const dispute = milestone.dispute;
    const showDisputePanel = milestone.status === 'disputed' && !!dispute;
    const now = new Date().toISOString();
    const responseOverdue = dispute
      ? new Date(now).getTime() > new Date(dispute.athleteResponseDeadlineISO).getTime()
      : false;
    const hasResponse = !!dispute?.athleteResponse;
    const canEscalate = showDisputePanel && (hasResponse || responseOverdue);

    return (
      <View style={milestoneStyles.row}>
        <View style={milestoneStyles.rowTop}>
          <View style={milestoneStyles.statusDot}>
            <View
              style={[
                milestoneStyles.dot,
                { backgroundColor: statusColor(milestone.status) },
              ]}
            />
          </View>
          <View style={milestoneStyles.rowContent}>
            <Text style={milestoneStyles.desc} numberOfLines={2}>
              {milestone.description}
            </Text>
            <View style={milestoneStyles.metaRow}>
              <Text style={milestoneStyles.amount}>
                ${formatCents(milestone.amountCents)}
              </Text>
              <Text style={milestoneStyles.bullet}> · </Text>
              <Text style={milestoneStyles.due}>
                Due {new Date(milestone.dueISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={milestoneStyles.bullet}> · </Text>
              <View style={milestoneStyles.verifyChip}>
                <Text style={milestoneStyles.verifyText}>
                  {milestone.verificationMethod.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              milestoneStyles.statusPill,
              { borderColor: statusColor(milestone.status) },
            ]}
          >
            <Text
              style={[
                milestoneStyles.statusText,
                { color: statusColor(milestone.status) },
              ]}
            >
              {milestone.status.replace(/-/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 72h auto-approve countdown (submitted only) */}
        {hasDeadline && milestone.autoApproveAt && (
          <View style={milestoneStyles.countdownRow}>
            <View
              style={[
                milestoneStyles.countdownChip,
                { borderColor: countdownColor(milestone.autoApproveAt) },
              ]}
            >
              <Text
                style={[
                  milestoneStyles.countdownText,
                  { color: countdownColor(milestone.autoApproveAt) },
                ]}
              >
                AUTO-APPROVE IN {countdownLabel(milestone.autoApproveAt)}
              </Text>
            </View>
          </View>
        )}

        {/* Dispute panel — shown when status = disputed */}
        {showDisputePanel && dispute && (
          <View style={milestoneStyles.disputePanel}>
            {/* Dispute reason quote */}
            <View style={milestoneStyles.disputeQuote}>
              <Text style={milestoneStyles.disputeQuoteLabel}>BRAND'S REASON</Text>
              <Text style={milestoneStyles.disputeQuoteText}>{dispute.reason}</Text>
            </View>

            {/* Response countdown chip */}
            {!hasResponse && (
              <View style={milestoneStyles.countdownRow}>
                <View
                  style={[
                    milestoneStyles.countdownChip,
                    { borderColor: responseOverdue ? MUTED : countdownColor(dispute.athleteResponseDeadlineISO) },
                  ]}
                >
                  <Text
                    style={[
                      milestoneStyles.countdownText,
                      { color: responseOverdue ? MUTED : countdownColor(dispute.athleteResponseDeadlineISO) },
                    ]}
                  >
                    {responseOverdue
                      ? 'RESPONSE WINDOW PASSED'
                      : `ATHLETE RESPONSE DUE ${countdownLabel(dispute.athleteResponseDeadlineISO)}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Athlete's response (if submitted) */}
            {hasResponse && (
              <View style={milestoneStyles.responseBlock}>
                <Text style={milestoneStyles.responseLabel}>ATHLETE'S RESPONSE</Text>
                <Text style={milestoneStyles.responseText}>{dispute.athleteResponse}</Text>
                {dispute.respondedAtISO && (
                  <Text style={milestoneStyles.responseTime}>
                    {formatISO(dispute.respondedAtISO)}
                  </Text>
                )}
              </View>
            )}

            {/* Determination result (if decided) */}
            {dispute.determination && (
              <View
                style={[
                  milestoneStyles.determinationBlock,
                  {
                    borderColor:
                      dispute.determination.decision === 'release' ? SUCCESS : DANGER,
                    backgroundColor:
                      dispute.determination.decision === 'release'
                        ? 'rgba(48,209,88,0.07)'
                        : 'rgba(255,69,58,0.07)',
                  },
                ]}
              >
                <Text
                  style={[
                    milestoneStyles.determinationLabel,
                    { color: dispute.determination.decision === 'release' ? SUCCESS : DANGER },
                  ]}
                >
                  {dispute.determination.decision === 'release'
                    ? 'PAYMENT RELEASED'
                    : 'BRAND REFUNDED'}
                </Text>
                <Text style={milestoneStyles.determinationReasoning}>
                  {dispute.determination.reasoning}
                </Text>
                <Text style={milestoneStyles.determinationTime}>
                  {formatISO(dispute.determination.decidedAtISO)}
                </Text>
              </View>
            )}

            {/* Athlete: RESPOND button (if no response yet and window not passed) */}
            {lens === 'athlete' && !hasResponse && !responseOverdue && (
              <TouchableOpacity
                style={milestoneStyles.actionBtn}
                onPress={() => onRespond(milestone.id)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Respond to dispute for ${milestone.description}`}
              >
                <Text style={milestoneStyles.actionBtnText}>RESPOND</Text>
              </TouchableOpacity>
            )}

            {/* Both lenses: ESCALATE TO PROSLYNC ADMIN (after response or window passed, no determination yet) */}
            {canEscalate && !dispute.determination && (
              <TouchableOpacity
                style={milestoneStyles.escalateBtn}
                onPress={() => onEscalate(milestone.id)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Escalate to Proslync Admin for determination"
              >
                <Text style={milestoneStyles.escalateBtnText}>ESCALATE TO PROSLYNC ADMIN</Text>
                <View style={milestoneStyles.demoBadgeSmall}>
                  <Text style={milestoneStyles.demoBadgeSmallText}>DEMO</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Athlete actions */}
        {lens === 'athlete' && milestone.status === 'pending' && (
          <TouchableOpacity
            style={milestoneStyles.actionBtn}
            onPress={() => onSubmit(milestone.id)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`Submit completion for ${milestone.description}`}
          >
            <Text style={milestoneStyles.actionBtnText}>SUBMIT COMPLETION</Text>
          </TouchableOpacity>
        )}

        {/* Brand actions on submitted */}
        {lens === 'brand' && milestone.status === 'submitted' && (
          <View style={milestoneStyles.brandActions}>
            <TouchableOpacity
              style={milestoneStyles.approveBtn}
              onPress={() => onApprove(milestone.id)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={`Approve milestone ${milestone.description}`}
            >
              <Text style={milestoneStyles.approveBtnText}>APPROVE</Text>
              <View style={milestoneStyles.demoBadgeSmall}>
                <Text style={milestoneStyles.demoBadgeSmallText}>DEMO</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={milestoneStyles.disputeBtn}
              onPress={() => onDispute(milestone.id)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={`Dispute milestone ${milestone.description}`}
            >
              <Text style={milestoneStyles.disputeBtnText}>DISPUTE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
  ```

  Then add the new styles to `milestoneStyles`:

  ```ts
  disputePanel: {
    backgroundColor: 'rgba(255,69,58,0.05)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,69,58,0.22)',
    padding: 12,
    gap: 10,
  },
  disputeQuote: {
    gap: 4,
  },
  disputeQuoteLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: DANGER,
    letterSpacing: 1,
  },
  disputeQuoteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  responseBlock: {
    gap: 3,
  },
  responseLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: SUCCESS,
    letterSpacing: 1,
  },
  responseText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 17,
  },
  responseTime: {
    fontSize: 10,
    color: MUTED,
    fontFamily: 'Courier',
  },
  determinationBlock: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 4,
  },
  determinationLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  determinationReasoning: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 17,
  },
  determinationTime: {
    fontSize: 10,
    color: MUTED,
    fontFamily: 'Courier',
  },
  escalateBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 8,
  },
  escalateBtnText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ```

- [ ] **Step 8: Wire up state and handlers in `DealEngineCockpit`**

  In the main `DealEngineCockpit` component, add state for the three sheets after the existing `[loading, setLoading]` state:

  ```tsx
  const [disputeSheetMilestoneId, setDisputeSheetMilestoneId] = React.useState<string | null>(null);
  const [responseSheetMilestoneId, setResponseSheetMilestoneId] = React.useState<string | null>(null);
  const [determinationSheetMilestoneId, setDeterminationSheetMilestoneId] = React.useState<string | null>(null);
  const [notifSheetVisible, setNotifSheetVisible] = React.useState(false);
  ```

  Replace the existing `handleMilestoneDispute` function with:

  ```tsx
  // Open dispute sheet (brand lens) — replaces Alert.prompt stub
  function handleMilestoneDispute(milestoneId: string) {
    setDisputeSheetMilestoneId(milestoneId);
  }

  // Confirm dispute from sheet
  function handleDisputeConfirm(reason: string) {
    if (!deal || !disputeSheetMilestoneId) return;
    setDisputeSheetMilestoneId(null);
    const milestoneId = disputeSheetMilestoneId;
    const now = new Date().toISOString();
    const deadline = athleteResponseDeadline(now);
    const disputeCase: DisputeCase = {
      reason,
      openedAtISO: now,
      openedBy: 'brand',
      athleteResponseDeadlineISO: deadline,
    };
    const updated: EngineDeal = {
      ...deal,
      milestones: deal.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status: 'disputed' as MilestoneStatus, disputeReason: reason, dispute: disputeCase }
          : m,
      ),
      events: [
        ...deal.events,
        {
          at: now,
          actor: 'brand',
          kind: 'dispute-opened',
          note: `Dispute opened: ${reason}`,
          milestoneId,
        } as DealEvent,
      ],
      updatedAt: now,
    };
    persistDeal(updated);
  }

  // Athlete responds to dispute
  function handleDisputeResponse(milestoneId: string) {
    setResponseSheetMilestoneId(milestoneId);
  }

  function handleResponseConfirm(response: string) {
    if (!deal || !responseSheetMilestoneId) return;
    setResponseSheetMilestoneId(null);
    const milestoneId = responseSheetMilestoneId;
    const now = new Date().toISOString();
    const updated: EngineDeal = {
      ...deal,
      milestones: deal.milestones.map((m) =>
        m.id === milestoneId && m.dispute
          ? {
              ...m,
              dispute: {
                ...m.dispute,
                athleteResponse: response,
                respondedAtISO: now,
              },
            }
          : m,
      ),
      events: [
        ...deal.events,
        {
          at: now,
          actor: 'athlete',
          kind: 'dispute-response',
          note: `Athlete response: ${response}`,
          milestoneId,
        } as DealEvent,
      ],
      updatedAt: now,
    };
    persistDeal(updated);
  }

  // Open determination sheet (both lenses, admin action)
  function handleEscalate(milestoneId: string) {
    setDeterminationSheetMilestoneId(milestoneId);
    const now = new Date().toISOString();
    if (!deal) return;
    const already = deal.events.some(
      (e) => e.kind === 'dispute-escalated' && e.milestoneId === milestoneId,
    );
    if (!already) {
      const updated: EngineDeal = {
        ...deal,
        events: [
          ...deal.events,
          {
            at: now,
            actor: lens === 'brand' ? 'brand' : 'athlete',
            kind: 'dispute-escalated',
            note: 'Dispute escalated to Proslync Admin for determination.',
            milestoneId,
          } as DealEvent,
        ],
        updatedAt: now,
      };
      persistDeal(updated);
    }
  }

  function handleDeterminationConfirm(decision: 'release' | 'refund', reasoning: string) {
    if (!deal || !determinationSheetMilestoneId) return;
    setDeterminationSheetMilestoneId(null);
    const milestoneId = determinationSheetMilestoneId;
    const now = new Date().toISOString();
    const milestone = deal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const determination = { decision, reasoning, decidedAtISO: now };

    let newMilestones = deal.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            dispute: m.dispute ? { ...m.dispute, determination } : m.dispute,
            status: decision === 'release'
              ? ('paid' as MilestoneStatus)
              : ('refunded' as MilestoneStatus),
            ...(decision === 'release' ? { approvedISO: now, paidISO: now } : {}),
          }
        : m,
    );

    const fees = computeFees(milestone.amountCents, deal.feeRate);

    const newEvents: DealEvent[] = [
      {
        at: now,
        actor: 'platform',
        kind: 'dispute-determination',
        note: `Admin determination: ${decision.toUpperCase()}. Reasoning: ${reasoning}`,
        milestoneId,
      } as DealEvent,
    ];

    let newEscrow = { ...deal.escrow };

    if (decision === 'release') {
      // Release payment to athlete
      const newReleased = deal.escrow.releasedCents + milestone.amountCents;
      newEscrow = {
        ...newEscrow,
        releasedCents: newReleased,
        state: newReleased >= deal.amountCents ? 'released' : 'partially-released',
      };
      newEvents.push({
        at: now,
        actor: 'platform',
        kind: 'milestone-paid',
        note: `Payout following admin determination: $${formatCents(milestone.amountCents)} released to athlete. Brand paid $${formatCents(milestone.amountCents)} + $${formatCents(fees.brandFeeCents)} fee (${Math.round((deal.feeRate ?? 0.10) * 100)}%).`,
        milestoneId,
      } as DealEvent);
    } else {
      // Refund brand — reduce escrow funded amount
      const newFunded = Math.max(0, deal.escrow.fundedCents - milestone.amountCents);
      newEscrow = {
        ...newEscrow,
        fundedCents: newFunded,
        state: newFunded <= 0 ? 'unfunded' : newFunded <= deal.escrow.releasedCents ? 'released' : 'partially-released',
      };
      newEvents.push({
        at: now,
        actor: 'platform',
        kind: 'escrow-refunded',
        note: `Escrow refunded $${formatCents(milestone.amountCents)} to brand following admin determination.`,
        milestoneId,
      } as DealEvent);
      newEvents.push({
        at: now,
        actor: 'platform',
        kind: 'milestone-refunded',
        note: `Milestone refunded. Escrow reduced by $${formatCents(milestone.amountCents)}.`,
        milestoneId,
      } as DealEvent);
    }

    const updated: EngineDeal = {
      ...deal,
      milestones: newMilestones,
      escrow: newEscrow,
      events: [...deal.events, ...newEvents],
      updatedAt: now,
    };
    persistDeal(updated);
  }
  ```

- [ ] **Step 9: Add bell icon to navBar + wire sheets in JSX**

  In the JSX return of `DealEngineCockpit`, update the navBar to add a bell icon on the right:

  ```tsx
  {/* Nav bar */}
  <View style={cockpitStyles.navBar}>
    <Pressable
      onPress={() => router.back()}
      style={cockpitStyles.navBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
    >
      <Text style={cockpitStyles.navBackText}>&#8249;</Text>
    </Pressable>
    <Text style={cockpitStyles.navTitle} numberOfLines={1}>
      Deal Cockpit
    </Text>
    {deal.isDemo && (
      <View style={cockpitStyles.demoPill}>
        <Text style={cockpitStyles.demoPillText}>DEMO</Text>
      </View>
    )}
    <BellButton
      onPress={() => setNotifSheetVisible(true)}
      deal={deal}
    />
  </View>
  ```

  Update the `MilestoneRow` usages in the milestones section to pass the new `onRespond` and `onEscalate` props:

  ```tsx
  deal.milestones.map((m) => (
    <MilestoneRow
      key={m.id}
      milestone={m}
      lens={lens}
      onSubmit={handleMilestoneSubmit}
      onApprove={handleMilestoneApprove}
      onDispute={handleMilestoneDispute}
      onRespond={handleDisputeResponse}
      onEscalate={handleEscalate}
    />
  ))
  ```

  Add the three sheets and the notification sheet just before the closing `</>` of the component return:

  ```tsx
  {/* Dispute Sheet */}
  {disputeSheetMilestoneId !== null && (() => {
    const m = deal?.milestones.find(ms => ms.id === disputeSheetMilestoneId);
    return m ? (
      <DisputeSheet
        visible
        onClose={() => setDisputeSheetMilestoneId(null)}
        onSubmit={handleDisputeConfirm}
        milestoneDescription={m.description}
      />
    ) : null;
  })()}

  {/* Response Sheet */}
  {responseSheetMilestoneId !== null && (() => {
    const m = deal?.milestones.find(ms => ms.id === responseSheetMilestoneId);
    return m?.dispute ? (
      <ResponseSheet
        visible
        onClose={() => setResponseSheetMilestoneId(null)}
        onSubmit={handleResponseConfirm}
        milestoneDescription={m.description}
        disputeReason={m.dispute.reason}
      />
    ) : null;
  })()}

  {/* Determination Sheet */}
  {determinationSheetMilestoneId !== null && (() => {
    const m = deal?.milestones.find(ms => ms.id === determinationSheetMilestoneId);
    return m ? (
      <DeterminationSheet
        visible
        onClose={() => setDeterminationSheetMilestoneId(null)}
        onSubmit={handleDeterminationConfirm}
        milestoneDescription={m.description}
      />
    ) : null;
  })()}

  {/* Notification sheet */}
  <NotificationSheet
    visible={notifSheetVisible}
    onClose={() => setNotifSheetVisible(false)}
    extraItems={deriveDealNotificationsForSheet(deal)}
  />
  ```

  Add the import for `NotificationSheet` near the top of the file:
  ```tsx
  import { NotificationSheet } from '@/components/shared/notification-sheet';
  ```

  Add a helper to map deal notifications to the sheet's item shape (add near the top helper functions area, before the component):
  ```tsx
  function deriveDealNotificationsForSheet(deal: EngineDeal | null): Parameters<typeof NotificationSheet>[0]['extraItems'] {
    if (!deal) return [];
    const { deriveDealNotifications } = require('@/lib/deal-engine/engine');
    const notifs = deriveDealNotifications([deal], new Date().toISOString());
    return notifs.map((n) => ({
      id: 99_000 + notifs.indexOf(n), // synthetic numeric id, won't collide with backend ids (which are small)
      type: 'payment' as const,
      title: n.title,
      body: n.body,
      read: false,
      metadata: { dealId: n.dealId, kind: n.kind },
      createdAt: n.atISO,
    }));
  }
  ```

  **NOTE:** The `require` inside the function avoids circular import issues; alternatively import `deriveDealNotifications` at the top of the file with the other engine imports (preferred):
  ```tsx
  import { computeFees, isAutoApproved, milestoneAutoApproveAt, athleteResponseDeadline, deriveDealNotifications } from '@/lib/deal-engine/engine';
  ```
  Then update the helper to use the imported function directly.

- [ ] **Step 10: Add `BellButton` component**

  Add this before the `EscrowCard` component:

  ```tsx
  // ── Bell button with unread dot ───────────────────────────────────────────

  function BellButton({ onPress, deal }: { onPress: () => void; deal: EngineDeal }) {
    const notifs = deriveDealNotifications([deal], new Date().toISOString());
    const hasUnread = notifs.length > 0;

    return (
      <Pressable
        onPress={onPress}
        style={cockpitStyles.bellBtn}
        accessibilityRole="button"
        accessibilityLabel={`Notifications${hasUnread ? ` — ${notifs.length} unread` : ''}`}
        hitSlop={8}
      >
        <Ionicons name="notifications-outline" size={22} color={WHITE} />
        {hasUnread && <View style={cockpitStyles.bellDot} />}
      </Pressable>
    );
  }
  ```

  Add to `cockpitStyles`:
  ```ts
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DANGER,
    borderWidth: 1.5,
    borderColor: BG,
  },
  ```

- [ ] **Step 11: Verify TypeScript error count ≤ 148**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: ≤ 148. Fix any new errors before committing.

- [ ] **Step 12: Commit**

  ```bash
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  git add app/deal-engine/[id].tsx
  git commit -m "$(cat <<'EOF'
  feat(d3/cockpit): full dispute ladder — DisputeSheet, ResponseSheet, DeterminationSheet, DisputePanel + bell icon

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: Notification Sheet — `extraItems` Prop

**Files:**
- Modify: `components/shared/notification-sheet.tsx`

The `NotificationSheet` currently accepts `{ visible, onClose }`. The FlatList in the `activity` tab renders from the `notifications` hook (backend items). We need to prepend deal-engine items passed via `extraItems` without touching the existing hook/rendering logic.

- [ ] **Step 1: Add `extraItems` prop type and prepend logic**

  In `components/shared/notification-sheet.tsx`, update `NotificationSheetProps`:

  ```tsx
  interface NotificationSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Optional deal-engine notifications to prepend to the activity list */
    extraItems?: AppNotification[];
  }
  ```

  In the `NotificationSheet` component function signature, destructure the new prop:
  ```tsx
  export function NotificationSheet({ visible, onClose, extraItems = [] }: NotificationSheetProps) {
  ```

  Find the line where `notifications` is used in the FlatList (around line 265):
  ```tsx
  data={notifications}
  ```
  Replace with:
  ```tsx
  data={[...extraItems, ...notifications]}
  ```

  Also update the `notifications.length > 0` check to include extraItems:
  ```tsx
  ) : (extraItems.length > 0 || notifications.length > 0) ? (
  ```

- [ ] **Step 2: Verify TypeScript error count ≤ 148**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: ≤ 148.

- [ ] **Step 3: Commit**

  ```bash
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  git add components/shared/notification-sheet.tsx
  git commit -m "$(cat <<'EOF'
  feat(d3/notifications): NotificationSheet extraItems prop for deal-engine notifications

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Athlete Deals Tab — Bell Icon + Unread State

**Files:**
- Modify: `components/athlete/athlete-deals-section.tsx`

The `AthleteDealsSection` component is rendered inside `athlete-view.tsx` when the "Deals" tab is active. We need to add a bell icon with unread-count dot to the header area and mount `NotificationSheet` locally. Unread = deal notifications newer than `proslync:deal-engine:notifSeen:v1` in AsyncStorage, updated when the sheet opens.

- [ ] **Step 1: Add imports to `athlete-deals-section.tsx`**

  At the top of `components/athlete/athlete-deals-section.tsx`, add:

  ```tsx
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { NotificationSheet } from '@/components/shared/notification-sheet';
  import { deriveDealNotifications, type DealNotification } from '@/lib/deal-engine/engine';
  import { DEAL_ENGINE_STORAGE_KEY } from '@/lib/data/mock-deal-engine';
  import type { EngineDeal } from '@/lib/types/deal-engine.types';
  import type { AppNotification } from '@/lib/types/notifications.types';
  ```

- [ ] **Step 2: Add unread notification hook**

  Add this hook before `AthleteDealsSection` in the file:

  ```tsx
  const NOTIF_SEEN_KEY = 'proslync:deal-engine:notifSeen:v1';

  function useDealNotifications() {
    const [notifItems, setNotifItems] = React.useState<AppNotification[]>([]);
    const [seenAt, setSeenAt] = React.useState<string | null>(null);

    React.useEffect(() => {
      async function load() {
        try {
          const [raw, seenRaw] = await Promise.all([
            AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY),
            AsyncStorage.getItem(NOTIF_SEEN_KEY),
          ]);
          const deals: EngineDeal[] = raw ? JSON.parse(raw) : [];
          const now = new Date().toISOString();
          const notifs: DealNotification[] = deriveDealNotifications(deals, now);
          const mapped: AppNotification[] = notifs.map((n, i) => ({
            id: 98_000 + i,
            type: 'payment' as const,
            title: n.title,
            body: n.body,
            read: seenRaw ? n.atISO <= seenRaw : false,
            metadata: { dealId: n.dealId, kind: n.kind },
            createdAt: n.atISO,
          }));
          setNotifItems(mapped);
          setSeenAt(seenRaw);
        } catch (_) {}
      }
      load();
    }, []);

    const unreadCount = notifItems.filter((n) => !n.read).length;

    async function markSeen() {
      const now = new Date().toISOString();
      setSeenAt(now);
      setNotifItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await AsyncStorage.setItem(NOTIF_SEEN_KEY, now);
    }

    return { notifItems, unreadCount, markSeen };
  }
  ```

- [ ] **Step 3: Update `AthleteDealsSection` to include bell + notification sheet**

  In the `AthleteDealsSection` function, add state and hook usage at the top:

  ```tsx
  export function AthleteDealsSection() {
    const contractsQuery = useAthleteContracts(DEMO_ATHLETE_ID);
    const offersQuery = useAthleteOffers();
    const [notifSheetVisible, setNotifSheetVisible] = React.useState(false);
    const { notifItems, unreadCount, markSeen } = useDealNotifications();
    // ... rest of existing code
  ```

  In the JSX, find the `PaymentTruthSection`'s `sectionHeader` area inside `PaymentTruthSection`. The bell icon should live at the top of `AthleteDealsSection`, not inside `PaymentTruthSection`. Add it as the first rendered element before `<PaymentTruthSection />`:

  ```tsx
  return (
    <View style={{ gap: 16 }}>
      {/* Deal notifications bell — top-right of the Deals section */}
      <View style={dealsBellStyles.headerRow}>
        <Text style={dealsBellStyles.sectionTitle}>DEALS</Text>
        <TouchableOpacity
          style={dealsBellStyles.bellBtn}
          onPress={() => {
            setNotifSheetVisible(true);
            markSeen();
          }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Deal notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Ionicons name="notifications-outline" size={22} color={COPPER} />
          {unreadCount > 0 && (
            <View style={dealsBellStyles.bellDot}>
              <Text style={dealsBellStyles.bellDotText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Truth — per-deal 3-step state (spec §4 thin truth layer) */}
      <PaymentTruthSection />
      {/* ... rest of existing JSX ... */}

      {/* Notification sheet — mounted here so the Deals tab owns it */}
      <NotificationSheet
        visible={notifSheetVisible}
        onClose={() => setNotifSheetVisible(false)}
        extraItems={notifItems}
      />
    </View>
  );
  ```

  Add `dealsBellStyles` to the file (add alongside the other StyleSheet.create blocks):

  ```tsx
  const dealsBellStyles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.4,
      color: 'rgba(255,255,255,0.45)',
    },
    bellBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    bellDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: DANGER,
      borderWidth: 1.5,
      borderColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    bellDotText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#FFF',
    },
  });
  ```

  Also add `const DANGER = '#FF453A';` near the other color constants at the top of the file (if not already present — check existing constants; `RED_DENIED` = `'#FF3B30'` exists, so add `DANGER` as an alias or use `RED_DENIED` in `bellDot.backgroundColor`).

- [ ] **Step 4: Verify TypeScript error count ≤ 148**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: ≤ 148.

- [ ] **Step 5: Commit**

  ```bash
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  git add components/athlete/athlete-deals-section.tsx
  git commit -m "$(cat <<'EOF'
  feat(d3/notifications): bell icon + unread count on athlete Deals tab header, AsyncStorage seen tracking

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6: Verification Gate

- [ ] **Step 1: Run all tests**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  node --test lib/deal-engine/engine.test.mjs lib/compliance/preclearance.test.mjs lib/athlete/truth.test.mjs 2>&1 | tail -3
  ```
  Expected: `ℹ fail 0` and `ℹ pass N` where N ≥ previous count + 9.

- [ ] **Step 2: TypeScript gate**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx tsc --noEmit 2>&1 | grep -c "error TS"
  ```
  Expected: ≤ 148.

- [ ] **Step 3: Expo export check**

  ```bash
  export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
  cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
  npx expo export --platform ios --output-dir /tmp/d3-check 2>&1 | tail -2
  rm -rf /tmp/d3-check
  ```
  Expected: last line ends with `✓` or shows `Bundle ...` without `Error:`.

---

## Self-Review Checklist

**Spec coverage:**
- [x] `DisputeCase` interface with all required fields — Task 1
- [x] `'refunded'` added to `MilestoneStatus` — Task 1
- [x] `athleteResponseDeadline(openedISO)` (+48h) — Task 2
- [x] `isResponseOverdue(deadlineISO, nowISO)` — Task 2
- [x] `deriveDealNotifications` all 8 kinds, newest-first, capped at 10 — Task 2
- [x] ≥6 new tests — Task 2 adds 9 tests
- [x] Brand DISPUTE → DisputeSheet (replaces Alert.prompt) — Task 3
- [x] Dispute case created with +48h deadline, event logged — Task 3
- [x] Disputed panel: reason quote, athlete countdown chip (red/amber/muted-overdue) — Task 3
- [x] Athlete RESPOND button → ResponseSheet → response stored + event — Task 3
- [x] Both lenses: ESCALATE TO PROSLYNC ADMIN after response/overdue — Task 3
- [x] DeterminationSheet: decision toggle + reasoning, DEMO pill — Task 3
- [x] Release → milestone 'paid' + payout event + escrow partially-released — Task 3
- [x] Refund → milestone 'refunded' + escrow refund event + fundedCents reduced — Task 3
- [x] All transitions via persistDeal — Task 3
- [x] NotificationSheet `extraItems` prop — Task 4
- [x] Bell icon on deal cockpit navBar with unread dot — Task 3
- [x] Bell icon on athlete Deals tab header with unread count — Task 5
- [x] `proslync:deal-engine:notifSeen:v1` AsyncStorage timestamp, set when sheet opens — Task 5
- [x] DEMO pill on determination sheet — Task 3, Step 5
- [x] Tabular money (fontVariant tabular-nums) — inherited from existing styles; ensured in amount displays
- [x] Copper only for act-now — COPPER used only on primary action buttons
- [x] Countdown chips on real deadlines only — response deadline and autoApproveAt
- [x] No new animation loops — Sheets use SlideInDown/FadeIn (entry only, not loops)
- [x] ≥44pt hit targets — all buttons have `minHeight: 44`
- [x] Dispute reasons/responses preserved verbatim in audit events — note field copies the text

**NotificationSheet mounting before D3:** Only used in `components/shared/notification-sheet.tsx` itself (exported but NEVER imported anywhere else). The home bell was already removed. D3 mounts it in two new places: the deal cockpit and the athlete Deals section.

**Type consistency check:**
- `DisputeCase` defined in Task 1, imported in Task 3 as `import type { ..., DisputeCase } from '@/lib/types/deal-engine.types'`
- `DealNotification` defined in `engine.d.ts` Task 2, imported in Task 5
- `athleteResponseDeadline` exported from `engine.ts` Task 2, imported in `[id].tsx` Task 3
- `deriveDealNotifications` exported from `engine.ts` Task 2, imported in both Task 3 and Task 5
- `NOTIF_SEEN_KEY` constant defined in Task 5, used only in Task 5
- `extraItems` prop type is `AppNotification[]` — matches what both callers construct
