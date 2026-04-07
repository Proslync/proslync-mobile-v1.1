import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassView } from 'expo-glass-effect';
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
        <Text style={[styles.description, { color: colors.textTertiary }]}>
          {event.description}
        </Text>
      )}

      {/* Quick Details */}
      <QuickDetailsGrid event={event} />

      {/* Who's Going */}
      {attendeeCount != null && attendeeCount > 0 && (
        <GlassSurface fill="subtle" border="subtle" cornerRadius="md" style={styles.goingSection}>
          <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.goingText, { color: colors.text }]}>
            {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
          </Text>
        </GlassSurface>
      )}

      {/* Deals */}
      <DealsSection deals={deals} />

      {/* Organizer Contact */}
      {organizerName && (
        <View style={styles.organizerSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Organizer</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (organizerId) {
                router.push({
                  pathname: '/user/[username]',
                  params: { username: organizerName, userId: organizerId },
                });
              }
            }}
            style={[styles.organizerCard, { overflow: 'hidden' }]}
          >
            <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />
            {organizerAvatar ? (
              <Image source={{ uri: organizerAvatar }} style={styles.organizerAvatar} />
            ) : (
              <View style={[styles.organizerAvatarPlaceholder, { backgroundColor: `${glassColor}0.1)` }]}>
                <Ionicons name="person" size={18} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.organizerInfo}>
              <Text style={[styles.organizerName, { color: colors.text }]}>{organizerName}</Text>
              <Text style={[styles.organizerLabel, { color: colors.textTertiary }]}>Event Organizer</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  goingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  goingText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  organizerSection: {
    gap: 0,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  organizerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  organizerLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
});
