// ── BRAND DIRECTORY SEARCH (full-screen route) ──────────
// Sprint 2.1 (PLAN.md §2.1 — W20/W32). Lowercase-substring search
// across the brand directory. Each row shows displayName,
// category, revenue band, matched-field chips, and a source-ref
// freshness chip. Tap → `/brand/profile?brandId=<id>`.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  EmptyState,
  RADIUS_MD,
  RADIUS_PILL,
  RADIUS_SM,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useBrandsSearch } from '@/hooks/use-brand-companies';
import { REVENUE_BAND_LABEL } from '@/lib/types/brand-company.types';
import type { BrandSearchResult } from '@/lib/types/brand-company.types';

const FIELD_LABEL: Record<string, string> = {
  displayName: 'Name',
  legalName: 'Legal name',
  primaryCategories: 'Category',
  productsServices: 'Product',
};

function freshnessLabel(days: number): string {
  if (days <= 0) return 'TODAY';
  if (days === 1) return '1d OLD';
  return `${days}d OLD`;
}

function freshnessTone(days: number): Tone {
  if (days < 14) return 'success';
  if (days <= 60) return 'warning';
  return 'danger';
}

export default function BrandSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');
  const { data, isLoading } = useBrandsSearch(query);

  const results = data ?? [];
  const trimmed = query.trim();

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Brand directory</Text>
          <Text style={styles.headerSub}>
            Vetted brand profiles with sourced metadata
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchInput}>
          <Ionicons
            name="search"
            size={16}
            color="rgba(255,255,255,0.55)"
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search brands, categories, products"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchField}
            accessibilityLabel="Brand search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Ionicons
                name="close-circle"
                size={16}
                color="rgba(255,255,255,0.5)"
              />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.resultCount}>
          {isLoading
            ? 'Searching…'
            : `${results.length} ${results.length === 1 ? 'brand' : 'brands'} ${
                trimmed ? `matching "${trimmed}"` : 'in directory'
              }`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <EmptyState
            icon="hourglass-outline"
            title="Searching directory"
            body="Looking across brand names, categories, and product lines."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matches"
            body="Try a brand name, a category like footwear or beverage, or a product keyword."
          />
        ) : (
          <View style={styles.list}>
            {results.map((row) => (
              <BrandResultRow
                key={row.brandId}
                row={row}
                onPress={() =>
                  router.push(`/brand/profile?brandId=${row.brandId}`)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BrandResultRow({
  row,
  onPress,
}: {
  row: BrandSearchResult;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${row.displayName} profile`}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name="business-outline"
          size={16}
          color={TONE_COLOR.accent}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {row.displayName}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {row.category} · {REVENUE_BAND_LABEL[row.revenueBandUSD]}
          {row.matchScore > 0 ? ` · match ${row.matchScore}` : ''}
        </Text>
        <View style={styles.chipRow}>
          {row.matchedFields.map((f) => (
            <View key={f} style={styles.matchChip}>
              <Text style={styles.matchChipText}>{FIELD_LABEL[f] ?? f}</Text>
            </View>
          ))}
          <StatusPill
            label={freshnessLabel(row.sourceRef.freshnessDays)}
            tone={freshnessTone(row.sourceRef.freshnessDays)}
            size="sm"
            icon="time-outline"
          />
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.4)"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  iconBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  headerSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },

  searchWrap: { gap: 6, paddingBottom: 8, paddingHorizontal: 16 },
  searchInput: {
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchField: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  resultCount: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    paddingLeft: 4,
  },

  content: { gap: 16, paddingHorizontal: 16, paddingTop: 8 },
  list: { gap: 8 },

  row: {
    alignItems: 'center',
    backgroundColor: CARD_BG_INSET,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.32)',
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  rowMeta: { color: 'rgba(255,255,255,0.62)', fontSize: 11.5, fontWeight: '600' },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  matchChip: {
    backgroundColor: 'rgba(123,175,212,0.14)',
    borderColor: 'rgba(123,175,212,0.32)',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchChipText: {
    color: TONE_COLOR.info,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
