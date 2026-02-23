import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useMyVenues } from '@/hooks/use-venues-query';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { Venue } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VenueCardProps {
  venue: Venue;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

function VenueCard({ venue, onPress, colors }: VenueCardProps) {
  const location = [venue.city, venue.state].filter(Boolean).join(', ') || venue.address;

  return (
    <TouchableOpacity
      style={[styles.venueCard, { backgroundColor: colors.cardElevated }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {venue.imageUrl ? (
        <Image
          source={{ uri: venue.imageUrl }}
          style={[styles.venueImage, { backgroundColor: colors.backgroundSecondary }]}
        />
      ) : (
        <View style={[styles.venueImage, styles.venueImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="business-outline" size={32} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.venueContent}>
        <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        {location ? (
          <View style={styles.venueLocationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.venueLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function MyVenuesScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();

  const { data: venues = [], isLoading, refetch } = useMyVenues();

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });

  const renderVenue = ({ item, index }: { item: Venue; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <VenueCard
        venue={item}
        onPress={() => router.push(`/manage-venue/${item.id}`)}
        colors={colors}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Venues</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading venues...</Text>
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No venues yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            Venues you own or manage will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={venues}
          renderItem={renderVenue}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    paddingRight: 12,
  },
  venueImage: {
    width: 80,
    height: 80,
  },
  venueImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  venueLocation: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
});
