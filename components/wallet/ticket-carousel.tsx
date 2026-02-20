// Ticket List - Shows user's upcoming tickets with sell/transfer actions
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TicketActionSheet } from './ticket-action-sheet';
import type { WalletEventCard } from '../../lib/types/wallet.types';

interface TicketCarouselProps {
  events: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
  onActionComplete?: () => void;
}

interface TicketCardProps {
  event: WalletEventCard;
  onView: () => void;
  onActions: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}

function TicketCard({ event, onView, onActions, colors, isDark }: TicketCardProps) {
  const isListed = event.ticketStatus === 'listed';

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
        <View style={styles.ticketMeta}>
          <Text style={[styles.ticketVenue, { color: colors.textTertiary }]}>{event.venueName}</Text>
          {isListed && (
            <View style={styles.listedTag}>
              <Ionicons name="pricetag" size={10} color="#22c55e" />
              <Text style={styles.listedTagText}>
                ${event.listedPrice?.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.viewBtn,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
            borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)' }
        ]}
        onPress={(e) => {
          e.stopPropagation();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onActions();
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.viewBtnText, { color: isDark ? '#fff' : '#000' }]}>
          {isListed ? 'Listed' : 'View'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function TicketCarousel({ events, onViewEvent, onActionComplete }: TicketCarouselProps) {
  const { colors, isDark } = useAppTheme();
  const [selectedEvent, setSelectedEvent] = useState<WalletEventCard | null>(null);

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
              key={`${event.id}-${event.ticketId ?? 'rsvp'}`}
              event={event}
              onView={() => onViewEvent(event.id)}
              onActions={() => setSelectedEvent(event)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      )}
      <TicketActionSheet
        visible={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onActionComplete={onActionComplete}
      />
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
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketVenue: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  listedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listedTagText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
  },
  viewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
    marginRight: 12,
  },
  viewBtnText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
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
