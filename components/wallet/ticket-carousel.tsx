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
import { WalletEventCard } from '../../lib/types/wallet.types';

interface TicketCarouselProps {
  events: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
}

function TicketCard({ event, onView }: { event: WalletEventCard; onView: () => void }) {
  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onView} activeOpacity={0.8}>
      <Image source={{ uri: event.flyerUrl }} style={styles.ticketImage} />
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.ticketDate}>{event.dateTimeLabel}</Text>
        <Text style={styles.ticketVenue}>{event.venueName}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function TicketCarousel({ events, onViewEvent }: TicketCarouselProps) {
  // Filter upcoming events and sort soonest first
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.dateTime) >= now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [events]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Upcoming Tickets</Text>
      {upcomingEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={40} color="rgba(0,0,0,0.2)" />
          <Text style={styles.emptyText}>No upcoming tickets</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {upcomingEvents.map((event) => (
            <TicketCard
              key={event.id}
              event={event}
              onView={() => onViewEvent(event.id)}
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
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
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
    color: '#1a1a1a',
    lineHeight: 18,
  },
  ticketDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
  },
  ticketVenue: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 12,
  },
});
