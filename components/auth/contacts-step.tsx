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

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

interface ContactsStepProps {
  onSuccess: () => void;
}

export function ContactsStep({ onSuccess }: ContactsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
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

      // Extract all phone numbers, normalize
      const phoneNumbers: string[] = [];
      for (const contact of data) {
        if (contact.phoneNumbers) {
          for (const pn of contact.phoneNumbers) {
            if (pn.number) {
              // Basic normalization: strip non-digits, keep + prefix
              const cleaned = pn.number.replace(/[^\d+]/g, '');
              if (cleaned.length >= 10) {
                phoneNumbers.push(cleaned);
              }
            }
          }
        }
      }

      // Deduplicate
      const unique = [...new Set(phoneNumbers)];

      if (unique.length === 0) {
        setMatches([]);
        setStatus('results');
        return;
      }

      // Send in batches of 500
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
      // Ignore 409 (already following)
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

  const renderContact = ({ item }: { item: ContactMatch }) => {
    const isFollowed = followedIds.has(item.id);
    const displayName = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.userName || 'User';

    return (
      <Animated.View entering={FadeInDown.duration(200)} style={styles.contactRow}>
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
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowed
              ? { backgroundColor: colors.buttonSecondary }
              : { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
          ]}
          onPress={() => !isFollowed && handleFollowUser(item.id)}
          activeOpacity={0.7}
          disabled={isFollowed}
        >
          <Text style={[styles.followButtonText, { color: colors.text }]}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Requesting / Loading state
  if (status === 'requesting' || status === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
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
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centerContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Ionicons
              name={status === 'denied' ? 'people-outline' : 'search-outline'}
              size={56}
              color={colors.textTertiary}
            />
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
          <TouchableOpacity style={styles.skipButton} onPress={onSuccess} activeOpacity={0.7}>
            <Text style={[styles.skipButtonText, { color: colors.text }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Results
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
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
        <TouchableOpacity
          style={[styles.followAllButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }]}
          onPress={handleFollowAll}
          activeOpacity={0.7}
          disabled={followingAll || followedIds.size === matches.length}
        >
          {followingAll ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={[styles.followAllText, { color: colors.text }]}>
              {followedIds.size === matches.length ? 'Following All' : 'Follow All'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={matches}
        renderItem={renderContact}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }]}
          onPress={onSuccess}
          activeOpacity={0.7}
        >
          <Text style={[styles.continueButtonText, { color: colors.text }]}>Continue</Text>
        </TouchableOpacity>
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
    fontSize: 24,
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
  followAllButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followAllText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  listContent: {
    paddingHorizontal: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
  followButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
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
  skipButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  skipButtonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
});
