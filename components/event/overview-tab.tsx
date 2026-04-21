import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { QuickDetailsGrid } from './quick-details-grid';
import { DealsSection } from './deals-section';
import type { EventDetailExtended } from '@/lib/types/event-detail.types';
import type { EventDeal } from '@/lib/types/deals.types';

interface OverviewTabProps {
  event: EventDetailExtended;
  deals: EventDeal[];
  attendeeCount?: number;
  organizerName?: string;
  organizerAvatar?: string;
  organizerId?: string;
}

export function OverviewTab({
  event,
  deals,
  attendeeCount,
  organizerName,
  organizerAvatar,
  organizerId,
}: OverviewTabProps) {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  return (
    <View style={styles.container}>
      {/* Description */}
      {event.description && (
        <LiquidGlassView effect="regular" style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: colors.textTertiary }]}>
            {event.description}
          </Text>
        </LiquidGlassView>
      )}

      {/* Quick Details */}
      <QuickDetailsGrid event={event} />

      {/* Who's Going */}
      {attendeeCount != null && attendeeCount > 0 && (
        <LiquidGlassView effect="regular" style={styles.goingContainer}>
          <View style={styles.goingSection}>
            <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.goingText, { color: colors.text }]}>
              {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
            </Text>
          </View>
        </LiquidGlassView>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <LiquidGlassView effect="regular" style={styles.dealsContainer}>
          <DealsSection deals={deals} />
        </LiquidGlassView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 8,
  },
  descriptionContainer: {
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  goingContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  goingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  goingText: {
    fontSize: 15,
  },
  dealsContainer: {
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
});
