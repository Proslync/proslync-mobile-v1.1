// components/agent/agent-clients.tsx
// ── AGENT CLIENTS TAB ─────────────────────────────────────────────────────
// Charter §A — 4 fixture client rows with pipeline stage dots, fee lines,
// active-deal count, and next deadline.
// Top: + INVITE CODE ghost row (athletes add agent from their side).
// NO add-client search. NO dollar totals on individual client rows.
// No animations (charter law). Tabular numerals throughout.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_PILL,
  RADIUS_SM,
  SIGNAL_POSITIVE,
  SIGNAL_WARN,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// ── Pipeline stage types ──────────────────────────────────────────────────
type PipelineStage = 'SOURCED' | 'NEGOTIATING' | 'SIGNED' | 'CLEARED' | 'PAID';
const PIPELINE_STAGES: PipelineStage[] = ['SOURCED', 'NEGOTIATING', 'SIGNED', 'CLEARED', 'PAID'];

// ── Client fixture type ───────────────────────────────────────────────────
type ClientRow = {
  id: string;
  /** Maps to an AGENT_ATHLETES id so the card opens the real athlete/audience detail. */
  athleteId: string;
  name: string;
  initials: string;
  avatarColor: string;
  sport: string;
  school: string;
  classYear: string;
  currentStage: PipelineStage;
  feeStatus: 'countersigned' | 'pending-athlete';
  feeLabel: string;         // e.g. "Your fee: 12% marketing"
  activeDeals: number;
  nextDeadline: string;     // e.g. "IG Reel due Jun 12"
};

// ── Fixture: 4 clients ────────────────────────────────────────────────────
const CLIENT_ROWS: ClientRow[] = [
  {
    id: 'c-1',
    athleteId: 'a-1',
    name: 'Kiyan Anthony',
    initials: 'KA',
    avatarColor: ACCENT,
    sport: 'MBB',
    school: 'Syracuse',
    classYear: "Fr '27",
    currentStage: 'NEGOTIATING',
    feeStatus: 'countersigned',
    feeLabel: 'Your fee: 12% marketing · countersigned ✓',
    activeDeals: 3,
    nextDeadline: 'IG Reel due Jun 12',
  },
  {
    id: 'c-2',
    athleteId: 'a-2',
    name: 'JJ Starling',
    initials: 'JS',
    avatarColor: '#F76900',
    sport: 'MBB',
    school: 'Syracuse',
    classYear: "Jr '25",
    currentStage: 'SIGNED',
    feeStatus: 'countersigned',
    feeLabel: 'Your fee: 10% marketing · countersigned ✓',
    activeDeals: 2,
    nextDeadline: 'Social post due Jun 15',
  },
  {
    id: 'c-3',
    athleteId: 'a-3',
    name: 'Maya Chen',
    initials: 'MC',
    avatarColor: '#2774AE',
    sport: 'WSOcc',
    school: 'UCLA',
    classYear: "Sr '26",
    currentStage: 'CLEARED',
    feeStatus: 'pending-athlete',
    feeLabel: 'fee agreement pending athlete countersign',
    activeDeals: 4,
    nextDeadline: 'Product shoot due Jun 18',
  },
  {
    id: 'c-4',
    athleteId: 'a-4',
    name: 'Jalen Ortiz',
    initials: 'JO',
    avatarColor: '#00274C',
    sport: 'FB',
    school: 'Michigan',
    classYear: "Jr '26",
    currentStage: 'PAID',
    feeStatus: 'countersigned',
    feeLabel: 'Your fee: 12% marketing · countersigned ✓',
    activeDeals: 5,
    nextDeadline: 'Campaign recap due Jun 25',
  },
];

// ── Pipeline stage dots component ─────────────────────────────────────────

function PipelineDots({ currentStage }: { currentStage: PipelineStage }) {
  const currentIdx = PIPELINE_STAGES.indexOf(currentStage);
  return (
    <View style={p.dotsRow} accessibilityLabel={`Pipeline stage: ${currentStage}`}>
      {PIPELINE_STAGES.map((stage, idx) => {
        const isCurrent = idx === currentIdx;
        const isPast = idx < currentIdx;
        return (
          <React.Fragment key={stage}>
            <View
              style={[
                p.dot,
                isCurrent && p.dotCurrent,
                isPast && p.dotPast,
              ]}
            />
            {idx < PIPELINE_STAGES.length - 1 && (
              <View style={[p.connector, isPast && p.connectorPast]} />
            )}
          </React.Fragment>
        );
      })}
      <Text style={p.stageLabel}>{currentStage}</Text>
    </View>
  );
}

const p = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flexWrap: 'nowrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  dotCurrent: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPast: {
    backgroundColor: 'rgba(235,98,26,0.4)',
    borderColor: 'rgba(235,98,26,0.5)',
  },
  connector: {
    width: 8,
    height: 1,
    backgroundColor: HAIRLINE_SUBTLE,
  },
  connectorPast: {
    backgroundColor: 'rgba(235,98,26,0.4)',
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginLeft: SP_SM,
    textTransform: 'uppercase',
  },
});

// ── Root ──────────────────────────────────────────────────────────────────

export interface AgentClientsProps {
  bottomInset?: number;
  topInset?: number;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function AgentClients({ bottomInset = 0, topInset = 0, onScroll }: AgentClientsProps) {
  const router = useRouter();
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + SP_LG, paddingBottom: bottomInset + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={s.sectionLabel}>CLIENTS · {CLIENT_ROWS.length}</Text>

      {/* + INVITE CODE ghost row — athletes add agent from their side */}
      <Pressable
        style={s.inviteRow}
        onPress={() =>
          Alert.alert(
            'Invite Code',
            'Share your code — athletes add you from their side.',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Get invite code"
      >
        <Ionicons name="add-circle-outline" size={18} color={TEXT_SECONDARY} />
        <Text style={s.inviteText}>+ INVITE CODE</Text>
        <Text style={s.inviteHint}>Athletes add you from their Deals tab</Text>
      </Pressable>

      {/* Client rows — tap a card to open the athlete's audience/detail screen */}
      {CLIENT_ROWS.map((client) => {
        const isPendingFee = client.feeStatus === 'pending-athlete';
        return (
          <Pressable
            key={client.id}
            style={({ pressed }) => [s.clientCard, pressed && { opacity: 0.65 }]}
            onPress={() =>
              router.push({
                pathname: '/agent/athlete/[id]',
                params: { id: client.athleteId },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Open ${client.name} · ${client.sport} · ${client.activeDeals} active deals`}
          >
            {/* Avatar + name row */}
            <View style={s.clientTopRow}>
              <View style={[s.avatar, { backgroundColor: client.avatarColor }]}>
                <Text style={s.avatarText}>{client.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.clientName}>{client.name}</Text>
                <Text style={s.clientMeta}>
                  {client.sport} · {client.school} · {client.classYear}
                </Text>
              </View>
              {/* Active deal count badge */}
              <View style={s.dealCountBadge}>
                <Text style={s.dealCountText}>{client.activeDeals}</Text>
                <Text style={s.dealCountLabel}>deals</Text>
              </View>
            </View>

            {/* Pipeline stage dots */}
            <PipelineDots currentStage={client.currentStage} />

            {/* Fee line */}
            <View style={[s.feeLine, isPendingFee && s.feeLinePending]}>
              <Ionicons
                name={isPendingFee ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={12}
                color={isPendingFee ? SIGNAL_WARN : SIGNAL_POSITIVE}
              />
              <Text
                style={[s.feeText, isPendingFee && s.feeTextPending]}
                numberOfLines={1}
              >
                {client.feeLabel}
              </Text>
            </View>

            {/* Next deadline */}
            <View style={s.deadlineRow}>
              <Ionicons name="time-outline" size={12} color={TEXT_SECONDARY} />
              <Text style={s.deadlineText} numberOfLines={1}>{client.nextDeadline}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SP_LG,
    gap: SP_SM,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: WEIGHT.bold,
    letterSpacing: 1.2,
    color: TEXT_SECONDARY,
    paddingHorizontal: SP_XS,
    marginBottom: SP_XS,
  },

  // Invite code ghost row
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: RADIUS_CARD,
    padding: SP_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderStyle: 'dashed',
  },
  inviteText: {
    fontSize: TEXT.label,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  inviteHint: {
    flex: 1,
    fontSize: 11,
    fontWeight: WEIGHT.medium,
    color: TEXT_TERTIARY,
    textAlign: 'right',
  },

  // Client card
  clientCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_LG,
    padding: SP_LG,
    gap: SP_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  clientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_MD,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: SP_LG,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
  },
  clientName: {
    fontSize: SP_LG,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
  },
  clientMeta: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.medium,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  dealCountBadge: {
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: SP_SM,
    paddingVertical: 6,
    paddingHorizontal: SP_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  dealCountText: {
    fontSize: TEXT.title,
    fontWeight: WEIGHT.bold,
    color: TEXT_PRIMARY,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  dealCountLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Fee line
  feeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: SP_SM,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(52,199,89,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.18)',
  },
  feeLinePending: {
    backgroundColor: 'rgba(255,214,10,0.07)',
    borderColor: 'rgba(255,214,10,0.28)',
  },
  feeText: {
    fontSize: 11,
    fontWeight: WEIGHT.semibold,
    color: 'rgba(52,199,89,0.9)',
    flex: 1,
  },
  feeTextPending: {
    color: SIGNAL_WARN,
  },

  // Deadline row
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
    color: TEXT_SECONDARY,
  },
});
