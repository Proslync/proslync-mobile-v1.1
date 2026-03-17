// Ticket List - Shows user's tickets with status filter tabs
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useMyTickets } from '@/hooks/use-my-tickets';
import { TicketActionSheet } from './ticket-action-sheet';
import type { WalletEventCard } from '../../lib/types/wallet.types';
import type { UserTicket } from '@/lib/api/tickets';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';

// Filter tab definitions
const TICKET_FILTERS: { key: string; label: string; ticketStatus: string }[] = [
  { key: 'active', label: 'Active', ticketStatus: 'active' },
  { key: 'transferred', label: 'Transferred', ticketStatus: 'transferred' },
  { key: 'redeemed', label: 'Redeemed', ticketStatus: 'redeemed' },
  { key: 'cancelled', label: 'Cancelled', ticketStatus: 'cancelled' },
];

interface TicketListProps {
  rsvpEvents: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
  onActionComplete?: () => void;
}

interface TicketCardProps {
  event: WalletEventCard;
  onView: () => void;
  onActions: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
  dimmed?: boolean;
}

function formatDateLabel(date: Date) {
  return (
    date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' \u2022 ' +
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function ticketToCard(t: UserTicket): WalletEventCard {
  const start = new Date(t.event?.startDate || t.createdAt);
  return {
    id: t.eventId.toString(),
    ticketId: t.id,
    ticketStatus: t.status,
    title: t.event?.name || 'Event',
    dateTime: t.event?.startDate || t.createdAt,
    dateTimeLabel: formatDateLabel(start),
    venueName: t.event?.venue?.name || 'TBA',
    flyerUrl: t.event?.flyer?.url || t.event?.imageUrl || '',
    isEarningEnabled: false,
    isPaid: t.event?.isPaid ?? false,
    pricePaid: t.pricePaid ? Number(t.pricePaid) : undefined,
  };
}

function TicketCard({ event, onView, onActions, colors, isDark, dimmed }: TicketCardProps) {
  // Only show actions for active tickets and RSVP events (no ticketStatus)
  const hasActions = !event.ticketStatus || event.ticketStatus === 'active';

  return (
    <TouchableOpacity
      style={[
        styles.ticketCard,
        dimmed && { opacity: 0.6 },
      ]}
      onPress={onView}
      activeOpacity={0.8}
    >
      <GlassView
        {...liquidGlass.surface}
        borderRadius={16}
        style={StyleSheet.absoluteFillObject}
      />
      <Image source={{ uri: event.flyerUrl }} style={[styles.ticketImage, { backgroundColor: colors.backgroundSecondary }]} />
      <View style={styles.ticketInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          {event.ticketStatus === 'transferred' && (
            <View style={styles.transferredBadge}>
              <Ionicons name="arrow-redo" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.transferredText}>Transferred</Text>
            </View>
          )}
        </View>
        <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
        <View style={styles.ticketMeta}>
          <Text style={[styles.ticketVenue, { color: colors.textTertiary }]}>{event.venueName}</Text>
        </View>
      </View>
      {hasActions && (
        <TouchableOpacity
          style={[
            styles.viewBtn,
            { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)' }
          ]}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onActions();
          }}
          activeOpacity={0.7}
        >
          <GlassView
            {...liquidGlass.surface}
            borderRadius={20}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.viewBtnText, { color: isDark ? '#fff' : '#000' }]}>
            View
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function TicketList({ rsvpEvents, onViewEvent, onActionComplete }: TicketListProps) {
  const { colors, isDark } = useAppTheme();
  const [selectedEvent, setSelectedEvent] = useState<WalletEventCard | null>(null);
  const [activeFilter, setActiveFilter] = useState('active');

  const activeFilterDef = TICKET_FILTERS.find((f) => f.key === activeFilter)!;
  const { tickets, isLoading } = useMyTickets(activeFilterDef.ticketStatus);

  // Convert tickets to display cards
  const ticketCards = useMemo(() => tickets.map(ticketToCard), [tickets]);

  // Merge RSVP events into Active tab (they have no ticket status)
  const displayEvents = useMemo(() => {
    const merged = activeFilter === 'active' ? [...ticketCards, ...rsvpEvents] : ticketCards;
    return merged.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [ticketCards, rsvpEvents, activeFilter]);

  // Determine if a card should be dimmed (transferred/cancelled/redeemed)
  const isDimmed = (event: WalletEventCard) =>
    event.ticketStatus === 'cancelled' || event.ticketStatus === 'redeemed';

  const emptyLabel = `No ${activeFilterDef.label.toLowerCase()} tickets`;

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Tickets</Text>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {TICKET_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.surface}
              tintColor={activeFilter === f.key ? glassTint.fill : glassTint.surface}
              borderRadius={16}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : displayEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{emptyLabel}</Text>
        </View>
      ) : (
        <View style={styles.listContent}>
          {displayEvents.map((event, index) => (
            <Animated.View
              key={`${event.id}-${event.ticketId ?? 'rsvp'}`}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <TicketCard
                event={event}
                onView={() => onViewEvent(event.id)}
                onActions={() => setSelectedEvent(event)}
                colors={colors}
                isDark={isDark}
                dimmed={isDimmed(event)}
              />
            </Animated.View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  filterChipActive: {
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTextActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ticketTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    lineHeight: 18,
    flexShrink: 1,
  },
  transferredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transferredText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
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
  viewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden' as const,
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
