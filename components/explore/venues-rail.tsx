// ── VENUES RAIL ───────────────────────────────────────────
// Horizontal-scroll rail rendering a card per NCAA venue. The Map slice
// (next commit) will wire this above the "Live now" section in
// `explore-view.tsx`. For now this lives standalone so it can be unit-
// rendered without disturbing the existing Explore layout.
//
// Visual tokens match `explore-view.tsx`:
//   - radius 10
//   - hairline border, rgba(255,255,255,0.10)
//   - dark glass `rgba(255,255,255,0.055)`
//   - rose accent `FAN_ACCENT` (#C79AA5)
//
// Card surface: ~200×120, image (or placeholder), name, kind chip,
// capacity when present, school + conference. Each card is `Pressable`
// and logs the venue id when tapped — wiring lands with the Map slice.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FAN_ACCENT, FAN_ACCENT_BORDER } from '@/constants/brand';
import { useVenues } from '@/hooks/use-venues';
import type { Venue, VenueKind } from '@/lib/types/venue.types';

const ACCENT = FAN_ACCENT;

const KIND_LABEL: Record<VenueKind, string> = {
  arena: 'Arena',
  stadium: 'Stadium',
  field: 'Field',
  pool: 'Pool',
  track: 'Track',
  court: 'Court',
  rink: 'Rink',
  'multi-purpose': 'Multi-purpose',
};

const KIND_ICON: Record<
  VenueKind,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  arena: 'basketball-outline',
  stadium: 'american-football-outline',
  field: 'leaf-outline',
  pool: 'water-outline',
  track: 'walk-outline',
  court: 'tennisball-outline',
  rink: 'snow-outline',
  'multi-purpose': 'business-outline',
};

export interface VenuesRailProps {
  /** Optional pre-loaded venues. If omitted, hook supplies them. */
  venues?: Venue[];
  /** Override the section title. */
  title?: string;
  /** Tap handler — defaults to console.log of the venue id. */
  onVenuePress?: (venue: Venue) => void;
}

export function VenuesRail({
  venues,
  title = "Today's venues",
  onVenuePress,
}: VenuesRailProps) {
  const query = useVenues();
  const rows = venues ?? query.data?.venues ?? [];

  if (rows.length === 0) return null;

  const handlePress = (venue: Venue) => {
    if (onVenuePress) {
      onVenuePress(venue);
      return;
    }
    console.log('[venues-rail] tapped venue', venue.id);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {rows.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            onPress={() => handlePress(venue)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function VenueCard({
  venue,
  onPress,
}: {
  venue: Venue;
  onPress: () => void;
}) {
  const conferenceLabel = venue.school?.conferenceSeo
    ? venue.school.conferenceSeo.toUpperCase()
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {venue.image ? (
          <Image
            source={{ uri: venue.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name={KIND_ICON[venue.kind]}
              size={20}
              color={ACCENT}
            />
          </View>
        )}
        <View style={styles.kindChip}>
          <Text style={styles.kindChipText}>{KIND_LABEL[venue.kind]}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.metaRow}>
          {venue.school?.name ? (
            <Text style={styles.school} numberOfLines={1}>
              {venue.school.name}
            </Text>
          ) : null}
          {conferenceLabel ? (
            <Text style={styles.conference}>{conferenceLabel}</Text>
          ) : null}
        </View>
        {typeof venue.capacity === 'number' ? (
          <Text style={styles.capacity}>
            {`${formatCapacity(venue.capacity)} cap.`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatCapacity(n: number): string {
  if (n >= 1000) {
    const rounded = Math.round(n / 100) / 10;
    return `${rounded.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(n);
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    marginTop: 6,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  rail: {
    gap: 10,
    paddingHorizontal: 16,
  },
  card: {
    width: 200,
    height: 120,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
  },
  imageWrap: {
    height: 56,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  kindChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FAN_ACCENT_BORDER,
    backgroundColor: 'rgba(28,18,22,0.78)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  kindChipText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  school: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  conference: {
    color: FAN_ACCENT,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  capacity: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
