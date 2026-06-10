// ── MONEY DELTA ───────────────────────────────────────────
// Formatted financial amount with optional delta. Replaces 6+ hand-
// rolled `($/100).toLocaleString()` call-sites that all formatted
// negatives, compact suffixes, or currency symbols slightly
// differently. Canonical input is cents — keep callers integer-safe.

import * as React from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Brand } from '@/constants/brand';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type MoneyDeltaSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MoneyDeltaProps {
  amount: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  compact?: boolean;
  delta?: {
    amount: number;
    direction?: 'up' | 'down' | 'flat';
    positiveIs?: 'up' | 'down';
  };
  size?: MoneyDeltaSize;
}

const SIZE_TYPO: Record<MoneyDeltaSize, TextStyle> = {
  sm: Typography.callout,
  md: Typography.title,
  lg: Typography.heading,
  xl: Typography.display,
};

// Delta is one step smaller than the value, hand-picked rather than
// computed so the smallest size still has a legible delta line.
const DELTA_TYPO: Record<MoneyDeltaSize, TextStyle> = {
  sm: Typography.caption,
  md: Typography.callout,
  lg: Typography.title,
  xl: Typography.heading,
};

const CURRENCY_SYMBOL: Record<NonNullable<MoneyDeltaProps['currency']>, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

function formatCompact(dollars: number, currency: 'USD' | 'EUR' | 'GBP'): string {
  const sym = CURRENCY_SYMBOL[currency];
  const abs = Math.abs(dollars);
  const sign = dollars < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${sym}${Math.round(abs)}`;
  }

  // Use Intl with compact notation for K / M / B with 2 sig figs.
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumSignificantDigits: 2,
  }).format(abs);

  return `${sign}${sym}${formatted}`;
}

function formatFull(dollars: number, currency: 'USD' | 'EUR' | 'GBP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(dollars);
}

function resolveDirection(
  amount: number,
  explicit?: 'up' | 'down' | 'flat',
): 'up' | 'down' | 'flat' {
  if (explicit) return explicit;
  if (amount > 0) return 'up';
  if (amount < 0) return 'down';
  return 'flat';
}

function arrowFor(direction: 'up' | 'down' | 'flat'): string {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '–';
}

export function MoneyDelta({
  amount,
  currency = 'USD',
  compact = false,
  delta,
  size = 'md',
}: MoneyDeltaProps) {
  const { colors } = useAppTheme();

  const dollars = amount / 100;
  const formatted = compact
    ? formatCompact(dollars, currency)
    : formatFull(dollars, currency);

  let deltaNode: React.ReactNode = null;
  if (delta) {
    const dir = resolveDirection(delta.amount, delta.direction);
    const positiveIs = delta.positiveIs ?? 'up';

    let color: string;
    if (dir === 'flat') {
      color = colors.textSecondary;
    } else {
      const aligned = dir === positiveIs;
      color = aligned ? Brand.signal.success.mid : Brand.signal.danger.mid;
    }

    const deltaDollars = delta.amount / 100;
    const deltaFormatted = compact
      ? formatCompact(Math.abs(deltaDollars), currency)
      : formatFull(Math.abs(deltaDollars), currency);

    deltaNode = (
      <Text style={[DELTA_TYPO[size], styles.delta, { color }]}>
        {`${arrowFor(dir)} ${deltaFormatted}`}
      </Text>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={[SIZE_TYPO[size], { color: colors.text, fontWeight: '900' }]}>
        {formatted}
      </Text>
      {deltaNode}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  delta: {
    fontWeight: '700',
  },
});
