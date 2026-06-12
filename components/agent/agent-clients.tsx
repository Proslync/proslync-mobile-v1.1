// components/agent/agent-clients.tsx
// ── AGENT CLIENTS TAB ─────────────────────────────────────────────────────
// Charter §A — 4 fixture client rows with pipeline stage dots, fee lines,
// active-deal count, and next deadline.
// Top: + INVITE CODE ghost row (athletes add agent from their side).
// NO add-client search. NO dollar totals on individual client rows.
// No animations (charter law). Tabular numerals throughout.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Charter constants ─────────────────────────────────────────────────────
const COPPER = '#EB621A';
const AMBER = '#FFD60A';
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';

// ── Pipeline stage types ──────────────────────────────────────────────────
type PipelineStage = 'SOURCED' | 'NEGOTIATING' | 'SIGNED' | 'CLEARED' | 'PAID';
const PIPELINE_STAGES: PipelineStage[] = ['SOURCED', 'NEGOTIATING', 'SIGNED', 'CLEARED', 'PAID'];

// ── Client fixture type ───────────────────────────────────────────────────
type ClientRow = {
  id: string;
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
    name: 'Kiyan Anthony',
    initials: 'KA',
    avatarColor: COPPER,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  dotCurrent: {
    backgroundColor: COPPER,
    borderColor: COPPER,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  connectorPast: {
    backgroundColor: 'rgba(235,98,26,0.4)',
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COPPER,
    letterSpacing: 0.5,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
});

// ── Root ──────────────────────────────────────────────────────────────────

export interface AgentClientsProps {
  bottomInset?: number;
  topInset?: number;
}

export function AgentClients({ bottomInset = 0, topInset = 0 }: AgentClientsProps) {
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[
        s.content,
        { paddingTop: topInset + 70, paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.sectionLabel}>CLIENTS · {CLIENT_ROWS.length}</Text>

      {/* + INVITE CODE ghost row — athletes add agent from their side */}
      <Pressable
        style={s.inviteRow}
        onPress={() =>
          Alert.alert(
            'Invite Code',
            'Share your code — athletes add you from their side. (DEMO)',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Get invite code"
      >
        <Ionicons name="add-circle-outline" size={18} color={MUTED} />
        <Text style={s.inviteText}>+ INVITE CODE</Text>
        <Text style={s.inviteHint}>Athletes add you from their Deals tab</Text>
      </Pressable>

      {/* Client rows */}
      {CLIENT_ROWS.map((client) => {
        const isPendingFee = client.feeStatus === 'pending-athlete';
        return (
          <View key={client.id} style={s.clientCard}>
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
                color={isPendingFee ? AMBER : GREEN}
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
              <Ionicons name="time-outline" size={12} color={MUTED} />
              <Text style={s.deadlineText} numberOfLines={1}>{client.nextDeadline}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    gap: 10,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: MUTED,
    paddingHorizontal: 4,
    marginBottom: 4,
  },

  // Invite code ghost row
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    borderStyle: 'dashed',
  },
  inviteText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  inviteHint: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'right',
  },

  // Client card
  clientCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  clientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  clientMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
  },
  dealCountBadge: {
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  dealCountText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  dealCountLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Fee line
  feeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
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
    fontWeight: '600',
    color: 'rgba(52,199,89,0.9)',
    flex: 1,
  },
  feeTextPending: {
    color: AMBER,
  },

  // Deadline row
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
});
