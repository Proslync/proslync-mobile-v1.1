// NIL Manager — Closing Room. Single-deal cockpit with literal step-rail.
// File 01.7 spec: shepherd a deal from countersigned to paid out.

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassButton } from '@/components/glass/glass-button';
import { NIL_MANAGER_ATHLETES } from '@/lib/data/mock-nil-manager-data';

const TEAL = '#14B8A6';
const YELLOW = '#FFD60A';
const RED = '#FF453A';

type StepKey = 'documents' | 'compliance' | 'escrow' | 'deliverables' | 'payout';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'documents', label: 'Documents' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'escrow', label: 'Escrow' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'payout', label: 'Payout' },
];

type DocSlot = {
  id: string;
  label: string;
  state: 'verified' | 'uploaded' | 'missing';
  party: string;
};

const DOCS: DocSlot[] = [
  { id: 'd-1', label: 'Athlete W-9', state: 'verified', party: 'Cooper Flagg' },
  { id: 'd-2', label: 'Brand W-9', state: 'missing', party: 'Gatorade' },
  { id: 'd-3', label: 'Signed contract', state: 'verified', party: 'Both' },
  { id: 'd-4', label: 'School disclosure receipt', state: 'uploaded', party: 'Duke Athletics' },
  { id: 'd-5', label: 'Voided check', state: 'verified', party: 'Cooper Flagg' },
];

type DeliverableRow = {
  id: string;
  label: string;
  required: number;
  done: number;
};

const DELIVERABLES: DeliverableRow[] = [
  { id: 'dl-1', label: 'Workout posts in apparel', required: 2, done: 2 },
  { id: 'dl-2', label: 'In-game tag posts', required: 1, done: 0 },
  { id: 'dl-3', label: 'Story takeover (1 hour)', required: 1, done: 1 },
];

export default function ClosingRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dealId?: string }>();

  // Default to Cooper Flagg's Gatorade deal for the demo
  const athlete = NIL_MANAGER_ATHLETES[0];
  const deal =
    athlete.deals.find((d) => d.id === params.dealId) ?? athlete.deals[0];

  const docsDone = DOCS.filter((d) => d.state === 'verified').length;
  const docsMissing = DOCS.filter((d) => d.state === 'missing').length;
  const deliverablesDone = DELIVERABLES.reduce((acc, d) => acc + (d.done >= d.required ? 1 : 0), 0);

  const stepProgress: Record<StepKey, 'done' | 'active' | 'pending'> = {
    documents: docsMissing === 0 ? 'done' : 'active',
    compliance: 'done',
    escrow: 'active',
    deliverables: deliverablesDone === DELIVERABLES.length ? 'done' : 'active',
    payout: 'pending',
  };

  const blockingAction = docsMissing > 0
    ? `Brand W-9 missing — request from Gatorade`
    : `1 in-game tag post pending`;

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Closing Room</Text>
          <Text style={styles.headerSub}>
            {athlete.name} × {deal.brand}
          </Text>
        </View>
        <View style={styles.statePill}>
          <Text style={styles.statePillText}>{deal.stage.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step rail */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepRailWrap}>
          <View style={styles.stepRail}>
            {STEPS.map((s, i) => {
              const state = stepProgress[s.key];
              return (
                <React.Fragment key={s.key}>
                  <View style={styles.stepNodeWrap}>
                    <View
                      style={[
                        styles.stepNode,
                        state === 'done' && styles.stepNodeDone,
                        state === 'active' && styles.stepNodeActive,
                      ]}
                    >
                      {state === 'done' ? (
                        <Ionicons name="checkmark" size={14} color="#000" />
                      ) : (
                        <Text style={styles.stepNodeNum}>{i + 1}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepLabel, state === 'active' && styles.stepLabelActive]}>
                      {s.label}
                    </Text>
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepConnector, state === 'done' && styles.stepConnectorDone]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <View style={styles.blockingCard}>
            <Ionicons name="alert-circle" size={16} color={YELLOW} />
            <Text style={styles.blockingText}>Next blocking action: {blockingAction}</Text>
          </View>
        </Animated.View>

        {/* Documents */}
        <Text style={styles.sectionLabel}>DOCUMENTS · {docsDone}/{DOCS.length}</Text>
        <View style={styles.cardGroup}>
          {DOCS.map((d, i) => (
            <Animated.View
              key={d.id}
              entering={FadeInDown.delay(i * 40).duration(320)}
              style={[styles.docRow, i < DOCS.length - 1 && styles.docRowBorder]}
            >
              <View
                style={[
                  styles.docDot,
                  { backgroundColor: d.state === 'verified' ? TEAL : d.state === 'uploaded' ? YELLOW : 'transparent', borderColor: d.state === 'missing' ? RED : 'transparent' },
                ]}
              >
                {d.state === 'verified' && <Ionicons name="checkmark" size={10} color="#000" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docLabel}>{d.label}</Text>
                <Text style={styles.docParty}>{d.party}</Text>
              </View>
              <Text
                style={[
                  styles.docState,
                  { color: d.state === 'verified' ? TEAL : d.state === 'uploaded' ? YELLOW : RED },
                ]}
              >
                {d.state.toUpperCase()}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Counterparties */}
        <Text style={styles.sectionLabel}>COUNTERPARTIES</Text>
        <View style={styles.cardGroup}>
          <Counterparty initials={athlete.initials} name={athlete.name} role="Athlete" status="Signed Apr 29" color={athlete.color} />
          <View style={styles.partyDivider} />
          <Counterparty initials={deal.brandInitial} name={deal.brand} role="Brand" status={deal.contractStatus === 'signed' ? 'Counter-signed' : 'Awaiting W-9'} color={deal.brandColor} />
          <View style={styles.partyDivider} />
          <Counterparty initials="DA" name="Duke Athletics" role="School (compliance)" status="Disclosure on file May 1" color="#001A57" />
        </View>

        {/* Money */}
        <Text style={styles.sectionLabel}>MONEY</Text>
        <View style={styles.moneyCard}>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Escrow balance</Text>
            <Text style={styles.moneyValue}>{deal.value}</Text>
          </View>
          <View style={styles.moneyDivider} />
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Stripe + platform fee</Text>
            <Text style={styles.moneyValueDim}>−$2,140</Text>
          </View>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Tax withholding</Text>
            <Text style={styles.moneyValueDim}>−$0 (athlete W-9)</Text>
          </View>
          <View style={styles.moneyDivider} />
          <View style={styles.moneyRow}>
            <Text style={[styles.moneyLabel, { color: '#FFF', fontWeight: '700' }]}>Net to athlete</Text>
            <Text style={[styles.moneyValue, { color: TEAL }]}>$182,860</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <GlassButton label="Release escrow" onPress={() => undefined} fullWidth />
          </View>
        </View>

        {/* Deliverables */}
        <Text style={styles.sectionLabel}>DELIVERABLES · {deliverablesDone}/{DELIVERABLES.length}</Text>
        <View style={styles.cardGroup}>
          {DELIVERABLES.map((d, i) => {
            const done = d.done >= d.required;
            return (
              <View key={d.id} style={[styles.delivRow, i < DELIVERABLES.length - 1 && styles.docRowBorder]}>
                <View style={[styles.docDot, { backgroundColor: done ? TEAL : 'transparent', borderColor: done ? 'transparent' : 'rgba(255,255,255,0.3)' }]}>
                  {done && <Ionicons name="checkmark" size={10} color="#000" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docLabel}>{d.label}</Text>
                  <Text style={styles.docParty}>{d.done} of {d.required} done</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <GlassButton
            label={docsMissing > 0 ? 'Closing locked' : 'Mark deal closed'}
            onPress={() => undefined}
            disabled={docsMissing > 0}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Counterparty({
  initials,
  name,
  role,
  status,
  color,
}: {
  initials: string;
  name: string;
  role: string;
  status: string;
  color: string;
}) {
  return (
    <View style={styles.partyRow}>
      <View style={[styles.partyAvatar, { backgroundColor: color }]}>
        <Text style={styles.partyAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.partyName}>{name}</Text>
        <Text style={styles.partyRole}>{role}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.partyStatus}>{status}</Text>
        <TouchableOpacity style={styles.dmBtn}>
          <Ionicons name="chatbubble-outline" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,184,166,0.4)',
  },
  statePillText: { fontSize: 10, fontWeight: '900', color: TEAL, letterSpacing: 0.6 },

  content: { paddingTop: 8 },

  stepRailWrap: { paddingHorizontal: 16, marginBottom: 12 },
  stepRail: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  stepNodeWrap: { alignItems: 'center', width: 56 },
  stepNode: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  stepNodeDone: { backgroundColor: TEAL, borderColor: TEAL },
  stepNodeActive: { borderColor: '#FFF', borderWidth: 2 },
  stepNodeNum: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: '#FFF', fontWeight: '700' },
  stepConnector: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 14, marginHorizontal: -10 },
  stepConnectorDone: { backgroundColor: TEAL },

  blockingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,214,10,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.3)',
  },
  blockingText: { flex: 1, fontSize: 12, color: '#FFF', fontWeight: '600' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 18, marginBottom: 8,
  },

  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  docRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  docDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  docLabel: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  docParty: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  docState: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },

  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  partyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.06)' },
  partyAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  partyAvatarText: { fontSize: 14, fontWeight: '900', color: '#FFF' },
  partyName: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  partyRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  partyStatus: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  dmBtn: {
    width: 28, height: 28, borderRadius: 14, marginTop: 4,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
  },

  moneyCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 10,
  },
  moneyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moneyLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  moneyValue: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  moneyValueDim: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  moneyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.06)' },

  delivRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
});
