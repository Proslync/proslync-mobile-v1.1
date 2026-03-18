import * as React from 'react';
import { View, Text, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassButton } from '@/components/glass';
import { VenueMap, openDirections, openRideShare } from './venue-map';
import type { Event } from '@/lib/types/events.types';

interface MapTabProps {
  event: Event;
  coordinates: { lat: number; lng: number } | null;
  address?: string | null;
  venueName?: string;
}

export function MapTab({ event, coordinates, address, venueName }: MapTabProps) {
  const { colors, isDark } = useAppTheme();
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${event.name}${venueName ? ` at ${venueName}` : ''}${address ? `\n${address}` : ''}`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Venue info */}
      {venueName && (
        <View style={styles.venueInfo}>
          <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
          <View style={styles.venueTextContainer}>
            <Text style={[styles.venueName, { color: colors.text }]}>{venueName}</Text>
            {address && (
              <Text style={[styles.venueAddress, { color: colors.textTertiary }]}>{address}</Text>
            )}
          </View>
        </View>
      )}

      {/* Map */}
      {coordinates && (
        <VenueMap
          latitude={coordinates.lat}
          longitude={coordinates.lng}
          venueName={venueName}
          address={address || undefined}
        />
      )}

      {!coordinates && (
        <View style={[styles.noMap, { overflow: 'hidden', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="location-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.noMapText, { color: colors.textTertiary }]}>Location not available</Text>
        </View>
      )}

      {/* Action buttons */}
      {coordinates && (
        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <GlassButton
              label="Directions"
              icon={<Ionicons name="navigate-outline" size={16} color={colors.text} />}
              onPress={() => openDirections(coordinates.lat, coordinates.lng, venueName)}
              fullWidth
            />
          </View>
          <View style={styles.actionButton}>
            <GlassButton
              label="Rideshare"
              icon={<Ionicons name="car-outline" size={16} color={colors.text} />}
              onPress={() => openRideShare(coordinates.lat, coordinates.lng, venueName)}
              fullWidth
            />
          </View>
          <View style={styles.actionButton}>
            <GlassButton
              label="Share"
              icon={<Ionicons name="share-outline" size={16} color={colors.text} />}
              onPress={handleShare}
              fullWidth
            />
          </View>
        </View>
      )}

      {/* Transport info */}
      {address && (
        <View style={[styles.transportSection, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <Text style={[styles.transportTitle, { color: colors.text }]}>Getting There</Text>
          <View style={styles.transportRow}>
            <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.transportText, { color: colors.textTertiary }]}>
              Rideshare recommended. Drop-off at main entrance.
            </Text>
          </View>
          <View style={styles.transportRow}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.transportText, { color: colors.textTertiary }]}>
              Limited street parking available.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  venueTextContainer: {
    flex: 1,
    gap: 2,
  },
  venueName: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  venueAddress: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  noMap: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  noMapText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  transportSection: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  transportTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  transportText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
  },
});
