// components/agent/agent-profile.tsx
// ── AGENT TRUST STOREFRONT ────────────────────────────────────────────────
// Charter §B — wiped to four GlassBlock sections:
//   1. VERIFICATION (stacked rows, green ✓ pills, VERIFIED REP badge)
//   2. FEES — PUBLISHED (per deal type w/ benchmark context)
//   3. TRACK RECORD (aggregates only, tabular, NO client names, NO $ totals)
//   4. REP AGREEMENT (1-yr term, mutual 30-day term, no fee tail, no likeness)
// NO contact/DM CTA. Muted invite line instead.
// No animations (charter law). Tabular numerals throughout.
// Old tab content (about/roster/career/network) unmounted, not deleted.
// Unused old vars prefixed _ per charter pattern.

import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { healLocalMediaUri } from '@/lib/media/local-media';
import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { personaFor } from '@/lib/demo/personas';

// Old data imports — still present in mock-agent-data.ts, unused here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  AGENT_ATHLETES as _AGENT_ATHLETES,
  AGENT_INSIGHTS as _AGENT_INSIGHTS,
  AGENT_PROFILE as _AGENT_PROFILE,
} from '@/lib/data/mock-agent-data';

// ── Charter constants ─────────────────────────────────────────────────────
const COPPER = '#EB621A';
const GREEN = '#34C759';
const MUTED = 'rgba(255,255,255,0.50)';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

// ── Verification fixture ──────────────────────────────────────────────────
type VerificationRow = {
  id: string;
  label: string;
  detail: string;
};

const VERIFICATION_ROWS: VerificationRow[] = [
  { id: 'vr-1', label: 'State registration',   detail: 'FL #A-2231, TX #88410' },
  { id: 'vr-2', label: 'NIL Go rep registration', detail: '✓' },
  { id: 'vr-3', label: 'SPARTA attestation',   detail: '✓' },
  { id: 'vr-4', label: 'Background check',     detail: 'Mar 2026 ✓' },
];

// ── Fee fixture ───────────────────────────────────────────────────────────
type FeeRow = {
  id: string;
  dealType: string;
  fee: string;
  benchmark: string; // "typical 10–20%"
};

const FEE_ROWS: FeeRow[] = [
  { id: 'fr-1', dealType: 'Marketing deals',         fee: '12%',      benchmark: 'typical 10–20%' },
  { id: 'fr-2', dealType: 'Collective / rev-share',  fee: '4%',       benchmark: 'typical 3–5%' },
  { id: 'fr-3', dealType: 'Contract review',         fee: 'flat $350', benchmark: 'one-time per deal' },
];

// ── Track record fixture (aggregates only) ────────────────────────────────
type TrackPill = { value: string; label: string };

const TRACK_PILLS: TrackPill[] = [
  { value: '38',   label: 'deals completed' },
  { value: '92%',  label: 'first-pass clearance' },
  { value: '11d',  label: 'median to paid' },
  { value: '94%',  label: 'client retention' },
];

// ── GlassBlock — flat solid card (matches athlete media-kit-card) ─────────

function GlassBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={g.block}>{children}</View>
  );
}

const g = StyleSheet.create({
  block: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    gap: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  blockGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

// ── Section 1: VERIFICATION ───────────────────────────────────────────────

function VerificationBlock() {
  return (
    <GlassBlock>
      {/* VERIFIED REP badge */}
      <View style={s.verifiedBadge}>
        <Ionicons name="shield-checkmark" size={14} color={GREEN} />
        <Text style={s.verifiedBadgeText}>VERIFIED REP</Text>
      </View>

      {/* Verification rows */}
      {VERIFICATION_ROWS.map((row, idx) => (
        <View key={row.id} style={[s.verRow, idx === 0 && s.verRowFirst]}>
          <View style={{ flex: 1 }}>
            <Text style={s.verLabel}>{row.label}</Text>
            <Text style={s.verDetail}>{row.detail}</Text>
          </View>
          <View style={s.greenPill}>
            <Ionicons name="checkmark" size={11} color={GREEN} />
            <Text style={s.greenPillText}>✓</Text>
          </View>
        </View>
      ))}
    </GlassBlock>
  );
}

// ── Section 2: FEES — PUBLISHED ───────────────────────────────────────────

function FeesBlock() {
  return (
    <GlassBlock>
      <Text style={s.blockTitle}>FEES — PUBLISHED</Text>
      {FEE_ROWS.map((row, idx) => (
        <View key={row.id} style={[s.feeRow, idx > 0 && s.feeRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={s.feeDealType}>{row.dealType}</Text>
            <Text style={s.feeBenchmark}>{row.benchmark}</Text>
          </View>
          <Text style={s.feeAmount}>{row.fee}</Text>
        </View>
      ))}
      <Text style={s.feeFooter}>
        Every fee is countersigned by the athlete on each deal.
      </Text>
    </GlassBlock>
  );
}

// ── Section 3: TRACK RECORD ───────────────────────────────────────────────

function TrackRecordBlock() {
  return (
    <GlassBlock>
      <Text style={s.blockTitle}>TRACK RECORD</Text>
      {/* Aggregate pills — tabular numerals */}
      <View style={s.trackPillsRow}>
        {TRACK_PILLS.map((pill) => (
          <View key={pill.label} style={s.trackPill}>
            <Text style={s.trackPillValue}>{pill.value}</Text>
            <Text style={s.trackPillLabel}>{pill.label}</Text>
          </View>
        ))}
      </View>
      {/* Roster capacity line */}
      <View style={s.trackCapacityRow}>
        <Text style={s.trackCapacityText}>
          Roster: 4 athletes · capacity 6 · responds in ~3h
        </Text>
      </View>
      {/* DEMO label */}
      <View style={s.demoChip}>
        <Text style={s.demoChipText}>DEMO</Text>
      </View>
    </GlassBlock>
  );
}

// ── Section 4: REP AGREEMENT ──────────────────────────────────────────────

function RepAgreementBlock() {
  return (
    <GlassBlock>
      <Text style={s.blockTitle}>REP AGREEMENT</Text>
      <View style={s.agreementRow}>
        <Ionicons name="document-text-outline" size={16} color={MUTED} />
        <View style={{ flex: 1 }}>
          <Text style={s.agreementText}>
            Standard agreement: 1-yr term · mutual 30-day termination · no fee tail · no likeness rights
          </Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert('Rep Agreement', 'Standard agreement document. (DEMO)')
          }
          accessibilityRole="button"
          accessibilityLabel="View rep agreement"
        >
          <Text style={s.agreementViewLink}>view</Text>
        </Pressable>
      </View>
    </GlassBlock>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function AgentProfile() {
  const insets = useSafeAreaInsets();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Persistent custom banner video (banner/avatar chrome kept verbatim).
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:agent-profile:bannerVideo:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setBannerVideo(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:agent-profile:bannerVideo:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBannerHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (bannerVideo) {
      AsyncStorage.setItem('proslync:agent-profile:bannerVideo:v1', bannerVideo).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:agent-profile:bannerVideo:v1').catch(() => {});
    }
  }, [bannerVideo, bannerHydrated]);

  const media = PROFILE_MEDIA.agent;
  const effectiveBannerVideo = bannerVideo ?? media.bannerVideo ?? null;

  const bannerPlayer = useVideoPlayer(effectiveBannerVideo, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    if (!bannerPlayer || !effectiveBannerVideo) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { bannerPlayer.play(); } catch {}
      }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [bannerPlayer, effectiveBannerVideo]);

  const pickBannerVideo = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const src = result.assets[0].uri;
      let persistedUri = src;
      try {
        const dir = `${FileSystem.documentDirectory}proslync-media/profile-banner/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const ext = (src.split('?')[0].split('.').pop() || 'mp4').toLowerCase();
        const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : 'mp4';
        const dest = `${dir}${Date.now()}.${safeExt}`;
        await FileSystem.copyAsync({ from: src, to: dest });
        persistedUri = dest;
      } catch {
        // Fall back to original URI if copy fails.
      }
      setBannerVideo(persistedUri);
    }
  }, []);

  const removeBannerVideo = React.useCallback(() => {
    setBannerVideo(null);
  }, []);

  // ── Old tab state — unmounted; kept as _ vars so code is not deleted ──
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _oldTab = 'about'; // was: 'about' | 'roster' | 'career' | 'network'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _oldExpanded: Set<string> = new Set(['mission']);

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — gradient keyed to agent persona accent */}
        {(() => {
          const persona = personaFor('agent');
          return (
            <View style={[s.bannerWrap, { height: insets.top + 290 }]} pointerEvents="none">
              {effectiveBannerVideo ? (
                <VideoView
                  player={bannerPlayer}
                  style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                  contentFit="cover"
                  nativeControls={false}
                />
              ) : (
                <LinearGradient
                  colors={[persona.bannerColors[0], persona.bannerColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.20)' }]}
                pointerEvents="none"
              />
            </View>
          );
        })()}

        {/* Trust storefront — four GlassBlock sections */}
        <View style={s.pageContent}>
          {/* Agent name + VERIFIED REP inline */}
          {(() => {
            const persona = personaFor('agent');
            return (
              <>
                <View style={s.identityRow}>
                  <Text style={s.agentName}>{persona.displayName}</Text>
                  <View style={s.verifiedInlinePill}>
                    <Ionicons name="shield-checkmark" size={12} color={GREEN} />
                    <Text style={s.verifiedInlineText}>VERIFIED REP</Text>
                  </View>
                </View>
                <Text style={s.agentMeta}>{persona.tagline} · {persona.handle}</Text>
              </>
            );
          })()}

          {/* 1. Verification */}
          <VerificationBlock />

          {/* 2. Fees — Published */}
          <FeesBlock />

          {/* 3. Track Record */}
          <TrackRecordBlock />

          {/* 4. Rep Agreement */}
          <RepAgreementBlock />

          {/* Muted invite line — no contact CTA (athletes invite from their side) */}
          <Text style={s.inviteLine}>
            Athletes: add this rep from your Deals tab.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[s.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (kept verbatim) */}
      <Pressable
        style={[s.topLeftProfilePill, { top: insets.top + 8 }]}
        onPress={() => setRoleSheetVisible(true)}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <View style={s.topLeftProfilePillGlass} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        {media.avatar ? (
          <Image
            source={media.avatar}
            style={s.topLeftProfilePillAvatar}
          />
        ) : (
          <IdentityAvatar
            name={personaFor('agent').displayName}
            size={40}
            accent={personaFor('agent').accent}
          />
        )}
        <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
      </Pressable>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        onChangeBanner={pickBannerVideo}
        onRemoveBanner={removeBannerVideo}
        hasCustomBanner={!!bannerVideo}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  // Page content below banner
  pageContent: {
    marginTop: -20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },

  // Identity
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  agentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  verifiedInlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52,199,89,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.30)',
  },
  verifiedInlineText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: GREEN,
  },
  agentMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: -0.1,
    lineHeight: 18,
    marginBottom: 2,
  },

  // Section block title
  blockTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
    marginBottom: 10,
  },

  // VERIFICATION block
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.30)',
    marginBottom: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: GREEN,
  },
  verRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 10,
  },
  verRowFirst: {
    borderTopWidth: 0,
    paddingTop: 2,
  },
  verLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  verDetail: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  greenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(52,199,89,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.30)',
    flexShrink: 0,
  },
  greenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: GREEN,
  },

  // FEES block
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 10,
  },
  feeRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  feeDealType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  feeBenchmark: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 1,
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  feeFooter: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
    marginTop: 2,
  },

  // TRACK RECORD block
  trackPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  trackPill: {
    flex: 1,
    minWidth: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 3,
  },
  trackPillValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  trackPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 13,
  },
  trackCapacityRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
  },
  trackCapacityText: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  demoChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    marginTop: 4,
  },
  demoChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.35)',
  },

  // REP AGREEMENT block
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  agreementText: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },
  agreementViewLink: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.40)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },

  // Muted invite line
  inviteLine: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Bottom fade
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Top-left floating profile pill
  topLeftProfilePill: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
    zIndex: 100,
  },
  topLeftProfilePillGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  topLeftProfilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
