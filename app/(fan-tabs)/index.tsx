// app/(fan-tabs)/index.tsx
// ── FAN HQ — charter rebuild 2026-06-11 ──────────────────────────────────
// Charter law: PROOF + BELONGING, ration intimacy.
// MODULES: YOUR IMPACT · FROM YOUR ATHLETES · PERKS · MY ATHLETES
// UNMOUNTED (not deleted): fan score, leaderboard, live strip, streak/gamification,
//   pick'em, tier progress bar, stat row, PredictionCard, PerkCard (old).
//   Orphaned variables prefixed with _.
// No animations (charter). Tabular numerals on money. Copper = act-now only.
// Every reachable row opens a real detail sheet (athlete / perk / supporter
// post); simulated money/redemption is honestly DEMO-labeled inside the sheet.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FAN_PROFILE,
} from '@/lib/data/mock-fan-data';
import {
  AthleteDetailSheet,
  type FanAthlete,
} from '@/components/athlete/athlete-detail-sheet';
import { PerkSheet, type SheetPerk } from '@/components/fan/perk-sheet';
import { getAthlete } from '@/lib/data/demo-roster';
import {
  loadPasses,
  loadReceipts,
  type SupporterPass,
  type SupporterReceipt,
} from '@/lib/fan/supporter';

// ── Unmounted imports (kept for module resolution, _ prefix) ────────────
// These were used by removed sections (live strip, pick'em, old perks card).
// Do NOT re-enable without charter review.
import {
  FAN_FOLLOWING as _FAN_FOLLOWING,
  FAN_PERKS as _FAN_PERKS,
  FAN_PREDICTIONS as _FAN_PREDICTIONS,
} from '@/lib/data/mock-fan-data';
import { FAN_ACCENT, FAN_ACCENT_BORDER, FAN_ACCENT_SOFT } from '@/constants/brand';
import { AthleteAvatar as _AthleteAvatar } from '@/components/explore/sections/athlete-avatar';
import { LinearGradient as _LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn as _FadeIn, FadeInDown as _FadeInDown } from 'react-native-reanimated';

// ── Charter constants ─────────────────────────────────────────────────────
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';

// ── Fixture: supporter-only feed rows ────────────────────────────────────
// Raw text-first; no emoji per charter.
const SUPPORTER_FEED = [
  {
    id: 'sf-1',
    athlete: 'Kiyan A.',
    time: '2h',
    body: 'Film session done. New drop for Insiders Friday.',
    chip: 'SUPPORTERS ONLY',
  },
  {
    id: 'sf-2',
    athlete: 'Kiyan A.',
    time: '1d',
    body: 'Thanks for the renew, supporter #15.',
    chip: 'SUPPORTERS ONLY',
  },
  {
    id: 'sf-3',
    athlete: 'JJ Starling',
    time: '3h',
    body: 'Locked in for the next two weeks. Film, weight room, the usual.',
    chip: 'SUPPORTERS ONLY',
  },
];

// ── Fixture: perk fulfillment rows ───────────────────────────────────────
type PerkRow = {
  id: string;
  title: string;
  athlete: string;
  steps: ('REQUESTED' | 'RECORDED' | 'DELIVERED')[];
  currentStep: number; // 0-indexed
  deliverNote: string;
  isLocal?: boolean;
  localCta?: string;
};

const PERK_ROWS: PerkRow[] = [
  {
    id: 'pr-1',
    title: 'KA7 Orange Crush hoodie — pre-release',
    athlete: 'Kiyan Anthony',
    steps: ['REQUESTED', 'RECORDED', 'DELIVERED'],
    currentStep: 2, // DELIVERED
    deliverNote: 'Delivered Jun 9',
  },
  {
    id: 'pr-2',
    title: 'Signed 8x10 print — training camp',
    athlete: 'Kiyan Anthony',
    steps: ['REQUESTED', 'RECORDED', 'DELIVERED'],
    currentStep: 1, // RECORDED
    deliverNote: 'Recorded Tue · delivers by Fri',
  },
  {
    id: 'pr-3',
    title: '2-for-1 at Santangelo\'s — JMA x Kiyan signing Sat',
    athlete: 'JMA Wireless x Kiyan Anthony',
    steps: ['REQUESTED', 'RECORDED', 'DELIVERED'],
    currentStep: 0, // local activation
    deliverNote: 'Local activation — show code at door',
    isLocal: true,
    localCta: 'SHOW CODE',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function formatReceiptDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Section header — 4px accent bar + caps label ──────────────────────
function SectionHeader({ label, chip }: { label: string; chip?: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
      {chip ? (
        <View style={s.sectionChip}>
          <Text style={s.sectionChipText}>{chip}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── MODULE 1: YOUR IMPACT ─────────────────────────────────────────────────

function ImpactModule({ receipts }: { receipts: SupporterReceipt[] }) {
  const mostRecent = receipts.length > 0 ? receipts[receipts.length - 1] : null;

  return (
    <View style={s.card}>
      <SectionHeader label="YOUR IMPACT" />
      <Text style={s.impactProof}>
        88% of every dollar reaches the athlete — receipts prove it.
      </Text>
      {receipts.length === 0 ? (
        <Text style={s.emptyText}>
          Back an athlete and every dollar shows up here with a receipt.
        </Text>
      ) : (
        <>
          {receipts.map((r, idx) => {
            const isFirst = idx === receipts.length - 1;
            const athleteName =
              r.note.split(' — ')[0].replace('Insider $12/mo', '').replace('Fan $5/mo', '').replace('Courtside $25/mo', '').trim() ||
              r.passAthleteId;
            return (
              <View key={r.id} style={[s.receiptRow, idx > 0 && s.receiptRowBorder]}>
                <Text style={s.receiptDate}>{formatReceiptDate(r.atISO)}</Text>
                <Text style={s.receiptDot}> · </Text>
                <Text style={s.receiptMoney}>
                  {formatCents(r.paidCents)} → {formatCents(r.toAthleteCents)} reached {r.passAthleteId}
                </Text>
                <View style={s.receiptCheck}>
                  <Ionicons name="checkmark-circle" size={13} color={GREEN} />
                </View>
                {isFirst && mostRecent?.note ? (
                  <Text style={s.receiptFund}>
                    {'\n'}Funded: {mostRecent.note}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

// ── MODULE 2: FROM YOUR ATHLETES ──────────────────────────────────────────

type SupporterPost = (typeof SUPPORTER_FEED)[number];

function SupporterFeedModule({
  hasPasses,
  onOpenPost,
}: {
  hasPasses: boolean;
  onOpenPost: (post: SupporterPost) => void;
}) {
  if (!hasPasses) return null;
  return (
    <View style={s.card}>
      <SectionHeader label="FROM YOUR ATHLETES" chip="SUPPORTERS ONLY" />
      {SUPPORTER_FEED.map((item, idx) => (
        <Pressable
          key={item.id}
          style={[s.feedRow, idx > 0 && s.feedRowBorder]}
          onPress={() => onOpenPost(item)}
          accessibilityRole="button"
          accessibilityLabel={`Open update from ${item.athlete}`}
        >
          <View style={s.feedMeta}>
            <Text style={s.feedAthlete}>{item.athlete}</Text>
            <Text style={s.feedTime}> · {item.time}</Text>
          </View>
          <Text style={s.feedBody}>{item.body}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Lightweight read-only sheet for a supporter-only post. Reuses the
// FanHomeFeed Modal / scrim / slide pattern; no FanPost object exists for
// these fixture rows so this is intentionally simple (no like/reply).
function SupporterPostSheet({
  post,
  visible,
  onClose,
}: {
  post: SupporterPost | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!post) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.sheetRoot}>
        <Pressable style={s.sheetScrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetChip}>
            <Text style={s.sheetChipText}>{post.chip}</Text>
          </View>
          <View style={s.feedMeta}>
            <Text style={s.feedAthlete}>{post.athlete}</Text>
            <Text style={s.feedTime}> · {post.time}</Text>
          </View>
          <Text style={s.sheetBody}>{post.body}</Text>
          <Pressable
            style={s.sheetCloseBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close update"
          >
            <Text style={s.sheetCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── MODULE 3: PERKS ───────────────────────────────────────────────────────

function SlaStep({
  label,
  state,
}: {
  label: string;
  state: 'done' | 'active' | 'pending';
}) {
  return (
    <View style={s.slaStep}>
      <View
        style={[
          s.slaDot,
          state === 'done' && s.slaDotDone,
          state === 'active' && s.slaDotActive,
        ]}
      />
      <Text
        style={[
          s.slaLabel,
          state === 'done' && s.slaLabelDone,
          state === 'active' && s.slaLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Map a PERK_ROW → the shared PerkSheet shape. Local rows surface an
// activation CODE; in-flight rows surface read-only fulfillment status.
function perkRowToSheet(row: PerkRow): SheetPerk {
  const delivered = row.currentStep === 2 && !row.isLocal;
  if (row.isLocal) {
    return {
      id: row.id,
      title: row.title,
      description: `Local activation from ${row.athlete}. ${row.deliverNote}.`,
      source: row.athlete,
      kind: 'code',
      code: 'SANT-2FOR1',
      fulfillment: row.deliverNote,
    };
  }
  return {
    id: row.id,
    title: row.title,
    description: `Perk from ${row.athlete}.`,
    source: row.athlete,
    kind: 'status',
    fulfillment: row.deliverNote,
    delivered,
  };
}

function PerksModule({
  hasPasses,
  onOpenPerk,
}: {
  hasPasses: boolean;
  onOpenPerk: (perk: SheetPerk) => void;
}) {
  if (!hasPasses) return null;
  return (
    <View style={s.card}>
      <SectionHeader label="PERKS" />
      {PERK_ROWS.map((row, idx) => (
        <Pressable
          key={row.id}
          style={[s.perkRow, idx > 0 && s.perkRowBorder]}
          onPress={() => onOpenPerk(perkRowToSheet(row))}
          accessibilityRole="button"
          accessibilityLabel={`View perk ${row.title}`}
        >
          <View style={s.perkLeft}>
            <Text style={s.perkTitle}>{row.title}</Text>
            <Text style={s.perkAthlete}>{row.athlete}</Text>
            {/* SLA stepper */}
            <View style={s.slaStepper}>
              {row.steps.map((step, stepIdx) => {
                const state =
                  stepIdx < row.currentStep
                    ? 'done'
                    : stepIdx === row.currentStep
                    ? 'active'
                    : 'pending';
                return (
                  <React.Fragment key={step}>
                    <SlaStep label={step} state={state} />
                    {stepIdx < row.steps.length - 1 && (
                      <View style={s.slaConnector} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            <Text style={s.perkDeliverNote}>{row.deliverNote}</Text>
          </View>
          {row.currentStep === 2 && !row.isLocal ? (
            <View style={s.perkDeliveredBadge}>
              <Ionicons name="checkmark-circle" size={16} color={GREEN} />
              <Text style={s.perkDeliveredText}>DELIVERED</Text>
            </View>
          ) : null}
          {row.isLocal ? (
            <Pressable
              style={s.showCodeChip}
              onPress={() => onOpenPerk(perkRowToSheet(row))}
              accessibilityRole="button"
              accessibilityLabel="Show activation code"
            >
              <Text style={s.showCodeChipText}>{row.localCta}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

// ── MODULE 4: MY ATHLETES ────────────────────────────────────────────────

// Suggested teammate for the breadth prompt. No demo-roster entry exists, so
// the sheet hydrates from these inline fields and degrades gracefully (no reach
// fixture). Routed to AthleteDetailSheet rather than a DEMO alert.
const SUGGESTED_TEAMMATE: FanAthlete = {
  id: 'teammate-marcus',
  name: 'Marcus Thompson',
  sport: "Men's Basketball",
  school: 'Syracuse · from $5/mo',
  initials: 'MT',
};

// Map a supporter pass → the AthleteDetailSheet shape. `athleteId` mirrors the
// demo-roster id (e.g. 'kiyan-anthony'), so the sheet hydrates rich data + any
// social-reach fixture via the bridge.
function passToAthlete(p: SupporterPass): FanAthlete {
  const roster = getAthlete(p.athleteId);
  // Reach fixture ids are 'a-*' for the brand HQ athletes; map the one demo
  // overlap (Kiyan) so the sheet shows real reach where we have it.
  const reachId = p.athleteId === 'kiyan-anthony' ? 'a-1' : undefined;
  return {
    id: p.athleteId,
    name: p.athleteName,
    rosterId: roster ? p.athleteId : undefined,
    reachId,
  };
}

function MyAthletesModule({
  passes,
  receipts,
  onOpenAthlete,
}: {
  passes: SupporterPass[];
  receipts: SupporterReceipt[];
  onOpenAthlete: (athlete: FanAthlete) => void;
}) {
  return (
    <View style={s.card}>
      <SectionHeader label="MY ATHLETES" />
      {passes.length === 0 ? (
        <Text style={s.emptyText}>
          Back an athlete from their profile — every dollar shows up here with a receipt.
        </Text>
      ) : (
        <>
          {passes.map((p, idx) => {
            const lastReceipt =
              receipts.filter((r) => r.passAthleteId === p.athleteId).slice(-1)[0] ?? null;
            const tierLabel =
              p.tier === 'fan' ? 'FAN' : p.tier === 'insider' ? 'INSIDER' : 'COURTSIDE';
            const sinceLabel = (() => {
              try {
                return new Date(p.startedAtISO).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                });
              } catch {
                return '';
              }
            })();
            return (
              <Pressable
                key={p.athleteId}
                style={[s.athleteRow, idx > 0 && s.athleteRowBorder]}
                onPress={() => onOpenAthlete(passToAthlete(p))}
                accessibilityRole="button"
                accessibilityLabel={`View ${p.athleteName}`}
              >
                <View style={s.athleteLeft}>
                  <Text style={s.athleteName}>{p.athleteName}</Text>
                  <Text style={s.athleteMeta}>
                    since {sinceLabel}
                    {lastReceipt
                      ? `  ·  ${formatCents(lastReceipt.paidCents)} → ${formatCents(lastReceipt.toAthleteCents)} to ${p.athleteName} ✓`
                      : ''}
                  </Text>
                </View>
                <View style={s.athleteTierChip}>
                  <Text style={s.athleteTierText}>{tierLabel}</Text>
                </View>
              </Pressable>
            );
          })}
          {/* Breadth prompt — only when ≥1 pass */}
          <Pressable
            style={s.breadthPrompt}
            onPress={() => onOpenAthlete(SUGGESTED_TEAMMATE)}
            accessibilityRole="button"
            accessibilityLabel="Back a teammate"
          >
            <Text style={s.breadthPromptText}>
              Back a teammate — Marcus T. (Syracuse MBB) · from $5/mo
            </Text>
            <Ionicons name="chevron-forward" size={13} color={MUTED} />
          </Pressable>
        </>
      )}
    </View>
  );
}

// ── Footer wall ───────────────────────────────────────────────────────────

function FooterWall() {
  return (
    <View style={s.wallRow}>
      <Ionicons name="lock-closed" size={13} color={MUTED} />
      <Text style={s.wallText}>
        No leaderboards, no spend ranks — your tier is your identity here, and every dollar is receipted.
      </Text>
    </View>
  );
}

// ── Root screen ───────────────────────────────────────────────────────────

export default function FanHomeTab() {
  const insets = useSafeAreaInsets();

  // ── MY ATHLETES — supporter passes (data wiring preserved from prior build)
  const [myPasses, setMyPasses] = React.useState<SupporterPass[]>([]);
  const [passReceipts, setPassReceipts] = React.useState<SupporterReceipt[]>([]);

  const loadSupporterData = React.useCallback(async () => {
    try {
      const [passMap, allReceipts] = await Promise.all([loadPasses(), loadReceipts()]);
      setMyPasses(Object.values(passMap));
      setPassReceipts(allReceipts);
    } catch {
      // silent — demo
    }
  }, []);

  // Load on mount and re-load each time the tab gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadSupporterData();
    }, [loadSupporterData]),
  );

  // ── Unmounted vars (kept to avoid dead-code TS errors on imports) ────────
  const _tierPct =
    (FAN_PROFILE.superfanPoints /
      (FAN_PROFILE.superfanPoints + FAN_PROFILE.pointsToNext)) *
    100;
  const _predictionTeasers = _FAN_PREDICTIONS.slice(0, 3);
  const _perkTeasers = _FAN_PERKS.filter((p) => !p.claimed).slice(0, 3);
  const _liveAthletes = _FAN_FOLLOWING.filter((a) => a.isLive);
  void _tierPct;
  void _predictionTeasers;
  void _perkTeasers;
  void _liveAthletes;
  // Suppress unused-import warnings for unmounted visual components
  void _AthleteAvatar;
  void _LinearGradient;
  void _FadeIn;
  void _FadeInDown;
  void Animated;

  const hasPasses = myPasses.length > 0;

  // ── Detail sheets — every reachable row now opens a real target ─────────
  const [athleteSheet, setAthleteSheet] = React.useState<FanAthlete | null>(null);
  const [perkSheet, setPerkSheet] = React.useState<SheetPerk | null>(null);
  const [postSheet, setPostSheet] = React.useState<SupporterPost | null>(null);

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerKicker}>FAN HQ</Text>
            <Text style={s.headerTitle}>
              Welcome back, {FAN_PROFILE.firstName}
            </Text>
            <Text style={s.headerSubtitle}>{FAN_PROFILE.metaPrimary}</Text>
          </View>
          <View style={s.tierPill}>
            <Ionicons name="diamond" size={11} color={FAN_ACCENT} />
            <Text style={s.tierPillText}>
              {FAN_PROFILE.superfanTier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Module 1 — YOUR IMPACT */}
        <ImpactModule receipts={passReceipts} />

        {/* Module 2 — FROM YOUR ATHLETES (supporter-only feed) */}
        <SupporterFeedModule hasPasses={hasPasses} onOpenPost={setPostSheet} />

        {/* Module 3 — PERKS */}
        <PerksModule hasPasses={hasPasses} onOpenPerk={setPerkSheet} />

        {/* Module 4 — MY ATHLETES */}
        <MyAthletesModule
          passes={myPasses}
          receipts={passReceipts}
          onOpenAthlete={setAthleteSheet}
        />

        {/* Footer wall */}
        <FooterWall />
      </ScrollView>

      {/* Detail sheets */}
      <AthleteDetailSheet
        athlete={athleteSheet}
        visible={athleteSheet != null}
        onClose={() => setAthleteSheet(null)}
      />
      <PerkSheet
        perk={perkSheet}
        visible={perkSheet != null}
        onClose={() => setPerkSheet(null)}
      />
      <SupporterPostSheet
        post={postSheet}
        visible={postSheet != null}
        onClose={() => setPostSheet(null)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 16, gap: 14 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerKicker: {
    fontSize: 11,
    color: FAN_ACCENT,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
  },
  tierPillText: {
    fontSize: 10.5,
    color: FAN_ACCENT,
    letterSpacing: 0.8,
    fontWeight: '800',
  },

  // Card container
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header: accent bar + caps label + optional chip
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: FAN_ACCENT,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: FAN_ACCENT,
    flex: 1,
  },
  sectionChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: MUTED,
  },

  // Impact module
  impactProof: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 18,
    paddingVertical: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  receiptRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  receiptDate: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  receiptDot: {
    fontSize: 12,
    color: MUTED,
  },
  receiptMoney: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  receiptCheck: {
    marginLeft: 6,
    marginTop: 1,
  },
  receiptFund: {
    width: '100%',
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
    marginTop: 2,
  },

  // Supporter feed module
  feedRow: {
    paddingVertical: 10,
    gap: 4,
  },
  feedRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  feedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedAthlete: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  feedTime: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },
  feedBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Perks module
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  perkRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  perkLeft: {
    flex: 1,
    gap: 4,
  },
  perkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  perkAthlete: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
  },
  perkDeliverNote: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  perkDeliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  perkDeliveredText: {
    fontSize: 10,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: 0.4,
  },
  showCodeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexShrink: 0,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  showCodeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.4,
  },

  // SLA stepper
  slaStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 0,
  },
  slaStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  slaDotDone: {
    backgroundColor: GREEN,
  },
  slaDotActive: {
    backgroundColor: FAN_ACCENT,
  },
  slaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 0.3,
  },
  slaLabelDone: {
    color: GREEN,
  },
  slaLabelActive: {
    color: FAN_ACCENT,
  },
  slaConnector: {
    width: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 2,
  },

  // MY ATHLETES rows
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  athleteRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  athleteLeft: {
    flex: 1,
    gap: 4,
  },
  athleteName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  athleteMeta: {
    color: MUTED,
    fontSize: 11.5,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    lineHeight: 15,
  },
  athleteTierChip: {
    borderRadius: 8,
    backgroundColor: `${'#EB621A'}18`,
    borderWidth: 1,
    borderColor: `${'#EB621A'}44`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  athleteTierText: {
    color: '#EB621A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  breadthPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
    marginTop: 2,
  },
  breadthPromptText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 16,
  },

  // Footer wall
  wallRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  wallText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },

  // Supporter-post sheet (reuses FanHomeFeed sheet pattern)
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  sheetChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10,
  },
  sheetChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: MUTED,
  },
  sheetBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.90)',
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 8,
  },
  sheetCloseBtn: {
    marginTop: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  sheetCloseText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 15,
    fontWeight: '600',
  },
});
