// Explore Events - Earning-enabled event discovery

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletEventCard } from '../../lib/types/wallet.types';

interface ExploreEventsProps {
  events: WalletEventCard[];
  onViewEvent: (eventId: string) => void;
}

export function ExploreEvents({ events, onViewEvent }: ExploreEventsProps) {
  const [earningOnly, setEarningOnly] = useState(true);

  const filteredEvents = earningOnly
    ? events.filter((e) => e.isEarningEnabled)
    : events;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Explore Events</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Earning-enabled</Text>
          <Switch
            value={earningOnly}
            onValueChange={setEarningOnly}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#34c759' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Events */}
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>No events found</Text>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => onViewEvent(event.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: event.flyerUrl }} style={styles.eventFlyer} />
              <View style={styles.eventContent}>
                <View style={styles.eventTags}>
                  {event.isEarningEnabled && (
                    <View style={styles.earningTag}>
                      <Ionicons name="cash-outline" size={10} color="#34c759" />
                      <Text style={styles.earningTagText}>Earn $</Text>
                    </View>
                  )}
                  {event.perksLabel && (
                    <View style={styles.perkTag}>
                      <Text style={styles.perkTagText}>{event.perksLabel}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventMeta}>{event.dateTimeLabel}</Text>
                <Text style={styles.eventVenue}>{event.venueName}</Text>
                {event.isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Ionicons name="star" size={10} color="#f59e0b" />
                    <Text style={styles.recommendedText}>Recommended for you</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => onViewEvent(event.id)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },
  eventsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventFlyer: {
    width: 80,
    height: 100,
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  eventTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  earningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  earningTagText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#34c759',
  },
  perkTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  perkTagText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#8b5cf6',
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  eventVenue: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#f59e0b',
  },
  viewButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
});
