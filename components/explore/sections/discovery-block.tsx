// Discovery block — public-data discovery surface for the Triad.
//
// Renders the public `/api/fan/*` endpoints (kept on the fan path until
// the Phase 5 backend rename to `/api/explore/*`):
//   • Tonight's games rail (`explorePublicApi.getGames`) with source-tier badge
//   • Real Mapbox map (via <ExploreMap />) — pans/zooms drive the bbox fed
//     to /api/fan/map/pins; tap a pin → sticky "Selected" card
//   • Schools directory with cursor pagination
//   • Debounced search overlay that replaces the body when active
//
// Universal: rendered in the Triad for every authenticated user, plus the
// legacy `(fan-tabs)/explore.tsx` route which now just wraps this block.
// Extracted from app/(fan-tabs)/explore.tsx during
// fan-content-to-triad-2026-05-12 (Phase 2c).
//
// All endpoints are unauthenticated; backend rate-limits 60/min/IP.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreMap } from '@/components/explore/explore-map';
import { getSchoolLogo } from '@/lib/data/school-logos';
import {
  useExploreGames,
  useExploreMapPins,
  useExploreSchools,
  useExploreSearch,
} from '@/hooks/explore/use-explore-public';
import type {
  CachedGame,
  CachedGameStatus,
  GameVenuePin,
  SchoolGeo,
  SchoolPin,
  Venue,
} from '@/lib/api/explore/public';
import { FAN_ACCENT, FAN_ACCENT_SOFT, FAN_ACCENT_BORDER } from '@/constants/brand';

// ── Tokens ─────────────────────────────────────────────────
// Fan-hub accent. Local aliases retained for minimal diff vs the original
// (fan-tabs)/explore.tsx body; they now resolve to the canonical
// FAN_ACCENT export from constants/brand.
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
const DEMO_AMBER = '#F5B400';

// Continental US bounding box for Phase 1 default pin set.
const DEFAULT_BBOX: [number, number, number, number] = [24.5, -125, 49.5, -66];

interface SportFilter {
  key: string;
  label: string;
}

const SPORT_FILTERS: SportFilter[] = [
  { key: 'basketball-men', label: "Men's Basketball" },
  { key: 'basketball-women', label: "Women's Basketball" },
  { key: 'football-fbs', label: 'Football (FBS)' },
  { key: 'baseball', label: 'Baseball' },
  { key: 'lacrosse-men', label: "Men's Lacrosse" },
];

type MapSelection =
  | { kind: 'school'; pin: SchoolPin }
  | { kind: 'venue'; pin: GameVenuePin }
  | null;

interface DiscoveryBlockProps {
  /** Top padding to apply. When undefined, uses the safe-area top inset
   * (suitable for the standalone fan-tabs route). When provided (0
   * included), used verbatim — pass 0 when embedding inside ExploreView
   * which owns its own top chrome. */
  topInset?: number;
}

export function DiscoveryBlock({ topInset }: DiscoveryBlockProps = {}) {
  const safeArea = useSafeAreaInsets();
  const effectiveTopInset = topInset ?? safeArea.top + 12;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSport, setSelectedSport] = React.useState<string>(
    SPORT_FILTERS[0]!.key,
  );
  const [stateFilter, _setStateFilter] = React.useState<string | undefined>(
    undefined,
  );
  const [mapSelection, setMapSelection] = React.useState<MapSelection>(null);

  const {
    games,
    loading: gamesLoading,
    error: gamesError,
    sourceTier,
    refresh: refreshGames,
  } = useExploreGames({ sport: selectedSport });

  const { pins, loading: pinsLoading } = useExploreMapPins(DEFAULT_BBOX);

  const {
    schools,
    loading: schoolsLoading,
    nextCursor,
    loadMore,
  } = useExploreSchools({ state: stateFilter, limit: 25 });

  const { results: searchResults, loading: searchLoading } = useExploreSearch(
    searchQuery,
    ['schools', 'venues'],
  );

  const isSearching = searchQuery.trim().length > 0;
  const isDemoData = sourceTier === 'mock-data';
  const isBackendDown = Boolean(gamesError);

  return (
    <View style={[styles.container, { paddingTop: effectiveTopInset }]}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={TEXT_DIM} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools, venues, athletes…"
          placeholderTextColor={TEXT_FAINT}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            hitSlop={10}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
          </Pressable>
        )}
      </View>

      {!isSearching && (
        <View style={styles.chipScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {SPORT_FILTERS.map((sport) => {
              const active = sport.key === selectedSport;
              return (
                <Pressable
                  key={sport.key}
                  onPress={() => setSelectedSport(sport.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}
                  >
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={gamesLoading && games.length > 0}
            onRefresh={refreshGames}
            tintColor={PURPLE}
          />
        }
      >
        {isBackendDown && !isSearching && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="cloud-offline"
              size={16}
              color={STATUS_LIVE}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.errorBannerText}>
              Live data unavailable. Showing nothing.
            </Text>
          </View>
        )}

        {isSearching ? (
          <SearchErrorBoundary>
            <SearchResultsPanel
              loading={searchLoading}
              schools={searchResults?.data?.schools ?? []}
              venues={searchResults?.data?.venues ?? []}
              query={searchQuery}
            />
          </SearchErrorBoundary>
        ) : (
          <>
            <Section
              title="Tonight's games"
              right={
                isDemoData ? (
                  <View style={styles.demoChip}>
                    <Ionicons name="flask" size={11} color={DEMO_AMBER} />
                    <Text style={styles.demoChipText}>Demo data</Text>
                  </View>
                ) : sourceTier === 'live-data' ? (
                  <View style={styles.liveChip}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveChipText}>Live data</Text>
                  </View>
                ) : null
              }
            />

            {gamesLoading && games.length === 0 ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={PURPLE} />
              </View>
            ) : games.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={TEXT_DIM}
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.emptyTitle}>No games today</Text>
                <Text style={styles.emptyBody}>
                  Check back tomorrow — or try a different sport.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gameRail}
              >
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPress={() => {
                      // Phase 2: navigate to game detail.
                      // eslint-disable-next-line no-console
                      console.log('[explore] tap game', game.id);
                    }}
                  />
                ))}
              </ScrollView>
            )}

            <Section title="Map" />
            <ExploreMap
              style={styles.mapView}
              onSelectSchool={(school) =>
                setMapSelection({ kind: 'school', pin: school })
              }
              onSelectVenue={(venue) =>
                setMapSelection({ kind: 'venue', pin: venue })
              }
            />
            {mapSelection && (
              <SelectedMapCard
                selection={mapSelection}
                onDismiss={() => setMapSelection(null)}
              />
            )}
            {/* Background pin hint — the live ExploreMap drives its own
                fetch; this keeps the universal-bbox hook live for the
                schools-directory empty-state probe and a future
                "Pins loaded" indicator without re-rendering the map. */}
            {pinsLoading && pins.schools.length === 0 && (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={PURPLE} />
              </View>
            )}

            <Section
              title="Schools directory"
              subtitle={
                stateFilter ? `Filtered: ${stateFilter}` : 'All states'
              }
            />
            {schoolsLoading && schools.length === 0 ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={PURPLE} />
              </View>
            ) : schools.length === 0 ? (
              <Text style={styles.mutedText}>No schools found.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {schools.map((school) => (
                  <SchoolRow key={school.id} school={school} />
                ))}
                {nextCursor && (
                  <Pressable
                    style={styles.loadMoreBtn}
                    onPress={loadMore}
                    accessibilityRole="button"
                  >
                    <Text style={styles.loadMoreText}>
                      {schoolsLoading ? 'Loading…' : 'Load more'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────

function Section({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function statusMeta(status: CachedGameStatus): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'live':
      return { label: 'LIVE', color: STATUS_LIVE };
    case 'final':
      return { label: 'FINAL', color: STATUS_FINAL };
    case 'scheduled':
      return { label: 'SCHEDULED', color: STATUS_SCHEDULED };
    case 'postponed':
      return { label: 'POSTPONED', color: TEXT_DIM };
    case 'cancelled':
      return { label: 'CANCELLED', color: TEXT_DIM };
    default:
      return { label: 'TBD', color: TEXT_DIM };
  }
}

function GameCard({
  game,
  onPress,
}: {
  game: CachedGame;
  onPress: () => void;
}) {
  const status = statusMeta(game.status);
  const showScore =
    game.status === 'live' ||
    game.status === 'final' ||
    (game.homeScore !== null && game.awayScore !== null);
  const isLiveTier = game.sourceTier === 'live-data';

  return (
    <Pressable
      style={styles.gameCard}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.gameCardTopRow}>
        <View
          style={[styles.statusChip, { borderColor: `${status.color}80` }]}
        >
          {game.status === 'live' && <View style={styles.liveDot} />}
          <Text style={[styles.statusChipText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        <View
          style={[
            styles.tierBadge,
            isLiveTier
              ? { borderColor: 'rgba(124,196,255,0.50)' }
              : { borderColor: 'rgba(245,180,0,0.55)' },
          ]}
        >
          <Text
            style={[
              styles.tierBadgeText,
              { color: isLiveTier ? STATUS_SCHEDULED : DEMO_AMBER },
            ]}
          >
            {isLiveTier ? 'live data' : 'demo'}
          </Text>
        </View>
      </View>

      <View style={styles.teamRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {game.awaySchoolName ?? 'Away'}
        </Text>
        {showScore && (
          <Text style={styles.teamScore}>{game.awayScore ?? '—'}</Text>
        )}
      </View>
      <View style={styles.teamRow}>
        <Text style={styles.teamName} numberOfLines={1}>
          {game.homeSchoolName ?? 'Home'}
        </Text>
        {showScore && (
          <Text style={styles.teamScore}>{game.homeScore ?? '—'}</Text>
        )}
      </View>

      <View style={styles.gameMetaRow}>
        <Ionicons name="location-outline" size={11} color={TEXT_FAINT} />
        <Text style={styles.gameMetaText} numberOfLines={1}>
          {game.venueName ?? 'Venue TBD'}
        </Text>
      </View>
      {game.status === 'live' && game.period && (
        <Text style={styles.gameClock}>
          {game.period}
          {game.clock ? ` · ${game.clock}` : ''}
        </Text>
      )}
    </Pressable>
  );
}

/** Sticky "Selected" slot rendered below the map when a user taps a pin.
 * Shows name + state + tonight's game count for schools, or venue + matchup
 * + status for game-venue pins. "View details" is a stub for Phase 4 deep
 * links into the school/game detail screens. */
function SelectedMapCard({
  selection,
  onDismiss,
}: {
  selection: NonNullable<MapSelection>;
  onDismiss: () => void;
}) {
  if (selection.kind === 'school') {
    const s = selection.pin;
    const tonight = s.gameIds?.length ?? 0;
    return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedIconWrap}>
          <Ionicons name="school" size={16} color={PURPLE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedTitle} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={styles.selectedMeta} numberOfLines={1}>
            {s.state ?? '—'}
            {tonight > 0
              ? ` · ${tonight} game${tonight === 1 ? '' : 's'} tonight`
              : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            // Phase 4: navigate to school detail.
            // eslint-disable-next-line no-console
            console.log('[explore] view school', s.id);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.selectedLink}>View details</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          accessibilityLabel="Dismiss selected pin"
        >
          <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
        </Pressable>
      </View>
    );
  }
  const v = selection.pin;
  const statusLabel =
    v.status === 'live'
      ? 'LIVE'
      : v.status === 'final'
        ? 'FINAL'
        : v.status === 'scheduled'
          ? 'SOON'
          : '—';
  return (
    <View style={styles.selectedCard}>
      <View style={styles.selectedIconWrap}>
        <Ionicons name="business" size={16} color={PURPLE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.selectedTitle} numberOfLines={1}>
          {v.venueName}
        </Text>
        <Text style={styles.selectedMeta} numberOfLines={1}>
          {[v.awaySchoolName, v.homeSchoolName].filter(Boolean).join(' @ ') ||
            'Matchup TBD'}
          {` · ${statusLabel}`}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          // Phase 4: navigate to game detail.
          // eslint-disable-next-line no-console
          console.log('[explore] view game', v.gameId);
        }}
        accessibilityRole="button"
      >
        <Text style={styles.selectedLink}>View details</Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityLabel="Dismiss selected pin"
      >
        <Ionicons name="close-circle" size={18} color={TEXT_DIM} />
      </Pressable>
    </View>
  );
}

function SchoolRow({ school }: { school: SchoolGeo }) {
  const logo = getSchoolLogo(school.name);
  return (
    <View style={styles.schoolRow}>
      {logo ? (
        <View style={styles.schoolLogoWrap}>
          <Image
            source={logo}
            style={styles.schoolLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : (
        <View style={styles.schoolIconWrap}>
          <Ionicons name="school-outline" size={16} color={PURPLE} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.schoolName} numberOfLines={1}>
          {school.name}
        </Text>
        <Text style={styles.schoolMeta} numberOfLines={1}>
          {[school.state, school.conference].filter(Boolean).join(' · ') ||
            'Unaffiliated'}
        </Text>
      </View>
    </View>
  );
}

// Local boundary around the search results panel. The fan Explore tab
// has been observed to blank-screen when something inside the render
// tree throws (QA repro: typing into the search input). We catch the
// error here so the rest of the Explore tab keeps rendering and the
// user sees a recoverable empty state instead of a blank scroll view.
class SearchErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }
  componentDidCatch(error: Error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[fan-explore] search panel error:', error);
    }
  }
  render() {
    if (this.state.error) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Search hiccup</Text>
          <Text style={styles.emptyBody}>
            Try a different search term.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function SearchResultsPanel({
  loading,
  schools,
  venues,
  query,
}: {
  loading: boolean;
  schools: SchoolGeo[];
  venues: Venue[];
  query: string;
}) {
  const safeSchools = Array.isArray(schools) ? schools : [];
  const safeVenues = Array.isArray(venues) ? venues : [];
  const totalCount = safeSchools.length + safeVenues.length;
  return (
    <View>
      <Section
        title={`Search: "${query.trim()}"`}
        subtitle={loading ? 'Searching…' : `${totalCount} result(s)`}
      />
      {loading && totalCount === 0 ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={PURPLE} />
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyBody}>
            Try a different school, venue, or sport name.
          </Text>
        </View>
      ) : (
        <>
          {safeSchools.length > 0 && (
            <>
              <Text style={styles.groupHeader}>SCHOOLS</Text>
              <View style={{ gap: 8 }}>
                {safeSchools.map((school) => (
                  <SchoolRow key={school.id} school={school} />
                ))}
              </View>
            </>
          )}
          {safeVenues.length > 0 && (
            <>
              <Text style={[styles.groupHeader, { marginTop: 18 }]}>
                VENUES
              </Text>
              <View style={{ gap: 8 }}>
                {safeVenues.map((venue) => (
                  <View key={venue.id} style={styles.schoolRow}>
                    <View style={styles.schoolIconWrap}>
                      <Ionicons
                        name="business-outline"
                        size={16}
                        color={PURPLE}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.schoolName} numberOfLines={1}>
                        {venue.name}
                      </Text>
                      <Text style={styles.schoolMeta} numberOfLines={1}>
                        {[venue.city, venue.state].filter(Boolean).join(', ') ||
                          'Location unknown'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    padding: 0,
  },
  chipScrollWrap: {
    // P3 (Argent QA iter1) — cap the horizontal chip row so it can't flex
    // vertically inside the column-flex parent. Without this, the
    // horizontal ScrollView stretches to fill the cross-axis and
    // `alignItems: stretch` (the default) makes each chip a tall pill.
    height: 44,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 6,
    paddingRight: 16,
    alignItems: 'center',
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: PURPLE_BORDER,
    backgroundColor: PURPLE_SOFT,
  },
  chipText: {
    color: TEXT_DIM,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#FFF',
  },
  body: {
    flex: 1,
    marginTop: 4,
  },
  bodyContent: {
    paddingBottom: 140,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: TEXT_FAINT,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  groupHeader: {
    color: TEXT_FAINT,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 10,
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
    backgroundColor: 'rgba(255,68,68,0.08)',
    marginTop: 12,
  },
  errorBannerText: {
    color: '#FFC8C8',
    fontSize: 13,
    flex: 1,
  },
  loadingBlock: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 18,
    alignItems: 'flex-start',
    gap: 4,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBody: {
    color: TEXT_DIM,
    fontSize: 13,
    lineHeight: 18,
  },
  mutedText: {
    color: TEXT_DIM,
    fontSize: 13,
    paddingVertical: 8,
  },
  // ── Game rail ──
  gameRail: {
    gap: 10,
    paddingRight: 16,
    paddingBottom: 4,
  },
  gameCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 12,
    gap: 4,
  },
  gameCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: STATUS_LIVE,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  teamScore: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  gameMetaText: {
    color: TEXT_FAINT,
    fontSize: 11,
    flex: 1,
  },
  gameClock: {
    color: STATUS_LIVE,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124,196,255,0.45)',
    backgroundColor: 'rgba(124,196,255,0.10)',
  },
  liveChipText: {
    color: STATUS_SCHEDULED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,180,0,0.45)',
    backgroundColor: 'rgba(245,180,0,0.10)',
  },
  demoChipText: {
    color: DEMO_AMBER,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  // ── Map (Phase 3) ──
  mapView: {
    height: 320,
    borderRadius: 16,
    marginBottom: 10,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    backgroundColor: PURPLE_SOFT,
    marginBottom: 4,
  },
  selectedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(199,154,165,0.18)',
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedMeta: {
    color: TEXT_DIM,
    fontSize: 11,
    marginTop: 2,
  },
  selectedLink: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginRight: 8,
  },
  // ── School row ──
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  schoolLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  schoolLogo: {
    width: 24,
    height: 24,
  },
  schoolIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PURPLE_SOFT,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  schoolMeta: {
    color: TEXT_DIM,
    fontSize: 11,
    marginTop: 2,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    backgroundColor: PURPLE_SOFT,
    marginTop: 6,
  },
  loadMoreText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
