// Ticket List - Shows user's upcoming RSVP'd event tickets
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { WalletEventCard } from '../../lib/types/wallet.types';

interface TicketCarouselProps {
  events: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
}

interface TicketCardProps {
  event: WalletEventCard;
  onView: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}

function TicketCard({ event, onView, colors, isDark }: TicketCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.ticketCard,
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
      ]}
      onPress={onView}
      activeOpacity={0.8}
    >
      <Image source={{ uri: event.flyerUrl }} style={[styles.ticketImage, { backgroundColor: colors.backgroundSecondary }]} />
      <View style={styles.ticketInfo}>
        <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
        <Text style={[styles.ticketVenue, { color: colors.textTertiary }]}>{event.venueName}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function TicketCarousel({ events, onViewEvent }: TicketCarouselProps) {
  const { colors, isDark } = useAppTheme();

  // Filter upcoming events and sort soonest first
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.dateTime) >= now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [events]);

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Upcoming Tickets</Text>
      {upcomingEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No upcoming tickets</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {upcomingEvents.map((event) => (
            <TicketCard
              key={event.id}
              event={event}
              onView={() => onViewEvent(event.id)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  ticketCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketImage: {
    width: 80,
    height: 80,
  },
  ticketInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 2,
  },
  ticketTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    lineHeight: 18,
  },
  ticketDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  ticketVenue: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 12,
  },
});
