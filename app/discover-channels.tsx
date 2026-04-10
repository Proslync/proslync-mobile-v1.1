// Discover Channels Screen
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { useDiscoverChannels } from '@/hooks/use-channels';
import { useJoinChannel } from '@/hooks/use-channel-mutations';
import { useDebounce } from '@/hooks';
import type { ChannelResponse } from '@/lib/api/channels';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

function DiscoverRow({
  channel,
  onPress,
  onJoin,
  isJoining,
}: {
  channel: ChannelResponse;
  onPress: () => void;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={channel.avatarUrl ? { uri: channel.avatarUrl } : DefaultAvatarImage}
        style={styles.avatar}
      />
      <View style={styles.rowContent}>
        <Text style={styles.rowName} numberOfLines={1}>
          {channel.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {channel.memberCount} {channel.memberCount === 1 ? 'member' : 'members'}
          {channel.description ? ` · ${channel.description}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={onJoin}
        disabled={isJoining}
        activeOpacity={0.8}
      >
        {isJoining ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.joinButtonText}>Join</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DiscoverChannelsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [searchText, setSearchText] = React.useState('');
  const debouncedSearch = useDebounce(searchText, 250);

  const { data: channels = [], isLoading, refetch } = useDiscoverChannels(debouncedSearch);
  const joinChannel = useJoinChannel();

  const handleJoin = (channelId: string) => {
    joinChannel.mutate(channelId, {
      onSuccess: () => {
        showSuccess('Joined channel');
        refetch();
      },
      onError: (error) => {
        showError(error.message || 'Failed to join channel');
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover Channels</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search public channels"
          placeholderTextColor="rgba(0,0,0,0.35)"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DiscoverRow
            channel={item}
            onPress={() => router.push({ pathname: '/channel/[id]', params: { id: item.id } } as any)}
            onJoin={() => handleJoin(item.id)}
            isJoining={joinChannel.isPending && joinChannel.variables === item.id}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          channels.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#000" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="rgba(0,0,0,0.2)" />
              <Text style={styles.emptyText}>
                {debouncedSearch ? 'No channels found' : 'Search for public channels'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#000',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  rowMeta: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
});
