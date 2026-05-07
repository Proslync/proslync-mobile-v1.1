import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useUnifiedSearch } from '@/hooks/use-unified-search';
import { useFollowUser } from '@/hooks/use-follow-user';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import type {
  UnifiedSearchItem,
  SearchSuggestion,
} from '@/lib/types/search.types';
import { format } from 'date-fns';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// ── Brand catalog (mock — wire to API later) ──

type BrandItem = {
  id: string;
  name: string;
  handle: string;
  category: string;
  initials: string;
  color: string;
  followers: string; // pre-formatted, e.g. "412k"
};

const BRAND_CATALOG: BrandItem[] = [
  { id: 'br-nike',     name: 'Nike',          handle: '@nike',         category: 'Athleticwear',     initials: 'N',  color: '#000000', followers: '12.4M' },
  { id: 'br-gatorade', name: 'Gatorade',      handle: '@gatorade',     category: 'Hydration',        initials: 'G',  color: '#FF6900', followers: '4.1M'  },
  { id: 'br-adidas',   name: 'Adidas',        handle: '@adidas',       category: 'Athleticwear',     initials: 'A',  color: '#000000', followers: '11.2M' },
  { id: 'br-puma',     name: 'PUMA Hoops',    handle: '@pumahoops',    category: 'Basketball',       initials: 'P',  color: '#000000', followers: '2.4M'  },
  { id: 'br-spotify',  name: 'Spotify',       handle: '@spotify',      category: 'Music · Creator',  initials: 'S',  color: '#1DB954', followers: '8.6M'  },
  { id: 'br-bww',      name: 'Buffalo Wild Wings', handle: '@bwwings', category: 'Food',             initials: 'B',  color: '#FFCA02', followers: '1.1M'  },
  { id: 'br-bojangles',name: "Bojangles'",    handle: '@bojangles',    category: 'Food · Regional',  initials: 'B',  color: '#E03A3E', followers: '432k'  },
  { id: 'br-att',      name: 'AT&T',          handle: '@att',          category: 'Tech · Telecom',   initials: 'A',  color: '#00A8E0', followers: '3.7M'  },
  { id: 'br-ufa',      name: 'Under Armour',  handle: '@underarmour',  category: 'Athleticwear',     initials: 'UA', color: '#000000', followers: '5.9M'  },
];

// ── Athlete catalog (NIL athletes) ──

type AthleteItem = {
  id: string;
  name: string;
  handle: string;
  sport: string;
  school: string;
  classYear: string;
  initials: string;
  color: string;
  followers: string;
  rank?: string;
};

const ATHLETE_CATALOG: AthleteItem[] = [
  { id: 'at-flagg',     name: 'Cooper Flagg',     handle: '@cooperflagg',     sport: 'Basketball', school: 'Duke',     classYear: 'Fr', initials: 'CF', color: '#001A57', followers: '1.4M', rank: '#1 Wooden' },
  { id: 'at-kiyan',     name: 'Kiyan Anthony',    handle: '@kiyananthony',    sport: 'Basketball', school: 'Syracuse', classYear: 'Fr', initials: 'KA', color: '#F76900', followers: '412K', rank: '#2 POY' },
  { id: 'at-dybantsa',  name: 'AJ Dybantsa',      handle: '@ajdybantsa',      sport: 'Basketball', school: 'BYU',      classYear: 'Fr', initials: 'AD', color: '#002E5D', followers: '296K', rank: '#1 ROY' },
  { id: 'at-davis',     name: 'RJ Davis',         handle: '@rjdavis',         sport: 'Basketball', school: 'UNC',      classYear: 'Sr', initials: 'RJ', color: '#7BAFD4', followers: '388K' },
  { id: 'at-knueppel',  name: 'Kon Knueppel',     handle: '@konknueppel',     sport: 'Basketball', school: 'Duke',     classYear: 'Fr', initials: 'KK', color: '#001A57', followers: '184K' },
  { id: 'at-lampkin',   name: 'Eddie Lampkin Jr.',handle: '@eddielampkin',    sport: 'Basketball', school: 'Syracuse', classYear: 'Sr', initials: 'EL', color: '#F76900', followers: '124K', rank: 'DPOY #1' },
  { id: 'at-freeman',   name: 'Donnie Freeman',   handle: '@donniefreeman',   sport: 'Basketball', school: 'Syracuse', classYear: 'Fr', initials: 'DF', color: '#F76900', followers: '94K' },
  { id: 'at-starling',  name: 'JJ Starling',      handle: '@jjstarling',      sport: 'Basketball', school: 'Syracuse', classYear: 'Jr', initials: 'JS', color: '#F76900', followers: '244K' },
  { id: 'at-owusu',     name: 'Daniel Owusu',     handle: '@danowusu',        sport: 'Football',   school: 'Duke',     classYear: 'Jr', initials: 'DO', color: '#001A57', followers: '152K' },
  { id: 'at-reyes',     name: 'Sienna Reyes',     handle: '@siennareyes',     sport: 'Soccer',     school: 'Duke',     classYear: 'So', initials: 'SR', color: '#000080', followers: '108K' },
];

// ── School catalog ──

type SchoolItem = {
  id: string;
  name: string;
  handle: string;
  conference: string;
  initials: string;
  color: string;
  athletes: string;  // e.g. "327 athletes"
};

const SCHOOL_CATALOG: SchoolItem[] = [
  { id: 'sc-duke',     name: 'Duke University',         handle: '@dukembb',     conference: 'ACC',       initials: 'D',  color: '#001A57', athletes: '418 athletes' },
  { id: 'sc-syracuse', name: 'Syracuse University',     handle: '@cuse_mbb',    conference: 'ACC',       initials: 'S',  color: '#F76900', athletes: '372 athletes' },
  { id: 'sc-unc',      name: 'University of North Carolina', handle: '@uncbasketball', conference: 'ACC', initials: 'NC', color: '#7BAFD4', athletes: '402 athletes' },
  { id: 'sc-uk',       name: 'University of Kentucky',  handle: '@kentuckymbb', conference: 'SEC',       initials: 'UK', color: '#0033A0', athletes: '388 athletes' },
  { id: 'sc-uconn',    name: 'UConn',                   handle: '@uconnmbb',    conference: 'Big East',  initials: 'UC', color: '#000E2F', athletes: '294 athletes' },
  { id: 'sc-ucla',     name: 'UCLA',                    handle: '@uclambb',     conference: 'Big Ten',   initials: 'LA', color: '#2D68C4', athletes: '364 athletes' },
  { id: 'sc-byu',      name: 'BYU',                     handle: '@byubasketball', conference: 'Big 12',  initials: 'BY', color: '#002E5D', athletes: '256 athletes' },
  { id: 'sc-michigan', name: 'University of Michigan',  handle: '@umichbball',  conference: 'Big Ten',   initials: 'M',  color: '#00274C', athletes: '442 athletes' },
];

function AthleteRow({
  athlete,
  isFollowing,
  onToggleFollow,
  onPress,
  colors,
}: {
  athlete: AthleteItem;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.brandAvatar, { backgroundColor: athlete.color, borderRadius: 24 }]}>
        <Text style={styles.brandAvatarText}>{athlete.initials}</Text>
      </View>
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {athlete.name}
          </Text>
          <MaterialCommunityIcons name="check-decagram" size={15} color="#1DA1F2" style={{ marginLeft: 4 }} />
        </View>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {athlete.handle} · {athlete.sport} · {athlete.school} · {athlete.classYear}
        </Text>
        <Text style={[styles.mutualText, { color: colors.textTertiary }]} numberOfLines={1}>
          {athlete.followers} followers{athlete.rank ? ` · ${athlete.rank}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.brandFollowBtn,
          isFollowing
            ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }
            : { backgroundColor: '#FF6F3C', borderColor: '#FF6F3C' },
        ]}
        onPress={onToggleFollow}
        activeOpacity={0.7}
      >
        <Text style={[styles.brandFollowText, isFollowing ? { color: 'rgba(255,255,255,0.85)' } : { color: '#FFF' }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SchoolRow({
  school,
  isFollowing,
  onToggleFollow,
  onPress,
  colors,
}: {
  school: SchoolItem;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.brandAvatar, { backgroundColor: school.color }]}>
        <Text style={styles.brandAvatarText}>{school.initials}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {school.name}
        </Text>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {school.handle} · {school.conference}
        </Text>
        <Text style={[styles.mutualText, { color: colors.textTertiary }]} numberOfLines={1}>
          {school.athletes}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.brandFollowBtn,
          isFollowing
            ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }
            : { backgroundColor: '#FF6F3C', borderColor: '#FF6F3C' },
        ]}
        onPress={onToggleFollow}
        activeOpacity={0.7}
      >
        <Text style={[styles.brandFollowText, isFollowing ? { color: 'rgba(255,255,255,0.85)' } : { color: '#FFF' }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function BrandRow({
  brand,
  isFollowing,
  onToggleFollow,
  onPress,
  colors,
}: {
  brand: BrandItem;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.brandAvatar, { backgroundColor: brand.color }]}>
        <Text style={styles.brandAvatarText}>{brand.initials}</Text>
      </View>
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {brand.name}
          </Text>
          <MaterialCommunityIcons name="check-decagram" size={15} color="#1DA1F2" style={{ marginLeft: 4 }} />
        </View>
        <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {brand.handle} · {brand.category}
        </Text>
        <Text style={[styles.mutualText, { color: colors.textTertiary }]} numberOfLines={1}>
          {brand.followers} followers
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.brandFollowBtn,
          isFollowing
            ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' }
            : { backgroundColor: '#FF6F3C', borderColor: '#FF6F3C' },
        ]}
        onPress={onToggleFollow}
        activeOpacity={0.7}
      >
        <Text style={[styles.brandFollowText, isFollowing ? { color: 'rgba(255,255,255,0.85)' } : { color: '#FFF' }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Result row components ──

function PersonRow({
  item,
  onPress,
  colors,
}: {
  item: UnifiedSearchItem;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { user } = useAuth();
  const isSelf = user?.id === item.id;
  const { isFollowing, follow, unfollow, isFollowInProgress, isUnfollowInProgress } = useFollowUser(item.id);
  const name = `${item.firstName || ''} ${item.lastName || ''}`.trim();

  const handleFollowPress = async () => {
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
    } catch {}
  };

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.avatar?.url ? (
        <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
      ) : (
        <Image source={DefaultAvatarImage} style={styles.avatar} />
      )}
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {name || 'User'}
          </Text>
          {item.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={15} color={colors.verified} style={{ marginLeft: 4 }} />
          )}
        </View>
        {item.userName && (
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.userName}
          </Text>
        )}
        {(item.mutualCount ?? 0) > 0 && (
          <Text style={[styles.mutualText, { color: colors.textTertiary }]}>
            {item.mutualCount} mutual {item.mutualCount === 1 ? 'friend' : 'friends'}
          </Text>
        )}
      </View>
      {!isSelf && (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followButtonFollowing]}
          onPress={handleFollowPress}
          disabled={isFollowInProgress || isUnfollowInProgress}
          activeOpacity={0.7}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
            {isFollowInProgress || isUnfollowInProgress
              ? '...'
              : isFollowing
                ? 'Following'
                : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function EventRow({
  item,
  onPress,
  colors,
}: {
  item: UnifiedSearchItem;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const dateLabel = item.startDate
    ? format(new Date(item.startDate), 'MMM d, yyyy')
    : 'Date TBA';

  return (
    <TouchableOpacity style={styles.eventRow} onPress={onPress} activeOpacity={0.9}>
      {item.flyer?.url ? (
        <Image source={{ uri: item.flyer.url }} style={styles.eventThumb} />
      ) : (
        <View style={[styles.eventThumb, styles.placeholderThumb, { backgroundColor: colors.input }]}>
          <Ionicons name="calendar" size={24} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name || 'Event'}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{dateLabel}</Text>
        </View>
        {item.venueName && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.venueName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function VenueRow({
  item,
  onPress,
  colors,
}: {
  item: UnifiedSearchItem;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.logo?.url ? (
        <Image source={{ uri: item.logo.url }} style={styles.venueThumb} />
      ) : (
        <View style={[styles.venueThumb, styles.placeholderThumb, { backgroundColor: colors.input }]}>
          <Ionicons name="business" size={22} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name || 'Venue'}
        </Text>
        {item.address && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PostRow({
  item,
  onPress,
  colors,
}: {
  item: UnifiedSearchItem;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const firstMedia = Array.isArray(item.media) && item.media.length > 0
    ? (item.media[0] as { url?: string; type?: string })
    : null;

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {firstMedia?.url ? (
        <Image source={{ uri: firstMedia.url }} style={styles.venueThumb} />
      ) : (
        <View style={[styles.venueThumb, styles.placeholderThumb, { backgroundColor: colors.input }]}>
          <Ionicons name="document-text-outline" size={22} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
          {item.text || 'Post'}
        </Text>
        <View style={styles.metaRow}>
          {item.authorName && (
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.authorName}
            </Text>
          )}
          {(item.likeCount ?? 0) > 0 && (
            <>
              <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]}> · </Text>
              <Ionicons name="heart" size={11} color={colors.textTertiary} />
              <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]}> {item.likeCount}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Suggestion components ──

function RecentSearchRow({
  item,
  onPress,
  onDelete,
  colors,
}: {
  item: SearchSuggestion;
  onPress: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const imageUrl = item.displayImage || item.avatar?.url;
  const isPerson = item.selectedType === 'person';
  const isVenue = item.selectedType === 'venue';
  const name = isPerson
    ? `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.displayName || 'User'
    : item.displayName || item.query || 'Search';

  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={isPerson || !item.selectedType ? styles.avatar : styles.venueThumb}
        />
      ) : isPerson ? (
        <Image source={DefaultAvatarImage} style={styles.avatar} />
      ) : (
        <View style={[styles.recentIcon, { backgroundColor: colors.input }]}>
          <Ionicons
            name={item.selectedType ? getTypeIcon(item.selectedType) : 'time-outline'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      )}
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          {isPerson && item.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={15} color={colors.verified} style={{ marginLeft: 4 }} />
          )}
        </View>
        {isPerson && item.userName && (
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.userName}
          </Text>
        )}
        {isVenue && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              Venue
            </Text>
          </View>
        )}
        {!isPerson && !isVenue && item.selectedType && (
          <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]}>
            {item.selectedType}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SuggestionPersonRow({
  item,
  onPress,
  colors,
  subtitle,
}: {
  item: SearchSuggestion;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  subtitle?: string;
}) {
  const name = `${item.firstName || ''} ${item.lastName || ''}`.trim();
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      {item.avatar?.url ? (
        <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
      ) : (
        <Image source={DefaultAvatarImage} style={styles.avatar} />
      )}
      <View style={styles.resultInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
            {name || 'User'}
          </Text>
          {item.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={15} color={colors.verified} style={{ marginLeft: 4 }} />
          )}
        </View>
        {item.userName && (
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            @{item.userName}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.mutualText, { color: colors.textTertiary }]}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FrequentAvatarRow({
  items,
  onPress,
  colors,
}: {
  items: SearchSuggestion[];
  onPress: (item: SearchSuggestion) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.frequentRow}
    >
      {items.map((item) => {
        const name = `${item.firstName || ''}`.trim();
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.frequentItem}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
          >
            {item.avatar?.url ? (
              <Image source={{ uri: item.avatar.url }} style={styles.frequentAvatar} />
            ) : (
              <Image source={DefaultAvatarImage} style={styles.frequentAvatar} />
            )}
            <Text style={[styles.frequentName, { color: colors.textSecondary }]} numberOfLines={1}>
              {name || item.userName || 'User'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'person': return 'person-outline';
    case 'event': return 'calendar-outline';
    case 'venue': return 'location-outline';
    case 'post': return 'document-text-outline';
    default: return 'search-outline';
  }
}

// ── Main screen ──

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [ready, setReady] = useState(false);

  // Defer heavy content until screen transition finishes
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => handle.cancel();
  }, []);

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    results,
    isSearching,
    suggestions,
    recordSearch,
    deleteSearchEntry,
    clearSearchHistory,
  } = useUnifiedSearch();

  const hasQuery = debouncedQuery.length > 0;

  // Navigation + record
  const handleResultPress = useCallback(
    (item: UnifiedSearchItem) => {
      recordSearch({
        query: searchQuery,
        selectedType: item.type,
        selectedId: item.id,
        displayName:
          item.type === 'person'
            ? `${item.firstName || ''} ${item.lastName || ''}`.trim()
            : item.name || item.text || undefined,
        displayImage:
          item.avatar?.url || item.flyer?.url || item.logo?.url || undefined,
      });

      switch (item.type) {
        case 'person':
          router.push({
            pathname: '/user/[username]',
            params: { username: item.userName || `user-${item.id}`, userId: String(item.id) },
          });
          break;
        case 'event':
          router.push({
            pathname: '/event/[id]',
            params: { id: String(item.id) },
          });
          break;
        case 'venue':
          router.push({
            pathname: '/map',
            params: { venueName: item.name || '' },
          });
          break;
        case 'post':
          // Navigate to feed or post detail if available
          break;
      }
    },
    [searchQuery, recordSearch, router],
  );

  const handleSuggestionPersonPress = useCallback(
    (item: SearchSuggestion) => {
      recordSearch({
        selectedType: 'person',
        selectedId: item.id,
        displayName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        displayImage: item.avatar?.url,
      });
      router.push({
        pathname: '/user/[username]',
        params: { username: item.userName || `user-${item.id}`, userId: String(item.id) },
      });
    },
    [recordSearch, router],
  );

  const handleRecentPress = useCallback(
    (item: SearchSuggestion) => {
      if (item.selectedType === 'person') {
        const userId = item.selectedId;
        const username = item.userName || (userId ? `user-${userId}` : null);
        if (username) {
          router.push({
            pathname: '/user/[username]',
            params: { username, ...(userId ? { userId: String(userId) } : {}) },
          });
          return;
        }
      }
      if (item.selectedId && item.selectedType) {
        switch (item.selectedType) {
          case 'event':
            router.push({
              pathname: '/event/[id]',
              params: { id: String(item.selectedId) },
            });
            return;
          case 'venue':
            router.push({
              pathname: '/map',
              params: { venueName: item.displayName || '' },
            });
            return;
        }
      }
      if (item.query) {
        setSearchQuery(item.query);
      }
    },
    [router, setSearchQuery],
  );

  // Group results by category and sort categories by best score
  const groupedSections = React.useMemo(() => {
    if (results.length === 0) return [];

    const groups: Record<string, UnifiedSearchItem[]> = {};
    for (const item of results) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    }

    const categoryLabels: Record<string, string> = {
      person: 'People',
      event: 'Events',
      venue: 'Venues',
      post: 'Posts',
    };

    // Sort categories by the highest score in each group (best match first)
    return Object.entries(groups)
      .map(([type, items]) => ({
        type,
        label: categoryLabels[type] || type,
        data: items,
        topScore: Math.max(...items.map((i) => i.score)),
      }))
      .sort((a, b) => b.topScore - a.topScore);
  }, [results]);

  const renderResultRow = useCallback(
    (item: UnifiedSearchItem) => {
      const onPress = () => handleResultPress(item);
      switch (item.type) {
        case 'person':
          return <PersonRow key={`person-${item.id}`} item={item} onPress={onPress} colors={colors} />;
        case 'event':
          return <EventRow key={`event-${item.id}`} item={item} onPress={onPress} colors={colors} />;
        case 'venue':
          return <VenueRow key={`venue-${item.id}`} item={item} onPress={onPress} colors={colors} />;
        case 'post':
          return <PostRow key={`post-${item.id}`} item={item} onPress={onPress} colors={colors} />;
        default:
          return null;
      }
    },
    [handleResultPress, colors],
  );

  const recentSearches = suggestions?.recentSearches ?? [];
  const frequentFriends = suggestions?.frequentFriends ?? [];
  const mutualSuggestions = suggestions?.mutualFollowSuggestions ?? [];

  // Follow state — local for now; wire to API later.
  const [followedBrands, setFollowedBrands] = useState<Set<string>>(new Set());
  const [followedAthletes, setFollowedAthletes] = useState<Set<string>>(new Set());
  const [followedSchools, setFollowedSchools] = useState<Set<string>>(new Set());

  const toggleBrandFollow = useCallback((id: string) => {
    setFollowedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleAthleteFollow = useCallback((id: string) => {
    setFollowedAthletes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleSchoolFollow = useCallback((id: string) => {
    setFollowedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Filter catalogs by current query.
  const matchingBrands = React.useMemo(() => {
    if (!hasQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return BRAND_CATALOG.filter(
      (b) => b.name.toLowerCase().includes(q) || b.handle.toLowerCase().includes(q) || b.category.toLowerCase().includes(q),
    );
  }, [hasQuery, debouncedQuery]);

  const matchingAthletes = React.useMemo(() => {
    if (!hasQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return ATHLETE_CATALOG.filter(
      (a) => a.name.toLowerCase().includes(q) || a.handle.toLowerCase().includes(q) || a.sport.toLowerCase().includes(q) || a.school.toLowerCase().includes(q),
    );
  }, [hasQuery, debouncedQuery]);

  const matchingSchools = React.useMemo(() => {
    if (!hasQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return SCHOOL_CATALOG.filter(
      (s) => s.name.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q) || s.conference.toLowerCase().includes(q),
    );
  }, [hasQuery, debouncedQuery]);

  const handleBrandPress = useCallback((brand: BrandItem) => {
    recordSearch({ query: searchQuery, selectedType: 'venue', selectedId: undefined, displayName: brand.name });
  }, [searchQuery, recordSearch]);

  const handleAthletePress = useCallback((athlete: AthleteItem) => {
    recordSearch({ query: searchQuery, selectedType: 'person', selectedId: undefined, displayName: athlete.name });
  }, [searchQuery, recordSearch]);

  const handleSchoolPress = useCallback((school: SchoolItem) => {
    recordSearch({ query: searchQuery, selectedType: 'venue', selectedId: undefined, displayName: school.name });
  }, [searchQuery, recordSearch]);

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search athletes, schools, brands, deals..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {!ready ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      ) : hasQuery ? (
        // ── Search results ──
        isSearching && results.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : results.length === 0 && matchingBrands.length === 0 && matchingAthletes.length === 0 && matchingSchools.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No results for "{debouncedQuery}"
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {matchingAthletes.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Athletes</Text>
                </View>
                {matchingAthletes.map((a) => (
                  <AthleteRow
                    key={a.id}
                    athlete={a}
                    isFollowing={followedAthletes.has(a.id)}
                    onToggleFollow={() => toggleAthleteFollow(a.id)}
                    onPress={() => handleAthletePress(a)}
                    colors={colors}
                  />
                ))}
              </View>
            )}
            {matchingSchools.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Schools</Text>
                </View>
                {matchingSchools.map((sch) => (
                  <SchoolRow
                    key={sch.id}
                    school={sch}
                    isFollowing={followedSchools.has(sch.id)}
                    onToggleFollow={() => toggleSchoolFollow(sch.id)}
                    onPress={() => handleSchoolPress(sch)}
                    colors={colors}
                  />
                ))}
              </View>
            )}
            {matchingBrands.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Brands</Text>
                </View>
                {matchingBrands.map((b) => (
                  <BrandRow
                    key={b.id}
                    brand={b}
                    isFollowing={followedBrands.has(b.id)}
                    onToggleFollow={() => toggleBrandFollow(b.id)}
                    onPress={() => handleBrandPress(b)}
                    colors={colors}
                  />
                ))}
              </View>
            )}
            {groupedSections.map((section) => (
              <View key={section.type}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.label}</Text>
                </View>
                {section.data.map((item) => renderResultRow(item))}
              </View>
            ))}
          </ScrollView>
        )
      ) : (
        // ── Suggestions (no query) ──
        <ScrollView
          contentContainerStyle={[styles.suggestionsContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={[styles.clearText, { color: colors.textTertiary }]}>Clear all</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((item) => (
                <RecentSearchRow
                  key={item.id}
                  item={item}
                  onPress={() => handleRecentPress(item)}
                  onDelete={() => deleteSearchEntry(item.id)}
                  colors={colors}
                />
              ))}
            </Animated.View>
          )}

          {/* Frequently searched */}
          {frequentFriends.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently searched</Text>
              </View>
              <FrequentAvatarRow
                items={frequentFriends}
                onPress={handleSuggestionPersonPress}
                colors={colors}
              />
            </Animated.View>
          )}

          {/* Suggested (mutual follows) */}
          {mutualSuggestions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested for you</Text>
              </View>
              {mutualSuggestions.map((item) => (
                <SuggestionPersonRow
                  key={item.id}
                  item={item}
                  onPress={() => handleSuggestionPersonPress(item)}
                  colors={colors}
                  subtitle={
                    (item.mutualCount ?? 0) > 0
                      ? `${item.mutualCount} mutual ${item.mutualCount === 1 ? 'friend' : 'friends'}`
                      : undefined
                  }
                />
              ))}
            </Animated.View>
          )}

          {/* Top NIL athletes */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top NIL athletes</Text>
            </View>
            {ATHLETE_CATALOG.slice(0, 6).map((a) => (
              <AthleteRow
                key={a.id}
                athlete={a}
                isFollowing={followedAthletes.has(a.id)}
                onToggleFollow={() => toggleAthleteFollow(a.id)}
                onPress={() => handleAthletePress(a)}
                colors={colors}
              />
            ))}
          </Animated.View>

          {/* Schools */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Schools</Text>
            </View>
            {SCHOOL_CATALOG.slice(0, 5).map((sch) => (
              <SchoolRow
                key={sch.id}
                school={sch}
                isFollowing={followedSchools.has(sch.id)}
                onToggleFollow={() => toggleSchoolFollow(sch.id)}
                onPress={() => handleSchoolPress(sch)}
                colors={colors}
              />
            ))}
          </Animated.View>

          {/* Brands to follow */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Brands to follow</Text>
            </View>
            {BRAND_CATALOG.slice(0, 6).map((b) => (
              <BrandRow
                key={b.id}
                brand={b}
                isFollowing={followedBrands.has(b.id)}
                onToggleFollow={() => toggleBrandFollow(b.id)}
                onPress={() => handleBrandPress(b)}
                colors={colors}
              />
            ))}
          </Animated.View>

          {/* Empty suggestions state */}
          {recentSearches.length === 0 && frequentFriends.length === 0 && mutualSuggestions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Search for athletes, schools, brands, and NIL deals
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Result rows
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  brandAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  brandAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  brandFollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandFollowText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 15,
    flexShrink: 1,
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  mutualText: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#0095F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  followButtonFollowing: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  followButtonText: {
    fontSize: 13,
    color: '#fff',
  },
  followButtonTextFollowing: {
    color: 'rgba(0,0,0,0.5)',
  },
  // Event row
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  eventThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  // Venue / Post thumb
  venueThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  placeholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Recent search icon
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
  },
  clearText: {
    fontSize: 13,
  },
  // Frequent avatars horizontal row
  frequentRow: {
    gap: 16,
    paddingVertical: 8,
  },
  frequentItem: {
    alignItems: 'center',
    width: 64,
  },
  frequentAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  frequentName: {
    fontSize: 11,
    textAlign: 'center',
  },
  // States
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
