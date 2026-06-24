// ── PerkSheet ──────────────────────────────────────────────
// Bottom-sheet for a single perk / claim, opened from the Fan HQ PERKS rows,
// the legacy Play tab perk list, and the profile perks-history list. Reuses
// the FanHomeFeed Modal / scrim / slide-up pattern and the shared ui-kit
// tokens.
//
// One honest contract: nothing here moves money or fulfills a redemption in
// the demo. Behaviour by `kind`:
//   • 'claimable' → primary "Claim perk" → confirm state with a DEMO pill and
//     a plain note that payments/redemption aren't enabled in the demo.
//   • 'code'      → shows the activation CODE for an at-the-door / local perk.
//   • 'status'    → read-only fulfillment status + SLA line (already-claimed /
//     in-flight perks); no action beyond Close.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  RADIUS_CARD,
  RADIUS_LG,
  SIGNAL_POSITIVE,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_RAISED,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// ── Public shape — what a caller hands the sheet ──────────────────────────
export interface SheetPerk {
  id: string;
  title: string;
  /** What it is — one or two lines. */
  description: string;
  /** Who/where the perk comes from (athlete / venue / brand). */
  source?: string;
  /** Tier gate, e.g. "Gold" / "INSIDER". Rendered uppercased. */
  tier?: string;
  /** Behaviour selector. */
  kind: 'claimable' | 'code' | 'status';
  /** For 'code': the activation code shown to the user. */
  code?: string;
  /** For 'status'/'claimable': human fulfillment / SLA line. */
  fulfillment?: string;
  /** For 'status': mark already fulfilled (green DELIVERED). */
  delivered?: boolean;
}

interface PerkSheetProps {
  perk: SheetPerk | null;
  visible: boolean;
  onClose: () => void;
}

export function PerkSheet({ perk, visible, onClose }: PerkSheetProps) {
  const [claimed, setClaimed] = React.useState(false);
  React.useEffect(() => {
    if (visible) setClaimed(false);
  }, [visible, perk?.id]);

  if (!perk) return null;

  const showCode = perk.kind === 'code';
  const showClaim = perk.kind === 'claimable';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header */}
            <View style={styles.tierRow}>
              {perk.tier ? (
                <View style={styles.tierPill}>
                  <Ionicons name="diamond" size={11} color={ACCENT} />
                  <Text style={styles.tierPillText}>{perk.tier.toUpperCase()}</Text>
                </View>
              ) : null}
              {perk.delivered ? (
                <View style={styles.deliveredPill}>
                  <Ionicons name="checkmark-circle" size={12} color={SIGNAL_POSITIVE} />
                  <Text style={styles.deliveredText}>DELIVERED</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{perk.title}</Text>
            {perk.source ? <Text style={styles.source}>{perk.source}</Text> : null}

            {/* What it is */}
            <Text style={styles.sectionLabel}>WHAT IT IS</Text>
            <Text style={styles.description}>{perk.description}</Text>

            {/* Fulfillment / SLA */}
            {perk.fulfillment ? (
              <>
                <Text style={styles.sectionLabel}>FULFILLMENT</Text>
                <View style={styles.fulfillRow}>
                  <Ionicons
                    name={perk.delivered ? 'checkmark-circle' : 'time-outline'}
                    size={15}
                    color={perk.delivered ? SIGNAL_POSITIVE : TEXT_SECONDARY}
                  />
                  <Text style={styles.fulfillText}>{perk.fulfillment}</Text>
                </View>
              </>
            ) : null}

            {/* CODE perk */}
            {showCode ? (
              <>
                <Text style={styles.sectionLabel}>ACTIVATION CODE</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{perk.code ?? '—'}</Text>
                </View>
                <Text style={styles.honestNote}>
                  Present this screen at the door to redeem.
                </Text>
              </>
            ) : null}

            {/* CLAIMABLE perk */}
            {showClaim ? (
              <>
                <Pressable
                  style={[styles.claimBtn, claimed && styles.claimBtnDone]}
                  onPress={() => setClaimed(true)}
                  accessibilityRole="button"
                  accessibilityLabel={claimed ? 'Perk claimed' : 'Claim perk'}
                >
                  <Ionicons
                    name={claimed ? 'checkmark-circle' : 'gift'}
                    size={16}
                    color={claimed ? TEXT_PRIMARY : '#000'}
                  />
                  <Text style={[styles.claimBtnText, claimed && styles.claimBtnTextDone]}>
                    {claimed ? 'Claim requested' : 'Claim perk'}
                  </Text>
                </Pressable>
                {claimed ? (
                  <Text style={styles.honestNote}>
                    Your claim is confirmed — we’ll start fulfillment and email you the details.
                  </Text>
                ) : null}
              </>
            ) : null}

            <Pressable
              style={styles.secondaryBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close perk detail"
            >
              <Text style={styles.secondaryBtnText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    paddingTop: SP_SM,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: SP_SM,
  },
  scroll: { paddingHorizontal: SP_LG, paddingBottom: SP_SM },

  tierRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM, marginBottom: SP_SM },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SP_SM,
    paddingVertical: 4,
    borderRadius: RADIUS_CARD,
    backgroundColor: `${ACCENT}1F`,
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
  },
  tierPillText: { color: ACCENT, fontSize: TEXT.caption, fontWeight: WEIGHT.bold, letterSpacing: 0.5 },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: 4,
    borderRadius: RADIUS_CARD,
    backgroundColor: `${SIGNAL_POSITIVE}1F`,
    borderWidth: 1,
    borderColor: `${SIGNAL_POSITIVE}4D`,
  },
  deliveredText: { color: SIGNAL_POSITIVE, fontSize: 9, fontWeight: WEIGHT.bold, letterSpacing: 0.5 },

  title: { color: TEXT_PRIMARY, fontSize: TEXT.heading, fontWeight: WEIGHT.bold, letterSpacing: -0.3 },
  source: { color: TEXT_TERTIARY, fontSize: TEXT.label, marginTop: SP_XS },

  sectionLabel: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.8,
    marginTop: SP_LG,
    marginBottom: SP_SM,
  },
  description: { color: TEXT_SECONDARY, fontSize: TEXT.label, lineHeight: 19 },

  fulfillRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM },
  fulfillText: { flex: 1, color: TEXT_SECONDARY, fontSize: TEXT.label, lineHeight: 18 },

  codeBox: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
    borderStyle: 'dashed',
    paddingVertical: SP_LG,
    alignItems: 'center',
  },
  codeText: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.heading,
    fontWeight: WEIGHT.bold,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },

  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP_SM,
    marginTop: SP_LG,
    minHeight: 48,
    borderRadius: RADIUS_CARD,
    backgroundColor: ACCENT,
  },
  claimBtnDone: { backgroundColor: SURFACE_RAISED },
  claimBtnText: { color: '#000', fontSize: TEXT.body, fontWeight: WEIGHT.bold },
  claimBtnTextDone: { color: TEXT_PRIMARY },
  demoPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  demoPillText: { color: '#000', fontSize: 9, fontWeight: WEIGHT.bold, letterSpacing: 0.6 },
  honestNote: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    marginTop: SP_SM,
    lineHeight: 16,
    textAlign: 'center',
  },

  secondaryBtn: {
    marginTop: SP_MD,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS_CARD,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  secondaryBtnText: { color: TEXT_SECONDARY, fontSize: TEXT.body, fontWeight: WEIGHT.semibold },
});
