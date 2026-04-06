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
import { liquidGlass, glassTint, glassText, glassBorder, glassSurfaceTint } from '@/constants/glass/liquid-glass';


interface TicketListProps {
  rsvpEvents: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
  onActionComplete?: () => void;
}

interface TicketCardProps {
  event: WalletEventCard;
  onView: () => void;
  onActions: () => void;
  t: (typeof glassText)['dark'] | (typeof glassText)['light'];
  border: string;
  surfaceTint: string;
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

function TicketCard({ event, onView, onActions, t, border, surfaceTint, isDark, dimmed }: TicketCardProps) {
  const hasActions = !event.ticketStatus || event.ticketStatus === 'active';

  return (
    <TouchableOpacity
      style={[styles.ticketCard, { borderColor: border }, dimmed && { opacity: 0.6 }]}
      onPress={onView}
      activeOpacity={0.8}
    >
      <GlassView
        {...liquidGlass.surface}
        tintColor={surfaceTint}
        borderRadius={16}
        style={StyleSheet.absoluteFillObject}
      />
      <Image source={{ uri: event.flyerUrl }} style={[styles.ticketImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
      <View style={styles.ticketInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.ticketTitle, { color: t.primary }]} numberOfLines={2}>
            {event.title}
          </Text>
          {event.ticketStatus === 'transferred' && (
            <View style={[styles.transferredBadge, { borderColor: border }]}>
              <Ionicons name="arrow-redo" size={10} color={t.tertiary} />
              <Text style={[styles.transferredText, { color: t.tertiary }]}>Transferred</Text>
            </View>
          )}
        </View>
        <Text style={[styles.ticketDate, { color: t.secondary }]}>{event.dateTimeLabel}</Text>
        <View style={styles.ticketMeta}>
          <Text style={[styles.ticketVenue, { color: t.muted }]}>{event.venueName}</Text>
        </View>
      </View>
      {hasActions && (
        <TouchableOpacity
          style={[styles.viewBtn, { borderColor: border }]}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onActions();
          }}
          activeOpacity={0.7}
        >
          <GlassView
            {...liquidGlass.surface}
            tintColor={surfaceTint}
            borderRadius={20}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={[styles.viewBtnText, { color: t.primary }]}>Manage</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function TicketList({ rsvpEvents, onViewEvent, onActionComplete }: TicketListProps) {
  const { colors, isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const [selectedEvent, setSelectedEvent] = useState<WalletEventCard | null>(null);

  const { tickets, isLoading } = useMyTickets('active');

  // Convert tickets to display cards + merge RSVP events
  const ticketCards = useMemo(() => tickets.map(ticketToCard), [tickets]);
  const displayEvents = useMemo(() => {
    const merged = [...ticketCards, ...rsvpEvents];
    return merged.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [ticketCards, rsvpEvents]);

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Upcoming Tickets</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={t.muted} />
        </View>
      ) : displayEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No upcoming tickets</Text>
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
                t={t}
                border={border}
                surfaceTint={surfaceTint}
                isDark={isDark}
                dimmed={false}
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
    borderWidth: 1,
  },
  filterChipActive: {
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
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
    borderWidth: 1,
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
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transferredText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
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
