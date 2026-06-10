// ── AD REVENUE-SHARE FULL-SCREEN ROUTE ───────────────────
// Sprint 3.1 full-screen route. Renders the RevShareCard hero with the
// complete reverse-chronological ledger and a footer total. Reached
// from the School view → Compliance sub-tab → Revenue share preview.
//
// Deep link: status:///school/rev-share (or ?schoolId=...).

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  EntryRow,
  RevShareCard,
  formatMoney,
} from '@/components/school/rev-share-card';
import {
  CARD_BG,
  CARD_BORDER,
  KpiTile,
  RADIUS_MD,
} from '@/components/shared/ui-kit';
import { useSchoolRevShareLedger } from '@/hooks/use-rev-share';

export default function RevShareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ schoolId?: string }>();
  const schoolId = params.schoolId ?? 'school:syracuse';

  const { data: ledger, isLoading } = useSchoolRevShareLedger(schoolId);

  // Reverse-chronological full entry list.
  const sortedEntries = React.useMemo(() => {
    if (!ledger) return [];
    return [...ledger.entries].sort((a, b) =>
      b.recordedAt.localeCompare(a.recordedAt),
    );
  }, [ledger]);

  return (
    <View style={styles.container}>
      <DarkGradientBg />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : !ledger ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="cash-outline"
              size={26}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.emptyTitle}>No revenue-share ledger</Text>
            <Text style={styles.emptyBody}>
              No platform-fee ledger exists for {schoolId}. Once a fee
              agreement is signed and brand funds flow, the ledger will
              populate here.
            </Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(320)}>
              <RevShareCard ledger={ledger} previewCount={0} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(320)}>
              <Text style={styles.sectionKicker}>Full ledger · reverse-chronological</Text>
              <View style={styles.fullStack}>
                {sortedEntries.map((entry, idx) => (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInDown.delay(100 + idx * 25).duration(280)}
                  >
                    <EntryRow entry={entry} />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(320)}
              style={styles.footerTotalsCard}
            >
              <Text style={styles.footerKicker}>Period totals</Text>
              <View style={styles.footerSplitRow}>
                <View style={styles.kpiCell}>
                  <KpiTile
                    label="Gross"
                    value={formatMoney(ledger.totals.grossCents.cents)}
                    size="sm"
                    tone="brand"
                  />
                </View>
                <View style={styles.kpiCell}>
                  <KpiTile
                    label="Platform fee"
                    value={formatMoney(ledger.totals.platformFeeCents.cents)}
                    size="sm"
                    tone="warning"
                  />
                </View>
                <View style={styles.kpiCell}>
                  <KpiTile
                    label="School share"
                    value={formatMoney(ledger.totals.schoolDisbursementCents.cents)}
                    size="sm"
                    tone="success"
                  />
                </View>
                <View style={styles.kpiCell}>
                  <KpiTile
                    label="Athlete payout"
                    value={formatMoney(ledger.totals.athletePayoutCents.cents)}
                    size="sm"
                    tone="default"
                  />
                </View>
              </View>
              <Text style={styles.footerNote}>
                {sortedEntries.length} row
                {sortedEntries.length === 1 ? '' : 's'} · {ledger.period.label} ·
                last refreshed {ledger.updatedAt.slice(0, 10)}
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    gap: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  loadingBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyBox: {
    gap: 8,
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 17,
  },

  sectionKicker: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fullStack: {
    gap: 8,
  },

  footerTotalsCard: {
    gap: 8,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
    marginTop: 6,
  },
  footerKicker: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  footerSplitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCell: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  footerNote: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
