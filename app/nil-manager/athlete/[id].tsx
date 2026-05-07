// NIL Manager → athlete drill-down. Shows individual deals, contracts,
// commitments, brand contacts, and AI compliance reviews — gated by the
// athlete's consent level.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  NIL_MANAGER_ATHLETES,
  type ConsentLevel,
  type NilDealCompact,
} from '@/lib/data/mock-nil-manager-data';

const ACCENT = '#FF6F3C';

function reviewColor(status: 'cleared' | 'review' | 'flagged'): string {
  if (status === 'cleared') return '#34C759';
  if (status === 'review') return '#FFD60A';
  return '#FF453A';
}

function reviewLabel(status: 'cleared' | 'review' | 'flagged'): string {
  if (status === 'cleared') return 'Cleared';
  if (status === 'review') return 'In review';
  return 'Flagged';
}

function consentMeta(level: ConsentLevel): { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } {
  if (level === 'full') return { label: 'Full access granted', color: '#34C759', icon: 'checkmark-circle' };
  if (level === 'summary') return { label: 'Summary only', color: '#FFD60A', icon: 'eye-outline' };
  return { label: 'Withheld by athlete', color: 'rgba(255,255,255,0.6)', icon: 'lock-closed' };
}

export default function NilManagerAthleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const athlete = NIL_MANAGER_ATHLETES.find((a) => a.id === params.id);

  if (!athlete) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60, paddingHorizontal: 16 }]}>
        <Text style={styles.notFoundText}>Athlete not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundBack}>
          <Text style={styles.notFoundBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const consent = consentMeta(athlete.consentLevel);
  const canSeeDeals = athlete.consentLevel === 'full';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity header */}
        <Animated.View entering={FadeInDown.duration(360)} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={[styles.heroAvatar, { backgroundColor: athlete.color }]}>
              <Text style={styles.heroAvatarText}>{athlete.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName} numberOfLines={1}>{athlete.name}</Text>
              <Text style={styles.heroMeta} numberOfLines={1}>
                {athlete.sport} · {athlete.classYear}{athlete.position ? ` · ${athlete.position}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{athlete.brandDeals}</Text>
              <Text style={styles.summaryLabel}>Brand deals</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{athlete.totalDealValue}</Text>
              <Text style={styles.summaryLabel}>Total value</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{athlete.ytdEarnings}</Text>
              <Text style={styles.summaryLabel}>YTD earnings</Text>
            </View>
          </View>
        </Animated.View>

        {/* Consent banner */}
        <Animated.View entering={FadeInDown.delay(80).duration(360)} style={[styles.consentBanner, { borderColor: `${consent.color}55`, backgroundColor: `${consent.color}14` }]}>
          <Ionicons name={consent.icon} size={18} color={consent.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.consentTitle, { color: consent.color }]}>{consent.label}</Text>
            {athlete.consentNote && <Text style={styles.consentNote}>{athlete.consentNote}</Text>}
            {!athlete.consentNote && athlete.consentLevel === 'full' && (
              <Text style={styles.consentNote}>You can view all deals, contracts, contacts, and AI reviews.</Text>
            )}
          </View>
          {athlete.consentLevel !== 'full' && (
            <Pressable style={styles.requestPill}>
              <Text style={styles.requestPillText}>Request access</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Compliance flags */}
        {athlete.complianceFlags.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(360)}>
            <Text style={styles.sectionLabel}>COMPLIANCE FLAGS</Text>
            {athlete.complianceFlags.map((f) => {
              const c = f.severity === 'critical' ? '#FF453A' : f.severity === 'warn' ? '#FFD60A' : 'rgba(255,255,255,0.7)';
              return (
                <View key={f.id} style={[styles.flagCard, { borderColor: `${c}55`, backgroundColor: `${c}10` }]}>
                  <Ionicons
                    name={f.severity === 'critical' ? 'alert-circle' : f.severity === 'warn' ? 'warning' : 'information-circle'}
                    size={16}
                    color={c}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.flagTitle, { color: c }]}>{f.title}</Text>
                    <Text style={styles.flagDetail}>{f.detail}</Text>
                  </View>
                  {f.dueIn && (
                    <Text style={[styles.flagDue, { color: c }]}>{f.dueIn}</Text>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Deals section — visible only with full consent */}
        <Animated.View entering={FadeInDown.delay(200).duration(360)}>
          <Text style={styles.sectionLabel}>BRAND DEALS · {athlete.deals.length}</Text>
          {canSeeDeals && athlete.deals.length > 0 ? (
            athlete.deals.map((d, i) => <DealCard key={d.id} deal={d} index={i} />)
          ) : (
            <View style={styles.lockedCard}>
              <Ionicons name="lock-closed" size={22} color="rgba(255,255,255,0.45)" />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>Deal details not shared</Text>
                <Text style={styles.lockedBody}>
                  {athlete.consentLevel === 'summary'
                    ? 'Athlete has shared roster summary only. Request access for individual deal data, contracts, brand contacts, and AI reviews.'
                    : 'Athlete has not granted access to NIL detail. Aggregate counts only.'}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating back chevron */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { bottom: insets.bottom + 20 }]}
        accessibilityLabel="Back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

function DealCard({ deal, index }: { deal: NilDealCompact; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const ncaa = reviewColor(deal.ncaaReview.status);
  const school = reviewColor(deal.schoolReview.status);
  const ethics = reviewColor(deal.ethicsReview.status);

  return (
    <Animated.View
      entering={FadeInDown.delay(60 * index).duration(300)}
      style={styles.dealCard}
    >
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.dealHead}>
        <View style={[styles.dealBrandLogo, { backgroundColor: deal.brandColor }]}>
          <Text style={styles.dealBrandInitial}>{deal.brandInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dealBrand} numberOfLines={1}>{deal.brand}</Text>
          <Text style={styles.dealCategory} numberOfLines={1}>{deal.category} · {deal.stage}</Text>
        </View>
        <Text style={styles.dealValue}>{deal.value}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(255,255,255,0.6)"
        />
      </Pressable>

      <View style={styles.reviewBar}>
        <View style={[styles.reviewPill, { borderColor: `${ncaa}55`, backgroundColor: `${ncaa}10` }]}>
          <Text style={[styles.reviewLabel, { color: ncaa }]}>NCAA · {reviewLabel(deal.ncaaReview.status)}</Text>
        </View>
        <View style={[styles.reviewPill, { borderColor: `${school}55`, backgroundColor: `${school}10` }]}>
          <Text style={[styles.reviewLabel, { color: school }]}>School · {reviewLabel(deal.schoolReview.status)}</Text>
        </View>
        <View style={[styles.reviewPill, { borderColor: `${ethics}55`, backgroundColor: `${ethics}10` }]}>
          <Text style={[styles.reviewLabel, { color: ethics }]}>Ethics · {reviewLabel(deal.ethicsReview.status)}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.dealExpanded}>
          {/* Term */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Term</Text>
            <Text style={styles.detailValue}>{deal.startDate} → {deal.endDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exclusivity</Text>
            <Text style={styles.detailValue}>{deal.exclusivity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contract</Text>
            <Text style={[
              styles.detailValue,
              { color: deal.contractStatus === 'signed' ? '#34C759' : deal.contractStatus === 'pending' ? '#FFD60A' : '#FF453A' },
            ]}>
              {deal.contractStatus === 'signed' ? 'Signed · on file' : deal.contractStatus === 'pending' ? 'Pending signature' : 'Expired'}
            </Text>
          </View>

          {/* Brand contact */}
          <View style={styles.contactCard}>
            <Text style={styles.contactHeader}>Brand contact</Text>
            <Text style={styles.contactName}>{deal.brandContact.name}</Text>
            <Text style={styles.contactRole}>{deal.brandContact.role}</Text>
            <Text style={styles.contactDetail}>{deal.brandContact.email}</Text>
            {deal.brandContact.phone && (
              <Text style={styles.contactDetail}>{deal.brandContact.phone}</Text>
            )}
          </View>

          {/* AI reviews */}
          <View style={styles.aiBlock}>
            <View style={styles.aiBlockHead}>
              <Ionicons name="sparkles" size={14} color={ACCENT} />
              <Text style={styles.aiBlockTitle}>AI reviews · NCAA + school + ethics</Text>
            </View>
            <ReviewLine label="NCAA" color={ncaa} statusLabel={reviewLabel(deal.ncaaReview.status)} note={deal.ncaaReview.note} />
            <ReviewLine label="School" color={school} statusLabel={reviewLabel(deal.schoolReview.status)} note={deal.schoolReview.note} />
            <ReviewLine label="Ethics" color={ethics} statusLabel={reviewLabel(deal.ethicsReview.status)} note={deal.ethicsReview.note} />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function ReviewLine({ label, color, statusLabel, note }: { label: string; color: string; statusLabel: string; note: string }) {
  return (
    <View style={styles.reviewLine}>
      <View style={styles.reviewLineHead}>
        <Text style={styles.reviewLineLabel}>{label}</Text>
        <Text style={[styles.reviewLineStatus, { color }]}>{statusLabel}</Text>
      </View>
      <Text style={styles.reviewLineNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 16, gap: 12 },
  notFoundText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  notFoundBack: { backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  notFoundBackText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  heroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  heroName: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  heroMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#FFF', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginTop: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.10)' },

  consentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  consentTitle: { fontSize: 13, fontWeight: '800' },
  consentNote: { color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 16, marginTop: 2 },
  requestPill: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
  },
  requestPillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)', marginTop: 12, marginBottom: 6, paddingHorizontal: 4,
  },

  flagCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  flagTitle: { fontSize: 12, fontWeight: '800' },
  flagDetail: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  flagDue: { fontSize: 11, fontWeight: '800' },

  dealCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  dealHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealBrandLogo: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  dealBrandInitial: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  dealBrand: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  dealCategory: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  dealValue: { color: '#FFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },

  reviewBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reviewPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reviewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  dealExpanded: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detailLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', width: 92 },
  detailValue: { color: '#FFF', fontSize: 12, flex: 1, textAlign: 'right' },

  contactCard: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  contactHeader: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  contactName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  contactRole: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  contactDetail: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },

  aiBlock: {
    marginTop: 4,
    backgroundColor: 'rgba(255,111,60,0.06)',
    borderColor: 'rgba(255,111,60,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
  },
  aiBlockHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiBlockTitle: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  reviewLine: { paddingVertical: 6, gap: 4 },
  reviewLineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  reviewLineLabel: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  reviewLineStatus: { fontSize: 11, fontWeight: '800' },
  reviewLineNote: { color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 15 },

  lockedCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  lockedTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  lockedBody: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 17, marginTop: 4 },

  backBtn: {
    position: 'absolute',
    left: 14,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
});
