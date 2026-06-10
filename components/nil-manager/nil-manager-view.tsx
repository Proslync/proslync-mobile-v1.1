// NIL Manager view (renders inside the Activity tab when role === 'nilManager').
// View-only roster with top-level metrics + compliance flags. Tap an athlete
// to drill into deal-level detail (gated by consent level).

import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import {
  NIL_MANAGER_ATHLETES,
  NIL_MANAGER_PROFILE,
  type ConsentLevel,
  type ComplianceFlagSeverity,
} from '@/lib/data/mock-nil-manager-data';

const ACCENT = '#FF6F3C';
const SCHOOL_BLUE = '#001A57';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

function consentBadge(level: ConsentLevel): { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } {
  if (level === 'full') return { label: 'Full access', color: '#34C759', icon: 'checkmark-circle' };
  if (level === 'summary') return { label: 'Summary only', color: '#FFD60A', icon: 'eye-outline' };
  return { label: 'Withheld', color: 'rgba(255,255,255,0.45)', icon: 'lock-closed' };
}

function severityColor(severity: ComplianceFlagSeverity): string {
  if (severity === 'critical') return '#FF453A';
  if (severity === 'warn') return '#FFD60A';
  return 'rgba(255,255,255,0.7)';
}

export function NilManagerView() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const flagsBySeverity = React.useMemo(() => {
    const flags = NIL_MANAGER_ATHLETES.flatMap((a) => a.complianceFlags);
    return {
      critical: flags.filter((f) => f.severity === 'critical').length,
      warn: flags.filter((f) => f.severity === 'warn').length,
      info: flags.filter((f) => f.severity === 'info').length,
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* School / role context header */}
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.heroCard, { backgroundColor: SCHOOL_BLUE }]}>
          <View style={styles.heroHead}>
            <View style={styles.schoolLogo}>
              <Text style={styles.schoolLogoText}>D</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.schoolName}>{NIL_MANAGER_PROFILE.school}</Text>
              <Text style={styles.heroSub}>NIL Manager · view-only</Text>
            </View>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{NIL_MANAGER_PROFILE.rosterSize}</Text>
              <Text style={styles.heroStatLabel}>Roster</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{NIL_MANAGER_PROFILE.totalActiveDeals}</Text>
              <Text style={styles.heroStatLabel}>Active deals</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{NIL_MANAGER_PROFILE.totalRosterValueYtd}</Text>
              <Text style={styles.heroStatLabel}>YTD value</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: '#FFD60A' }]}>{NIL_MANAGER_PROFILE.openComplianceItems}</Text>
              <Text style={styles.heroStatLabel}>Flags</Text>
            </View>
          </View>
        </Animated.View>

        {/* Compliance summary chips */}
        {(flagsBySeverity.critical + flagsBySeverity.warn + flagsBySeverity.info) > 0 && (
          <View style={styles.complianceRow}>
            {flagsBySeverity.critical > 0 && (
              <View style={[styles.complianceChip, { borderColor: 'rgba(255,69,58,0.55)', backgroundColor: 'rgba(255,69,58,0.12)' }]}>
                <Ionicons name="alert-circle" size={13} color="#FF453A" />
                <Text style={[styles.complianceChipText, { color: '#FF453A' }]}>{flagsBySeverity.critical} critical</Text>
              </View>
            )}
            {flagsBySeverity.warn > 0 && (
              <View style={[styles.complianceChip, { borderColor: 'rgba(255,214,10,0.55)', backgroundColor: 'rgba(255,214,10,0.12)' }]}>
                <Ionicons name="warning" size={13} color="#FFD60A" />
                <Text style={[styles.complianceChipText, { color: '#FFD60A' }]}>{flagsBySeverity.warn} upcoming</Text>
              </View>
            )}
            {flagsBySeverity.info > 0 && (
              <View style={[styles.complianceChip, { borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <Ionicons name="information-circle" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={[styles.complianceChipText, { color: 'rgba(255,255,255,0.85)' }]}>{flagsBySeverity.info} info</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>ROSTER · {NIL_MANAGER_ATHLETES.length}</Text>

        {NIL_MANAGER_ATHLETES.map((a, i) => {
          const consent = consentBadge(a.consentLevel);
          const topFlag = a.complianceFlags.sort((x, y) => {
            const order = { critical: 0, warn: 1, info: 2 } as const;
            return order[x.severity] - order[y.severity];
          })[0];
          return (
            <Animated.View
              key={a.id}
              entering={FadeInDown.delay(60 + i * 40).duration(360)}
            >
              <Pressable
                onPress={() => router.push({ pathname: '/nil-manager/athlete/[id]', params: { id: a.id } } as any)}
                style={({ pressed }) => [styles.athleteCard, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${a.name} deal detail`}
              >
                <View style={styles.athleteRow}>
                  <View style={[styles.athleteAvatar, { backgroundColor: a.color }]}>
                    <Text style={styles.athleteAvatarText}>{a.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.athleteName} numberOfLines={1}>{a.name}</Text>
                    <Text style={styles.athleteMeta} numberOfLines={1}>
                      {a.sport} · {a.classYear}{a.position ? ` · ${a.position}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.consentBadge, { borderColor: `${consent.color}55`, backgroundColor: `${consent.color}1A` }]}>
                    <Ionicons name={consent.icon} size={11} color={consent.color} />
                    <Text style={[styles.consentBadgeText, { color: consent.color }]}>{consent.label}</Text>
                  </View>
                </View>

                <View style={styles.athleteMetricsRow}>
                  <View style={styles.athleteMetric}>
                    <Text style={styles.athleteMetricValue}>{a.brandDeals}</Text>
                    <Text style={styles.athleteMetricLabel}>Brand deals</Text>
                  </View>
                  <View style={styles.athleteMetricDivider} />
                  <View style={styles.athleteMetric}>
                    <Text style={styles.athleteMetricValue}>{a.totalDealValue}</Text>
                    <Text style={styles.athleteMetricLabel}>Total value</Text>
                  </View>
                  <View style={styles.athleteMetricDivider} />
                  <View style={styles.athleteMetric}>
                    <Text style={styles.athleteMetricValue}>{a.ytdEarnings}</Text>
                    <Text style={styles.athleteMetricLabel}>YTD</Text>
                  </View>
                </View>

                {topFlag && (
                  <View style={[styles.flagRow, { borderColor: `${severityColor(topFlag.severity)}55`, backgroundColor: `${severityColor(topFlag.severity)}10` }]}>
                    <Ionicons
                      name={topFlag.severity === 'critical' ? 'alert-circle' : topFlag.severity === 'warn' ? 'warning' : 'information-circle'}
                      size={14}
                      color={severityColor(topFlag.severity)}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.flagTitle, { color: severityColor(topFlag.severity) }]} numberOfLines={1}>
                        {topFlag.title}
                      </Text>
                      <Text style={styles.flagDetail} numberOfLines={1}>{topFlag.detail}</Text>
                    </View>
                    {topFlag.dueIn && (
                      <Text style={[styles.flagDue, { color: severityColor(topFlag.severity) }]} numberOfLines={1}>
                        {topFlag.dueIn}
                      </Text>
                    )}
                  </View>
                )}

                {a.consentLevel !== 'full' && a.consentNote && (
                  <Text style={styles.consentNote}>{a.consentNote}</Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        <Text style={styles.footnote}>
          NIL Manager view is read-only. Each athlete chooses what level of detail to share with the school. Tap a row marked "Summary only" or "Withheld" to request additional access.
        </Text>
      </ScrollView>

      {/* Bottom darken gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 170 }]}
        pointerEvents="none"
      />

      {/* Top fade — gives the floating top pill row visual depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Floating header row — avatar/menu pill (TOP). No tabs for NIL Manager. */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.headerPill}
          onPress={() => setRoleSheetVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.headerPillAvatar} />
          <Ionicons name="menu" size={22} color="#FFF" style={styles.headerPillIcon} />
        </Pressable>
      </View>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 16, gap: 12 },

  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Floating header row — avatar/menu pill (matches brand/agent/player chrome)
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
  },
  headerPillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  schoolLogo: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  schoolLogoText: { color: '#001A57', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  schoolName: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'] },
  heroStatLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4, marginTop: 2 },
  heroStatDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.18)' },

  complianceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  complianceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  complianceChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)', marginTop: 8, paddingHorizontal: 4,
  },

  athleteCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  athleteAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  athleteAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  athleteName: { fontSize: 15, color: '#FFF', fontWeight: '800', letterSpacing: -0.2 },
  athleteMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  consentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  consentBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  athleteMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  athleteMetric: { flex: 1, alignItems: 'center' },
  athleteMetricValue: { fontSize: 14, color: '#FFF', fontWeight: '800', fontVariant: ['tabular-nums'] },
  athleteMetricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  athleteMetricDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.10)' },

  flagRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flagTitle: { fontSize: 12, fontWeight: '800' },
  flagDetail: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  flagDue: { fontSize: 11, fontWeight: '800' },

  consentNote: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' },

  footnote: {
    fontSize: 11, color: 'rgba(255,255,255,0.45)',
    lineHeight: 16, paddingHorizontal: 4, marginTop: 10,
  },
});
