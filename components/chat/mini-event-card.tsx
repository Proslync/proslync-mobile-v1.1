import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { eventsApi } from '@/lib/api/events';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStableRouter } from '@/hooks/use-stable-router';
import { formatEventDate } from '@/lib/utils/date';

interface MiniEventCardProps {
  eventId: number;
}

export function MiniEventCard({ eventId }: MiniEventCardProps) {
  const { colors, isDark } = useAppTheme();
  const router = useStableRouter();
  const queryClient = useQueryClient();
  const [isRsvpd, setIsRsvpd] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEvent(eventId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleRsvp = async () => {
    if (isRsvpd || rsvpLoading) return;
    setRsvpLoading(true);
    try {
      await eventsApi.registerForEvent(eventId);
      setIsRsvpd(true);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } catch {
      // silently fail
    } finally {
      setRsvpLoading(false);
    }
  };

  const handlePress = () => {
    router.push({ pathname: '/event/[id]', params: { id: String(eventId) } });
  };

  if (isLoading) {
    return (
      <View style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="small" color={colors.textSecondary} style={{ padding: 30 }} />
      </View>
    );
  }

  if (!event) return null;

  const flyerUrl = event.flyer?.url || event.imageUrl;
  const alreadyRsvpd = isRsvpd || event.isUserRegistered;
  const isPaid = event.isPaid;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
      {/* Flyer Image — full aspect, no cropping */}
      {flyerUrl ? (
        <View style={styles.flyerContainer}>
          <Image source={{ uri: flyerUrl }} style={styles.flyer} resizeMode="contain" />
        </View>
      ) : (
        <View style={[styles.flyerContainer, styles.flyerPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
        </View>
      )}

      {/* Info Section */}
      <View style={styles.info}>
        <Text style={[styles.eventName, { color: colors.text }]} numberOfLines={2}>
          {event.name}
        </Text>
        {event.startDate && (
          <Text style={[styles.eventDate, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatEventDate(event.startDate)}
          </Text>
        )}
        {event.venue?.name && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
            <Text style={[styles.venueName, { color: colors.textTertiary }]} numberOfLines={1}>
              {event.venue.name}
            </Text>
          </View>
        )}

        {/* RSVP / Buy Ticket Button — full width, centered */}
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            alreadyRsvpd && styles.rsvpButtonDone,
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            if (!isPaid) handleRsvp();
            else handlePress();
          }}
          disabled={alreadyRsvpd || rsvpLoading}
          activeOpacity={0.8}
        >
          <GlassView
            {...(alreadyRsvpd ? liquidGlass.fillFaint : liquidGlass.fill)}
            borderRadius={8}
            style={StyleSheet.absoluteFill}
          />
          {rsvpLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.rsvpText, alreadyRsvpd && styles.rsvpTextDone]}>
              {alreadyRsvpd ? "RSVP'd" : isPaid ? 'Buy Ticket' : 'RSVP'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  flyerContainer: {
    width: CARD_WIDTH,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  flyer: {
    width: '100%',
    height: '100%',
  },
  flyerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 10,
    gap: 3,
  },
  eventName: {
    fontSize: 14,
    lineHeight: 18,
  },
  eventDate: {
    fontSize: 12,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  venueName: {
    fontSize: 11,
    flex: 1,
  },
  rsvpButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignSelf: 'stretch',
    marginTop: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rsvpButtonDone: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rsvpText: {
    fontSize: 13,
    color: '#fff',
  },
  rsvpTextDone: {
    color: 'rgba(255,255,255,0.5)',
  },
});
