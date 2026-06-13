# Athlete Dashboard + Profile Charter Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the athlete dashboard (Home/Deals/Wallet tabs) and public profile (Kit/Posts/Merch tabs) per the charter — owner-home money pattern for dashboard, conversion storefront for profile; nothing deleted, all legacy components unmounted.

**Architecture:** (A) `athlete-view.tsx` loses PERSONAL_TABS/PRO_TABS/accountMode split and gains a fixed `['Home','Deals','Wallet']` tab set with a new `athlete-home.tsx` as the default tab, thin three-module ScrollView (money, due-from-you, deal status). (B) `profile.tsx` TAB_KEYS narrows from `['about','posts','deals','merch','media']` to `['kit','posts','merch']`; the 'kit' tab renders `MediaKitCard` plus a new `RatesReliabilityBlock` glass block (inline in media-kit-card.tsx); legacy branch JSX is comment-guarded with `LEGACY_TABS`.

**Tech Stack:** React Native / Expo, TypeScript, expo-router, react-native-reanimated, DEAL_TRUTH_FIXTURE + truth selectors, DEMO_DEAL deal-engine fixture, AsyncStorage for deal notifications.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| MODIFY | `components/athlete/athlete-view.tsx` | Replace PERSONAL/PRO tab duality with fixed `['Home','Deals','Wallet']`; mount `AthleteHome` |
| CREATE | `components/athlete/athlete-home.tsx` | New default Home tab — thin 3-module owner screen |
| MODIFY | `components/athlete/media-kit-card.tsx` | Add `RatesReliabilityBlock` as a third glass block |
| MODIFY | `app/(tabs)/profile.tsx` | TAB_KEYS → `['kit','posts','merch']`; legacy branches behind `LEGACY_TABS` guard |

Files **not** touched: athlete-stats-section.tsx, athlete-team-section.tsx, athlete-schedule-section.tsx, athlete-deals-section.tsx, athlete-wallet-section.tsx, truth-strip.tsx, profile-actions.tsx, and all lib/data files.

---

## Task 1: Create `athlete-home.tsx` — thin three-module owner screen

**Files:**
- Create: `components/athlete/athlete-home.tsx`

This is the new default Home tab. It has three sections: MONEY, DUE FROM YOU, DEAL STATUS. It receives `onNavigateToDeals: () => void` from the parent so tapping rows switches the Deals tab.

- [ ] **Step 1: Create the file with the MONEY module**

Create `/Users/arshiarahnavard/Desktop/proslync-mobile-v1.1/components/athlete/athlete-home.tsx` with the following content:

```tsx
// components/athlete/athlete-home.tsx
// ── ATHLETE OWNER HOME ─────────────────────────────────────────────────────
// Charter §A — thin three-module owner screen. NO vanity, NO hub commands.
// Modules: MONEY · DUE FROM YOU · DEAL STATUS
// All data from DEAL_TRUTH_FIXTURE selectors + DEMO_DEAL engine milestones.
// No animations (charter law).

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import {
  truthSummary,
  upcomingDeliverables,
  nextDisclosureDeadline,
  hoursUntilISO,
  thresholdForHours,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { DEAL_ENGINE_STORAGE_KEY, DEMO_DEAL } from '@/lib/data/mock-deal-engine';
import type { EngineDeal } from '@/lib/types/deal-engine.types';
import type { DealTruth } from '@/lib/athlete/truth';

const COPPER = '#EB621A';
const RED = '#FF3B30';
const AMBER = '#FFD60A';
const GREEN = '#34C759';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.55)';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function countdownLabel(hours: number | null): string {
  if (hours === null) return 'overdue';
  if (hours < 1) return '<1h';
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ── Section header — 4px copper bar + caps label ──────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── MODULE 1: MONEY ────────────────────────────────────────────────────────

function MoneyModule({ deals }: { deals: DealTruth[] }) {
  const summary = truthSummary(deals);

  // Build the one-line sub-text (mirrors TruthStrip summaryLine but never animated)
  const segments: string[] = [];
  if (summary.expectedCents > 0) {
    segments.push(`${formatMoney(summary.expectedCents)} expected`);
  }
  if (summary.inReviewCount > 0) {
    segments.push(`${summary.inReviewCount} in CSC review`);
  }
  if (summary.lastPaid) {
    segments.push(`last paid ${formatShortDate(summary.lastPaid.dateISO)} ✓`);
  }
  const summaryLine =
    segments.length > 0 ? segments.join(' · ') : 'No active deals — all clear';

  // Paid-this-season: sum all paid deals (paymentState === 'paid')
  const paidThisSeason = deals
    .filter((d) => d.paymentState === 'paid')
    .reduce((acc, d) => acc + d.amountCents, 0);

  // Tax set-aside: sum taxSetAsideCents on paid deals (charter fixture §7)
  const taxSetAside = deals
    .filter((d) => d.paymentState === 'paid' && d.taxSetAsideCents)
    .reduce((acc, d) => acc + (d.taxSetAsideCents ?? 0), 0);

  return (
    <View style={s.card}>
      <SectionHeader label="MONEY" />
      {/* Big paid-this-season figure — tabular, never animated (charter law) */}
      <Text style={s.moneyBig}>{formatMoney(paidThisSeason)}</Text>
      <Text style={s.moneyLabel}>paid this season</Text>
      {/* One-line summary: expected · CSC review · last paid */}
      <Text style={s.moneySubLine} numberOfLines={1}>{summaryLine}</Text>
      {/* Tax set-aside line */}
      {taxSetAside > 0 && (
        <Text style={s.taxLine}>
          Set aside ~{formatMoney(taxSetAside)} for taxes
        </Text>
      )}
    </View>
  );
}

// ── MODULE 2: DUE FROM YOU ─────────────────────────────────────────────────

interface DueRow {
  key: string;
  label: string;
  subLabel: string;
  hours: number | null;
  urgency: 'red' | 'amber' | 'green';
}

function buildDueRows(deals: DealTruth[], engineDeals: EngineDeal[]): DueRow[] {
  const rows: DueRow[] = [];

  // 1. NIL Go disclosure countdowns (undisclosed deals)
  const urgentDisclosure = nextDisclosureDeadline(deals);
  if (urgentDisclosure) {
    const hours = hoursUntilISO(urgentDisclosure.disclosure.deadlineISO ?? undefined);
    rows.push({
      key: `disclosure-${urgentDisclosure.dealId}`,
      label: `Report ${urgentDisclosure.brand} to NIL Go`,
      subLabel: `${countdownLabel(hours)} left`,
      hours,
      urgency: thresholdForHours(hours),
    });
  }

  // 2. Upcoming deliverables (not done, from truth fixture)
  const upcoming = upcomingDeliverables(deals, 3);
  for (const del of upcoming) {
    const hours = hoursUntilISO(del.dueISO);
    rows.push({
      key: `del-${del.dealId}-${del.label}`,
      label: del.label,
      subLabel: `${del.brand} · due ${formatShortDate(del.dueISO)}`,
      hours,
      urgency: thresholdForHours(hours),
    });
  }

  // 3. Engine deal submitted milestones (waiting brand review)
  for (const deal of engineDeals) {
    for (const ms of deal.milestones ?? []) {
      if (ms.status === 'submitted') {
        rows.push({
          key: `ms-${ms.id}`,
          label: ms.description.length > 50 ? ms.description.slice(0, 47) + '…' : ms.description,
          subLabel: `${deal.brand} · submitted, awaiting review`,
          hours: null,
          urgency: 'green',
        });
      }
    }
  }

  // Charter: max 4 rows
  return rows.slice(0, 4);
}

function DueFromYouModule({
  deals,
  engineDeals,
  onNavigateToDeals,
}: {
  deals: DealTruth[];
  engineDeals: EngineDeal[];
  onNavigateToDeals: () => void;
}) {
  const rows = buildDueRows(deals, engineDeals);

  return (
    <View style={s.card}>
      <SectionHeader label="DUE FROM YOU" />
      {rows.length === 0 ? (
        <Text style={s.emptyText}>Nothing due — you're clear.</Text>
      ) : (
        rows.map((row) => {
          const dotColor =
            row.urgency === 'red' ? RED : row.urgency === 'amber' ? AMBER : COPPER;
          return (
            <Pressable
              key={row.key}
              style={s.dueRow}
              onPress={onNavigateToDeals}
              accessibilityRole="button"
              accessibilityLabel={`${row.label} — tap to view deals`}
            >
              <View style={[s.dueDot, { backgroundColor: dotColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.dueLabel} numberOfLines={1}>{row.label}</Text>
                <Text style={s.dueSub} numberOfLines={1}>{row.subLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={MUTED} />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ── MODULE 3: DEAL STATUS ──────────────────────────────────────────────────

type PaymentState = DealTruth['paymentState'];

function paymentStateChip(state: PaymentState): { label: string; color: string; bg: string } {
  switch (state) {
    case 'expected': return { label: 'EXPECTED', color: COPPER, bg: 'rgba(235,98,26,0.14)' };
    case 'in-review': return { label: 'CSC REVIEW', color: AMBER, bg: 'rgba(255,214,10,0.14)' };
    case 'cleared': return { label: 'CLEARED', color: GREEN, bg: 'rgba(52,199,89,0.14)' };
    case 'paid': return { label: 'PAID', color: GREEN, bg: 'rgba(52,199,89,0.14)' };
    default: return { label: String(state).toUpperCase(), color: MUTED, bg: 'rgba(255,255,255,0.07)' };
  }
}

function disclosureNilGoChip(deal: DealTruth): { label: string; color: string } | null {
  if (deal.disclosure.state !== 'undisclosed') return null;
  const hours = hoursUntilISO(deal.disclosure.deadlineISO ?? undefined);
  const urgency = thresholdForHours(hours);
  const color = urgency === 'red' ? RED : urgency === 'amber' ? AMBER : COPPER;
  const label = hours === null ? 'NIL Go OVERDUE' : hours < 24 ? `NIL Go ${Math.floor(hours)}h` : `NIL Go ${Math.floor(hours / 24)}d`;
  return { label, color };
}

function DealStatusModule({
  deals,
  onNavigateToDeals,
}: {
  deals: DealTruth[];
  onNavigateToDeals: () => void;
}) {
  const activeDeals = deals.filter(
    (d) => d.paymentState !== 'paid',
  );

  return (
    <View style={s.card}>
      <SectionHeader label="DEAL STATUS" />
      {activeDeals.length === 0 ? (
        <Text style={s.emptyText}>No active deals.</Text>
      ) : (
        activeDeals.map((deal, idx) => {
          const pmtChip = paymentStateChip(deal.paymentState);
          const nilGoChip = disclosureNilGoChip(deal);
          return (
            <Pressable
              key={deal.dealId}
              style={[s.dealRow, idx > 0 && s.dealRowBorder]}
              onPress={onNavigateToDeals}
              accessibilityRole="button"
              accessibilityLabel={`${deal.brand} — tap to view deals`}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.dealBrand} numberOfLines={1}>{deal.brand}</Text>
                <Text style={s.dealTitle} numberOfLines={1}>{deal.title}</Text>
              </View>
              <View style={s.chipsRow}>
                <View style={[s.chip, { backgroundColor: pmtChip.bg }]}>
                  <Text style={[s.chipText, { color: pmtChip.color }]}>{pmtChip.label}</Text>
                </View>
                {nilGoChip && (
                  <View style={[s.chip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <Text style={[s.chipText, { color: nilGoChip.color }]}>{nilGoChip.label}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export interface AthleteHomeProps {
  onNavigateToDeals: () => void;
}

export function AthleteHome({ onNavigateToDeals }: AthleteHomeProps) {
  const [engineDeals, setEngineDeals] = React.useState<EngineDeal[]>([DEMO_DEAL]);

  // Hydrate stored deals from AsyncStorage on focus (same pattern as athlete-deals-section)
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY)
        .then((raw) => {
          if (cancelled) return;
          const stored: EngineDeal[] = raw ? JSON.parse(raw) : [];
          // Always include DEMO_DEAL so the screen is non-empty in dev
          const ids = new Set(stored.map((d) => d.dealId));
          const merged = ids.has(DEMO_DEAL.dealId) ? stored : [DEMO_DEAL, ...stored];
          setEngineDeals(merged);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  const deals = DEAL_TRUTH_FIXTURE;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <MoneyModule deals={deals} />
      <DueFromYouModule
        deals={deals}
        engineDeals={engineDeals}
        onNavigateToDeals={onNavigateToDeals}
      />
      <DealStatusModule deals={deals} onNavigateToDeals={onNavigateToDeals} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
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
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },
  // MONEY
  moneyBig: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
  },
  moneyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  moneySubLine: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  taxLine: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,214,10,0.8)',
    marginTop: 2,
  },
  // DUE FROM YOU
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    paddingVertical: 4,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  dueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  dueSub: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  // DEAL STATUS
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dealRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  dealBrand: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  dealTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 140,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 2: Verify the file compiles with no new TS errors**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx tsc --noEmit 2>&1 | grep "athlete-home"
```

Expected: no lines output (no errors in athlete-home.tsx).

---

## Task 2: Modify `athlete-view.tsx` — replace PERSONAL/PRO tabs with Home/Deals/Wallet

**Files:**
- Modify: `components/athlete/athlete-view.tsx`

Replace the `PERSONAL_TABS`/`PRO_TABS`/`accountMode` tab-switching logic with a single fixed `ATHLETE_TABS = ['Home', 'Deals', 'Wallet']` array. Mount `AthleteHome` for the 'Home' tab. Keep `RoleSwitcherSheet`, `useActorContext`, and `StatusCardMenuSheet` untouched.

- [ ] **Step 1: Read the existing file to confirm line numbers haven't drifted**

Read `components/athlete/athlete-view.tsx` lines 1–293 (the entire file per the baseline read).

- [ ] **Step 2: Apply the edit**

Replace the entire content of `components/athlete/athlete-view.tsx` with the following:

```tsx
// Athlete dashboard view. Fixed tabs: Home (default) · Deals · Wallet.
// Charter §A — one athlete = one business. No account-mode split.
// Stats/Team/Schedule section components remain in the repo but are UNMOUNTED
// (files not deleted). RoleSwitcherSheet + actor-context untouched (they
// control other things beyond tab routing).
import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useActorContext } from '@/lib/providers/actor-context-provider';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import {
  StatusCardMenuSheet,
  WalletSkeleton,
} from '@/components/wallet';
import { AthleteDealsSection } from '@/components/athlete/athlete-deals-section';
import { AthleteWalletSection } from '@/components/athlete/athlete-wallet-section';
import { AthleteHome } from '@/components/athlete/athlete-home';
import { TAB_BAR_TOP_FROM_BOTTOM } from '@/lib/navigation/constants';

// Stats/Team/Schedule imports kept so their files are still referenced in the
// tree and tsc doesn't complain about unused exports. They are NOT rendered.
// import { AthleteStatsSection } from '@/components/athlete/athlete-stats-section';
// import { AthleteTeamSection } from '@/components/athlete/athlete-team-section';
// import { AthleteScheduleSection } from '@/components/athlete/athlete-schedule-section';

const useMembershipCard = (_enabled?: boolean) => ({ data: undefined as any, isLoading: false });

// Top inset beneath the fixed pill header (tab row only)
const HEADER_OFFSET = 140;
// Base page background
const PAGE_BG = '#000';

// Charter §A: fixed tabs — no account-mode split.
const ATHLETE_TABS = ['Home', 'Deals', 'Wallet'] as const;
type AthleteTab = (typeof ATHLETE_TABS)[number];

export function AthleteView() {
  const insets = useSafeAreaInsets();
  const {
    user,
    isLoading,
    refreshWallet,
  } = useWallet();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AthleteTab>('Home');

  // Actor context kept (RoleSwitcherSheet uses it for other features).
  const { override: _override, setOverride: _setOverride } = useActorContext();

  // Animated sliding knob — same math as before, now always 3 tabs.
  const tabIndex = Math.max(0, ATHLETE_TABS.indexOf(activeTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(tabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(tabIndex, { duration: 180 });
  }, [tabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / ATHLETE_TABS.length;
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  const { data: membershipCard, isLoading: isLoadingCard } = useMembershipCard(
    !!user?.isProfileComplete
  );

  const handleExpandQR = useCallback(() => {
    setCardMenuVisible(false);
  }, []);

  // Pull-to-refresh — only meaningful on Wallet/Deals; Home uses focus-effect.
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  const showSkeleton = isLoading || !user;

  return (
    <View style={styles.container}>
      {/* Floating header row — avatar/menu pill + segmented tabs (TOP) */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.profilePill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={styles.profilePillAvatar}
          />
          <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
        </Pressable>
        <View
          style={styles.tabSegmentedPill}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
          {ATHLETE_TABS.map((label) => {
            const isActive = activeTab === label;
            return (
              <Pressable
                key={label}
                style={styles.tabSegment}
                onPress={() => setActiveTab(label)}
                accessibilityLabel={`${label} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showSkeleton ? (
        <WalletSkeleton topOffset={HEADER_OFFSET} />
      ) : (
        <>
          {activeTab === 'Home' && (
            <View style={{ flex: 1, paddingTop: insets.top + 70 }}>
              <AthleteHome onNavigateToDeals={() => setActiveTab('Deals')} />
            </View>
          )}
          {activeTab === 'Deals' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            >
              <AthleteDealsSection />
            </ScrollView>
          )}
          {activeTab === 'Wallet' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            >
              <AthleteWalletSection />
            </ScrollView>
          )}
        </>
      )}

      {user && (
        <StatusCardMenuSheet
          visible={cardMenuVisible}
          onClose={() => setCardMenuVisible(false)}
          onExpandQR={handleExpandQR}
          user={user}
          pdf417Payload={membershipCard?.pdf417Payload}
          cardNumber={membershipCard?.cardNumber ?? undefined}
          isLoadingCard={isLoadingCard}
        />
      )}

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        accountMode="professional"
        onSwitchAccountMode={(_m) => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    flexGrow: 0,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 99,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
  },
  profilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  tabPillTextActive: {
    color: '#EB621A',
    fontWeight: '800',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
```

- [ ] **Step 3: Verify tsc error count ≤ 147 with zero in touched files**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx tsc --noEmit 2>&1 | grep -c "error TS"
npx tsc --noEmit 2>&1 | grep -E "athlete-view|athlete-home"
```

Expected: count ≤ 147, no lines matching those files.

---

## Task 3: Add `RatesReliabilityBlock` to `media-kit-card.tsx`

**Files:**
- Modify: `components/athlete/media-kit-card.tsx`

Add a third `GlassBlock` after the "Past partnerships" block with fixture data for rate ranges (tabular) and a reliability line.

- [ ] **Step 1: Locate the closing `</>` of the component return**

The component currently returns a fragment `<>...</>` containing two `GlassBlock` elements (lines ~117–206). The third block goes just before the closing `</>`.

- [ ] **Step 2: Add the RatesReliabilityBlock inline after the Past partnerships block**

In `components/athlete/media-kit-card.tsx`, locate the closing `</>` at the end of the return statement (after the Past partnerships GlassBlock closing tag) and insert the new block:

Find this exact string (end of the component's return):
```tsx
      </GlassBlock>
    </>
  );
}
```

Replace with:
```tsx
      </GlassBlock>

      {/* ── Rates & Reliability block (charter §B) ── */}
      <GlassBlock>
        <View style={mk.labelRow}>
          <Text style={mk.label}>Rates & Reliability</Text>
        </View>

        {/* Rate ranges — tabular fixture */}
        {([
          { type: 'Endorsement post', range: '$1.2–2.4K' },
          { type: 'Appearance', range: '$800–1.5K' },
          { type: 'Licensing', range: '$2–5K' },
        ] as const).map((item, idx) => (
          <View key={item.type} style={[mk.row, idx === 0 && mk.rowFirst]}>
            <Text style={mk.rowTitle}>{item.type}</Text>
            <Text style={mk.rateValue}>{item.range}</Text>
          </View>
        ))}

        {/* Reliability line */}
        <Text style={mk.reliabilityLine}>
          5 deals completed · 100% on time · responds in ~2h
        </Text>
      </GlassBlock>
    </>
  );
}
```

- [ ] **Step 3: Add `rateValue` and `reliabilityLine` to the `mk` StyleSheet**

In `components/athlete/media-kit-card.tsx`, locate this block at the end of the `mk` StyleSheet:
```tsx
  footer: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },
});
```

Replace with:
```tsx
  footer: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 2,
  },
  rateValue: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  reliabilityLine: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 15,
  },
});
```

- [ ] **Step 4: Verify tsc — no errors in media-kit-card.tsx**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx tsc --noEmit 2>&1 | grep "media-kit-card"
```

Expected: no lines.

---

## Task 4: Profile.tsx — surgical tab surgery (kit/posts/merch, legacy guard)

**Files:**
- Modify: `app/(tabs)/profile.tsx`

This is the most delicate task. Make three targeted edits:
1. Change `profileTab` state type and default from `'about'` to `'kit'`
2. Change `TAB_KEYS` from `['about','posts','deals','merch','media']` to `['kit','posts','merch']`
3. Replace tab content render branches: 'kit' renders MediaKitCard + RatesReliabilityBlock (already in media-kit-card.tsx); legacy branches comment-guarded with `LEGACY_TABS`

The tab label rendering uses `key[0].toUpperCase() + key.slice(1)` which will auto-produce "Kit", "Posts", "Merch".

Variables/hooks that reference legacy tabs (`BIO_SECTIONS`, `expandedBio`, `toggleBio`) must be prefixed with `_` or remain unused — tsc is already at 147 so we must not add errors. Best approach: prefix with `_` any variable that becomes unreachable to silence unused-variable errors.

- [ ] **Step 1: Change profileTab state type and default**

Find:
```tsx
  const [profileTab, setProfileTab] = React.useState<'about' | 'posts' | 'deals' | 'merch' | 'media'>('about');
```

Replace with:
```tsx
  const [profileTab, setProfileTab] = React.useState<'kit' | 'posts' | 'merch'>('kit');
```

- [ ] **Step 2: Change TAB_KEYS**

Find:
```tsx
  const TAB_KEYS = React.useMemo(
    () => ['about', 'posts', 'deals', 'merch', 'media'] as const,
    []
  );
```

Replace with:
```tsx
  const TAB_KEYS = React.useMemo(
    () => ['kit', 'posts', 'merch'] as const,
    []
  );
```

- [ ] **Step 3: Prefix legacy-only state/memo variables with `_` to keep tsc quiet**

Find:
```tsx
  const [expandedBio, setExpandedBio] = React.useState<Set<string>>(new Set());
  const toggleBio = React.useCallback((key: string) => {
    setExpandedBio((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const BIO_SECTIONS = React.useMemo(
```

Replace with:
```tsx
  const [_expandedBio, _setExpandedBio] = React.useState<Set<string>>(new Set());
  const _toggleBio = React.useCallback((key: string) => {
    _setExpandedBio((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const _BIO_SECTIONS = React.useMemo(
```

- [ ] **Step 4: Fix the `BIO_SECTIONS` reference inside the useMemo body**

After the replacement in step 3, the `useMemo` definition still ends with `],` — that's fine. But the closing bracket needs to reference `_BIO_SECTIONS`. Verify the useMemo ends with:
```tsx
    ],
  );
```
That is already correct since we only renamed the variable, not the body.

- [ ] **Step 5: Replace the 'about' tab render branch and guard legacy branches**

Find the tab content block (lines ~2124–2283 based on baseline read). Replace only the content-rendering section inside `<View style={s.igGridSection}>`:

Find:
```tsx
          {/* Tab content */}
          <View style={s.igGridSection}>
            {profileTab === 'about' && (
              <View style={s.aboutSection}>
                <MediaKitCard onViewPosts={() => setProfileTab('posts')} />
                <View style={s.aboutBlockBare}>
```

Replace with:
```tsx
          {/* Tab content */}
          {/* LEGACY_TABS: 'about', 'deals', 'media' are unmounted (charter §B). */}
          {/* JSX is preserved below; branches are unreachable via TAB_KEYS. */}
          <View style={s.igGridSection}>
            {profileTab === 'kit' && (
              <View style={s.aboutSection}>
                <MediaKitCard onViewPosts={() => setProfileTab('posts')} />
```

- [ ] **Step 6: Close the kit tab's aboutSection View and remove the old bio blocks from the rendered branch**

The original 'about' branch included the bio block views (BIO_SECTIONS accordion + philanthropy/personal/academic accordion). These must be cut from the 'kit' render. Locate the end of the existing `{profileTab === 'about' && ...}` block:

Find (the end of the first aboutSection View before the posts check):
```tsx
              </View>
            )}

            {profileTab !== 'about' && <View style={{ height: 15 }} />}

            {profileTab === 'posts' && (
```

Replace with:
```tsx
              </View>
            )}

            {profileTab !== 'kit' && <View style={{ height: 15 }} />}

            {profileTab === 'posts' && (
```

- [ ] **Step 7: Guard legacy 'deals' and 'media' branch text so tsc doesn't warn about unreachable code**

Find:
```tsx
            {profileTab === 'deals' && <DealsTabContent />}

            {profileTab === 'merch' && <MerchTab />}

            {profileTab === 'media' && (
```

Replace with:
```tsx
            {/* LEGACY_TABS — 'deals' tab unmounted (charter §B, unreachable via TAB_KEYS) */}
            {(profileTab as string) === 'deals' && <DealsTabContent />}

            {profileTab === 'merch' && <MerchTab />}

            {/* LEGACY_TABS — 'media' tab unmounted (charter §B, unreachable via TAB_KEYS) */}
            {(profileTab as string) === 'media' && (
```

- [ ] **Step 8: Verify — tsc count ≤ 147 with zero errors in profile.tsx**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx tsc --noEmit 2>&1 | grep -c "error TS"
npx tsc --noEmit 2>&1 | grep "profile.tsx"
```

Expected: count ≤ 147 (the gate), no lines matching profile.tsx.

If tsc reports errors in profile.tsx, common fixes:
- Any `setProfileTab('about')` or `setProfileTab('deals')` call found elsewhere in the file must be changed to `setProfileTab('kit')` or removed.
- Check if `MediaKitCard onViewPosts` callback calls `setProfileTab('posts')` — this is valid since 'posts' is in the new TAB_KEYS.

---

## Task 5: Verify all test suites pass, run expo export gate, commit

- [ ] **Step 1: Run test suites**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
node --test lib/athlete/truth.test.mjs lib/deal-engine/engine.test.mjs lib/compliance/preclearance.test.mjs 2>&1 | tail -5
```

Expected: `fail 0`, `cancelled 0`.

- [ ] **Step 2: Final tsc gate**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: ≤ 147. If higher, run `npx tsc --noEmit 2>&1 | grep "error TS"` and fix only errors in touched files (athlete-view.tsx, athlete-home.tsx, media-kit-card.tsx, profile.tsx).

- [ ] **Step 3: Expo export gate**

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
npx expo export --platform ios --output-dir /tmp/wipe-check 2>&1 | tail -2
rm -rf /tmp/wipe-check
```

Expected: export completes without "Error:" lines.

- [ ] **Step 4: Commit 1 — dashboard**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
git add components/athlete/athlete-view.tsx components/athlete/athlete-home.tsx
git commit -m "$(cat <<'EOF'
feat(athlete): dashboard wiped to charter — Home/Deals/Wallet, owner-home pattern

Replaces PERSONAL_TABS/PRO_TABS/accountMode split with fixed ['Home','Deals','Wallet'].
New athlete-home.tsx: thin 3-module owner screen (MONEY, DUE FROM YOU, DEAL STATUS)
backed by DEAL_TRUTH_FIXTURE + DEMO_DEAL engine milestones. Stats/Team/Schedule
section components remain in repo but are unmounted. No new TSC errors.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Commit 2 — profile**

```bash
cd /Users/arshiarahnavard/Desktop/proslync-mobile-v1.1
git add components/athlete/media-kit-card.tsx app/\(tabs\)/profile.tsx
git commit -m "$(cat <<'EOF'
feat(profile): storefront wiped to charter — Kit/Posts/Merch + rates & reliability

TAB_KEYS narrowed from ['about','posts','deals','merch','media'] to ['kit','posts','merch'].
'kit' tab renders MediaKitCard + new RatesReliabilityBlock (rate ranges per deal type
+ reliability line; research basis: portfolio+response-time = 9x conversion). Legacy
about/deals/media branches comment-guarded with LEGACY_TABS flag, not deleted. No new
TSC errors.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage check:**

| Charter requirement | Task covering it |
|---|---|
| Dashboard tabs become exactly Home/Deals/Wallet | Task 2 (athlete-view.tsx) |
| No account-mode split | Task 2 (PERSONAL_TABS/PRO_TABS removed) |
| Default tab Home | Task 2 (useState initial 'Home') |
| Stats/Team/Schedule UNMOUNTED not deleted | Task 2 (imports commented, files untouched) |
| athlete-home.tsx — MONEY module (paid figure, summary, tax set-aside) | Task 1 |
| athlete-home.tsx — DUE FROM YOU (max 4, countdowns, deliverables, engine milestones) | Task 1 |
| athlete-home.tsx — DEAL STATUS (pill row per active deal, payment + NIL Go state) | Task 1 |
| Tap rows → Deals tab via onNavigateToDeals prop | Task 1 |
| Empty state "Nothing due — you're clear." | Task 1 |
| Deal-notifications bell stays on Deals tab only (not duplicated) | By design — AthleteHome has no bell |
| Profile TAB_KEYS → kit/posts/merch | Task 4 |
| Default tab 'kit' | Task 4 (step 1) |
| 'kit' renders MediaKitCard with onViewPosts | Task 4 (step 5) |
| Third glass block: RATES & RELIABILITY | Task 3 |
| Rate ranges fixture (tabular) + reliability line | Task 3 |
| Legacy about/deals/media branches unreachable, not deleted | Task 4 (steps 5–7) |
| ProfileActions stays exactly where it is | Not touched |
| TSC gate ≤ 147, zero in touched files | Task 5 step 2 |
| Tests pass | Task 5 step 1 |
| Expo export gate | Task 5 step 3 |
| Two commits on arshia branch | Task 5 steps 4–5 |
| No push | Not in plan |

**Placeholder scan:** No TBD/TODO/placeholder items found. All code is fully written out.

**Type consistency check:**
- `AthleteHomeProps.onNavigateToDeals: () => void` — used in athlete-view.tsx as `() => setActiveTab('Deals')`. ✓
- `DealTruth['paymentState']` aliased as `type PaymentState` in athlete-home.tsx (local alias, does not conflict with the imported type from truth.ts which is the same shape). ✓
- `profileTab` type changed from union of 5 to union of 3 — the `(profileTab as string) === 'deals'` cast in legacy guards avoids TS2367 ("this comparison will always be false") error. ✓
- `_BIO_SECTIONS` / `_toggleBio` — `_` prefix silences @typescript-eslint/no-unused-vars; tsc itself doesn't error on unused locals unless `noUnusedLocals` is on (check tsconfig). If it is on, the `_` prefix is the correct suppression.
