// Phase 3 — Real Mapbox map for the fan Explore tab.
//
// Replaces the prior 2-col school-pin grid in `app/(fan-tabs)/explore.tsx`.
// Renders school + game-venue pins on a dark Mapbox map, refetches pins from
// `/api/fan/map/pins?bbox=...` as the user pans/zooms (camera-idle debounced
// 500ms), and falls back to a graceful card view when:
//   • `config.mapbox.accessToken` is empty (no token configured)
//   • Mapbox / @rnmapbox/maps is unavailable at runtime (Expo Go / native
//     module not linked yet) — caught so the rest of Explore keeps rendering
//
// Pin strategy:
//   • School pins → small circular markers, Ionicon "school"
//   • Game-venue pins → larger badges, status-colored (LIVE = red dot)
//   • Tap any marker → fires onSelectSchool / onSelectVenue + opens a
//     compact callout card overlaid on the map (name + state + game count)
//
// Performance: caps total markers at MAX_VISIBLE_PINS (200). Above that, we
// keep the most "interesting" pins (any with active gameIds, then nearest
// to the camera center, then alphabetical). MarkerView is used directly —
// fan-side pin counts in v1 are small (~5 schools seed); we'll switch to
// ShapeSource/SymbolLayer when the seed grows past 50.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useExploreMapPins } from '@/hooks/explore/use-explore-public';
import type {
  CachedGameStatus,
  GameVenuePin,
  SchoolPin,
} from '@/lib/api/explore/public';
import { config } from '@/lib/config';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';

// Soft-import @rnmapbox/maps. The native module may not be linked in Expo
// Go; we want the Explore tab to render a graceful fallback rather than
// red-box the whole screen.
type MapboxModule = typeof import('@rnmapbox/maps');
let MapboxRef: MapboxModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MapboxRef = require('@rnmapbox/maps') as MapboxModule;
} catch (err) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn('[explore-map] @rnmapbox/maps not available:', err);
  }
}

// Initialize the Mapbox SDK with the access token once at module load.
// Without this, the native module is linked + token present but tiles never
// load (blank map).
if (MapboxRef && config.mapbox.accessToken) {
  try {
    MapboxRef.setAccessToken(config.mapbox.accessToken);
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[explore-map] setAccessToken failed:', err);
    }
  }
}

// ── Tokens — converged to canonical FAN_ACCENT 2026-05-12 ──
// Aliases kept for diff minimization; resolve to muted-rose from
// constants/brand. No off-palette purple anywhere in the map surface.
const PURPLE = FAN_ACCENT;
const PURPLE_SOFT = FAN_ACCENT_SOFT;
const PURPLE_BORDER = FAN_ACCENT_BORDER;
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';
const TEXT_DIM = 'rgba(255,255,255,0.65)';
const TEXT_FAINT = 'rgba(255,255,255,0.45)';
const STATUS_LIVE = '#FF4444';
const STATUS_FINAL = '#F5B400';
const STATUS_SCHEDULED = '#7CC4FF';

// Continental US default. Matches DEFAULT_BBOX in explore.tsx.
const DEFAULT_CENTER: [number, number] = [-95, 38];
const DEFAULT_ZOOM = 3.5;
const CAMERA_IDLE_DEBOUNCE_MS = 500;
const MAX_VISIBLE_PINS = 200;

export interface ExploreMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onSelectSchool?: (school: SchoolPin) => void;
  onSelectVenue?: (venue: GameVenuePin) => void;
  style?: StyleProp<ViewStyle>;
}

type SelectedPin =
  | { kind: 'school'; pin: SchoolPin }
  | { kind: 'venue'; pin: GameVenuePin }
  | null;

export function ExploreMap({
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onSelectSchool,
  onSelectVenue,
  style,
}: ExploreMapProps): React.ReactElement {
  const token = config.mapbox.accessToken;
  const mapAvailable = Boolean(MapboxRef && token);

  if (!mapAvailable) {
    return (
      <FallbackCard
        style={style}
        message={
          !token
            ? 'Map is temporarily unavailable.'
            : 'Map is temporarily unavailable.'
        }
      />
    );
  }

  return (
    <LiveExploreMap
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      onSelectSchool={onSelectSchool}
      onSelectVenue={onSelectVenue}
      style={style}
    />
  );
}

// ── Live map (rendered only when @rnmapbox/maps + token are available) ──

function LiveExploreMap({
  initialCenter,
  initialZoom,
  onSelectSchool,
  onSelectVenue,
  style,
}: Required<
  Pick<ExploreMapProps, 'initialCenter' | 'initialZoom'>
> &
  Pick<ExploreMapProps, 'onSelectSchool' | 'onSelectVenue' | 'style'>): React.ReactElement {
  // Guarded above; non-null here.
  const Mapbox = MapboxRef as MapboxModule;
  const { MapView, Camera, MarkerView } = Mapbox;

  const mapRef = React.useRef<InstanceType<typeof MapView> | null>(null);
  const [bbox, setBbox] = React.useState<
    [number, number, number, number] | null
  >(null);
  const [selected, setSelected] = React.useState<SelectedPin>(null);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { pins, loading } = useExploreMapPins(bbox);

  // Camera-idle → debounced visible-bounds fetch.
  const onCameraIdle = React.useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(async () => {
      try {
        const visible = await mapRef.current?.getVisibleBounds();
        if (!visible) return;
        // getVisibleBounds returns [NE, SW] as [lon, lat] pairs.
        const [ne, sw] = visible;
        if (!ne || !sw) return;
        const swLat = sw[1] as number;
        const swLon = sw[0] as number;
        const neLat = ne[1] as number;
        const neLon = ne[0] as number;
        // Backend bbox contract: lat1,lon1,lat2,lon2 (SW first, NE second).
        setBbox([swLat, swLon, neLat, neLon]);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[explore-map] getVisibleBounds failed:', err);
        }
      }
    }, CAMERA_IDLE_DEBOUNCE_MS);
  }, []);

  React.useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Decimate pins for perf — pick the most "interesting" subset.
  const { schoolPins, venuePins, hiddenCount } = React.useMemo(() => {
    const allSchools = Array.isArray(pins.schools) ? pins.schools : [];
    const allVenues = Array.isArray(pins.gameVenues) ? pins.gameVenues : [];
    const totalPins = allSchools.length + allVenues.length;
    if (totalPins <= MAX_VISIBLE_PINS) {
      return {
        schoolPins: allSchools,
        venuePins: allVenues,
        hiddenCount: 0,
      };
    }
    // Venues (have live games) take priority, then schools with gameIds.
    const venuesKept = allVenues.slice(0, MAX_VISIBLE_PINS);
    const remaining = Math.max(0, MAX_VISIBLE_PINS - venuesKept.length);
    const schoolsByPriority = [...allSchools].sort((a, b) => {
      const aGames = a.gameIds?.length ?? 0;
      const bGames = b.gameIds?.length ?? 0;
      if (aGames !== bGames) return bGames - aGames;
      return a.name.localeCompare(b.name);
    });
    const schoolsKept = schoolsByPriority.slice(0, remaining);
    return {
      schoolPins: schoolsKept,
      venuePins: venuesKept,
      hiddenCount: totalPins - venuesKept.length - schoolsKept.length,
    };
  }, [pins.schools, pins.gameVenues]);

  const styleURL = Mapbox.StyleURL?.Dark ?? 'mapbox://styles/mapbox/dark-v11';
  const totalPinsRendered = schoolPins.length + venuePins.length;
  const hasNoPins =
    !loading && bbox !== null && totalPinsRendered === 0;

  return (
    <View style={[styles.mapWrap, style]}>
      <MapView
        ref={mapRef as React.RefObject<InstanceType<typeof MapView>>}
        style={styles.mapView}
        styleURL={styleURL}
        logoEnabled={true}
        attributionEnabled={true}
        compassEnabled={false}
        scaleBarEnabled={false}
        onMapIdle={onCameraIdle}
        onDidFinishLoadingMap={onCameraIdle}
      >
        <Camera
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: initialZoom,
          }}
          minZoomLevel={2}
          maxZoomLevel={16}
        />

        {schoolPins.map((school) => (
          <MarkerView
            key={`school-${school.id}`}
            coordinate={[school.longitude, school.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap={true}
          >
            <Pressable
              onPress={() => {
                setSelected({ kind: 'school', pin: school });
                onSelectSchool?.(school);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`School pin: ${school.name}`}
            >
              <View style={styles.schoolMarker}>
                <Ionicons name="school" size={12} color={PURPLE} />
              </View>
            </Pressable>
          </MarkerView>
        ))}

        {venuePins.map((venue) => {
          const tone = venueTone(venue.status);
          return (
            <MarkerView
              key={`venue-${venue.gameId}`}
              coordinate={[venue.longitude, venue.latitude]}
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap={true}
              allowOverlapWithPuck={true}
            >
              <Pressable
                onPress={() => {
                  setSelected({ kind: 'venue', pin: venue });
                  onSelectVenue?.(venue);
                }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Game venue: ${venue.venueName}`}
              >
                <View
                  style={[
                    styles.venueMarker,
                    { borderColor: tone.border, backgroundColor: tone.bg },
                  ]}
                >
                  {venue.status === 'live' && (
                    <View style={styles.venueLiveDot} />
                  )}
                  <Text
                    style={[styles.venueMarkerText, { color: tone.label }]}
                    numberOfLines={1}
                  >
                    {venue.status === 'live'
                      ? 'LIVE'
                      : venue.status === 'final'
                        ? 'FINAL'
                        : 'GAME'}
                  </Text>
                </View>
              </Pressable>
            </MarkerView>
          );
        })}
      </MapView>

      {/* Loading overlay (only when pins are mid-fetch and we have none yet) */}
      {loading && totalPinsRendered === 0 && (
        <View style={styles.overlayTopRight}>
          <ActivityIndicator color={PURPLE} size="small" />
        </View>
      )}

      {/* Empty-state overlay */}
      {hasNoPins && (
        <View style={styles.overlayBottom}>
          <Text style={styles.overlayBottomText}>
            No pins in this region — try zooming out.
          </Text>
        </View>
      )}

      {/* Decimation notice (rare) */}
      {hiddenCount > 0 && (
        <View style={styles.overlayTopLeft}>
          <Text style={styles.overlayDecimateText}>
            +{hiddenCount} more · zoom in
          </Text>
        </View>
      )}

      {/* Selected callout */}
      {selected && (
        <View style={styles.calloutWrap} pointerEvents="box-none">
          <SelectedCallout
            selection={selected}
            onDismiss={() => setSelected(null)}
          />
        </View>
      )}
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────

function venueTone(status: CachedGameStatus): {
  border: string;
  bg: string;
  label: string;
} {
  switch (status) {
    case 'live':
      return {
        border: 'rgba(255,68,68,0.65)',
        bg: 'rgba(255,68,68,0.18)',
        label: STATUS_LIVE,
      };
    case 'final':
      return {
        border: 'rgba(245,180,0,0.65)',
        bg: 'rgba(245,180,0,0.16)',
        label: STATUS_FINAL,
      };
    case 'scheduled':
      return {
        border: 'rgba(124,196,255,0.55)',
        bg: 'rgba(124,196,255,0.14)',
        label: STATUS_SCHEDULED,
      };
    default:
      return {
        border: CARD_BORDER,
        bg: CARD_BG,
        label: '#FFF',
      };
  }
}

function SelectedCallout({
  selection,
  onDismiss,
}: {
  selection: NonNullable<SelectedPin>;
  onDismiss: () => void;
}): React.ReactElement {
  if (selection.kind === 'school') {
    const s = selection.pin;
    const tonight = s.gameIds?.length ?? 0;
    return (
      <View style={styles.callout}>
        <View style={{ flex: 1 }}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={styles.calloutMeta} numberOfLines={1}>
            {s.state ?? '—'}
            {tonight > 0
              ? ` · ${tonight} game${tonight === 1 ? '' : 's'} tonight`
              : ''}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
        </Pressable>
      </View>
    );
  }
  const v = selection.pin;
  const tone = venueTone(v.status);
  return (
    <View style={styles.callout}>
      <View style={{ flex: 1 }}>
        <Text style={styles.calloutTitle} numberOfLines={1}>
          {v.venueName}
        </Text>
        <Text style={styles.calloutMeta} numberOfLines={1}>
          {[v.awaySchoolName, v.homeSchoolName].filter(Boolean).join(' @ ') ||
            'TBD'}
        </Text>
      </View>
      <View
        style={[
          styles.calloutBadge,
          { borderColor: tone.border, backgroundColor: tone.bg },
        ]}
      >
        <Text style={[styles.calloutBadgeText, { color: tone.label }]}>
          {v.status === 'live'
            ? 'LIVE'
            : v.status === 'final'
              ? 'FINAL'
              : v.status === 'scheduled'
                ? 'SOON'
                : '—'}
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        style={{ marginLeft: 6 }}
      >
        <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
      </Pressable>
    </View>
  );
}

function FallbackCard({
  message,
  style,
}: {
  message: string;
  style?: StyleProp<ViewStyle>;
}): React.ReactElement {
  return (
    <View style={[styles.fallback, style]}>
      <View style={styles.fallbackIconWrap}>
        <Ionicons name="map-outline" size={20} color={PURPLE} />
      </View>
      <Text style={styles.fallbackTitle}>Map unavailable</Text>
      <Text style={styles.fallbackBody}>{message}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: '#000',
    position: 'relative',
  },
  mapView: {
    flex: 1,
  },
  schoolMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PURPLE_SOFT,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  venueMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  venueLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: STATUS_LIVE,
  },
  overlayTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 6,
  },
  overlayTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  overlayDecimateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overlayBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  overlayBottomText: {
    color: TEXT_DIM,
    fontSize: 12,
    textAlign: 'center',
  },
  calloutWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,15,15,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  calloutTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calloutMeta: {
    color: TEXT_DIM,
    fontSize: 11,
    marginTop: 2,
  },
  calloutBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  calloutBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  fallback: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    backgroundColor: PURPLE_SOFT,
    padding: 18,
    alignItems: 'flex-start',
    gap: 6,
  },
  fallbackIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(199,154,165,0.18)',
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fallbackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fallbackBody: {
    color: TEXT_DIM,
    fontSize: 12,
    lineHeight: 17,
  },
  // Re-exported in case a parent wants to mute text consistently.
  _faint: { color: TEXT_FAINT },
});
