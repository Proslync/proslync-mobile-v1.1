// ── EXPLORE VIEW ───────────────────────────────────────────
// Role-agnostic universal discovery surface. Three sections (Feed, Games,
// Discover) for every authenticated user — pro and fan alike. Single-row
// floating chrome packs the section switcher between Search + Share.
//
// Pickem and Perks are fan-only gamification surfaces and live on the
// fan dashboard (`app/(fan-tabs)/dashboard.tsx`), not here. Keeping Explore
// universal means a pro and a fan see the same shared discovery content.

import { useRouter } from 'expo-router';
import * as React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { FeedNavBar } from '@/components/feed/feed-nav-bar';
import {
  DiscoveryBlock,
  FollowingFeed,
  GamesRail,
} from '@/components/explore/sections';

type SectionKey = 'feed' | 'games' | 'discover';

const SECTION_LABELS: Record<SectionKey, string> = {
  feed: 'Feed',
  games: 'Games',
  discover: 'Discover',
};

const SECTIONS: readonly SectionKey[] = ['feed', 'games', 'discover'];

export function ExploreView() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [section, setSection] = React.useState<SectionKey>(SECTIONS[0]);

  // Single floating chrome row clears at ~110pt above the native tab bar.
  const sectionBottomInset = insets.bottom + 110;

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={styles.sectionHost}>
        {section === 'feed' && (
          <FollowingFeed bottomInset={sectionBottomInset} />
        )}
        {section === 'games' && (
          <GamesRail bottomInset={sectionBottomInset} />
        )}
        {section === 'discover' && (
          <DiscoveryBlock topInset={insets.top + 10} />
        )}
      </View>

      <FeedNavBar
        variant="slots"
        slots={{
          left: {
            variant: 'circle',
            icon: 'search-outline',
            accessibilityLabel: 'Search',
            onPress: () => router.push('/search-screen' as any),
          },
          center: {
            variant: 'segmented',
            sections: SECTIONS.map((key) => SECTION_LABELS[key]),
            activeSection: SECTION_LABELS[section],
            onSectionChange: (label) => {
              const next = SECTIONS.find((key) => SECTION_LABELS[key] === label);
              if (next) setSection(next);
            },
          },
          right: {
            variant: 'circle',
            icon: 'share-outline',
            accessibilityLabel: 'Share Proslync Explore',
            onPress: () => {
              void Share.share({ message: 'Proslync Explore' });
            },
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sectionHost: {
    flex: 1,
  },
});
