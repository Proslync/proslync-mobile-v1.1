import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { followsApi, type ContactMatch } from '@/lib/api/follows';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { fontFamily } from '@/constants/glass/tokens';

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

interface ContactsStepProps {
  onSuccess: () => void;
}

export function ContactsStep({ onSuccess }: ContactsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [status, setStatus] = React.useState<'requesting' | 'loading' | 'results' | 'denied'>('requesting');
  const [matches, setMatches] = React.useState<ContactMatch[]>([]);
  const [followedIds, setFollowedIds] = React.useState<Set<number>>(new Set());
  const [followingAll, setFollowingAll] = React.useState(false);

  React.useEffect(() => {
    requestContacts();
  }, []);

  const requestContacts = async () => {
    try {
      const { status: permStatus } = await Contacts.requestPermissionsAsync();
      if (permStatus !== 'granted') {
        setStatus('denied');
        return;
      }

      setStatus('loading');
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const phoneNumbers: string[] = [];
      for (const contact of data) {
        if (contact.phoneNumbers) {
          for (const pn of contact.phoneNumbers) {
            if (pn.number) {
              const cleaned = pn.number.replace(/[^\d+]/g, '');
              if (cleaned.length >= 10) {
                phoneNumbers.push(cleaned);
              }
            }
          }
        }
      }

      const unique = [...new Set(phoneNumbers)];

      if (unique.length === 0) {
        setMatches([]);
        setStatus('results');
        return;
      }

      const allMatches: ContactMatch[] = [];
      for (let i = 0; i < unique.length; i += 500) {
        const batch = unique.slice(i, i + 500);
        const result = await followsApi.findContactsOnStatus(batch);
        allMatches.push(...result);
      }

      setMatches(allMatches);
      setStatus('results');
    } catch (err) {
      console.error('Contacts sync error:', err);
      setStatus('denied');
    }
  };

  const handleFollowUser = async (userId: number) => {
    try {
      await followsApi.followUser(userId);
      setFollowedIds((prev) => new Set([...prev, userId]));
    } catch (err) {
      // Ignore 409
    }
  };

  const handleFollowAll = async () => {
    setFollowingAll(true);
    const unfollowed = matches.filter((m) => !followedIds.has(m.id));
    await Promise.allSettled(
      unfollowed.map((m) =>
        followsApi.followUser(m.id).then(() => {
          setFollowedIds((prev) => new Set([...prev, m.id]));
        })
      )
    );
    setFollowingAll(false);
  };

  const renderContact = ({ item, index }: { item: ContactMatch; index: number }) => {
    const isFollowed = followedIds.has(item.id);
    const displayName = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName || 'User';

    return (
      <Animated.View entering={FadeInDown.duration(200).delay(index * 30)}>
        <GlassSurface
          fill="subtle"
          border="subtle"
          cornerRadius="lg"
          style={styles.contactCard}
        >
          <Image
            source={item.avatarUrl ? { uri: item.avatarUrl } : DEFAULT_AVATAR}
            style={styles.contactAvatar}
          />
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {item.userName && (
              <Text style={[styles.contactUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                @{item.userName}
              </Text>
            )}
          </View>
          <GlassButton
            label={isFollowed ? 'Following' : 'Follow'}
            variant="glass"
            size="sm"
            onPress={() => !isFollowed && handleFollowUser(item.id)}
            disabled={isFollowed}
          />
        </GlassSurface>
      </Animated.View>
    );
  };

  // Requesting / Loading state
  if (status === 'requesting' || status === 'loading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {status === 'requesting' ? 'Requesting access...' : 'Finding your friends...'}
          </Text>
        </View>
      </View>
    );
  }

  // Denied or no matches
  if (status === 'denied' || matches.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centerContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <GlassSurface
              fill="light"
              border="subtle"
              cornerRadius="3xl"
              style={styles.emptyIconContainer}
            >
              <Ionicons
                name={status === 'denied' ? 'people-outline' : 'search-outline'}
                size={40}
                color={colors.textTertiary}
              />
            </GlassSurface>
          </Animated.View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {status === 'denied' ? 'Contacts Access' : 'No Friends Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {status === 'denied'
              ? 'Allow contacts access to find friends on Status'
              : 'None of your contacts are on Status yet. Invite them!'}
          </Text>
        </View>
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
          <GlassButton
            label="Continue"
            variant="glass"
            size="lg"
            onPress={onSuccess}
            fullWidth
          />
        </View>
      </View>
    );
  }

  // Results
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Image
          source={require('@/assets/images/status_logo.png')}
          style={[styles.logo, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Find Friends</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {matches.length} {matches.length === 1 ? 'contact' : 'contacts'} on Status
        </Text>
      </Animated.View>

      {/* Follow All Button */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.followAllContainer}>
        <GlassButton
          label={followedIds.size === matches.length ? 'Following All' : followingAll ? '' : 'Follow All'}
          variant="glass"
          size="md"
          onPress={handleFollowAll}
          loading={followingAll}
          disabled={followingAll || followedIds.size === matches.length}
          fullWidth
        />
      </Animated.View>

      <FlatList
        data={matches}
        renderItem={renderContact}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
      />

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
        <GlassButton
          label="Continue"
          variant="glass"
          size="lg"
          onPress={onSuccess}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  followAllContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  listSeparator: {
    height: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  contactUsername: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
