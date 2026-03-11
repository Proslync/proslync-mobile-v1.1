import { useState, useCallback } from 'react';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { ActionSheet } from '@/components/shared/action-sheet';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { ArtistRow } from '@/components/artists/artist-row';
import { ArtistFormModal } from '@/components/artists/artist-form-modal';
import {
  useEventArtists,
  useCreateEventArtist,
  useUpdateEventArtist,
  useDeleteEventArtist,
  useEventPermissions,
} from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import type { EventArtist } from '@/lib/types/artists.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArtistsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;

  // Permissions
  const { canEditEvents } = useEventPermissions(eventId);

  // Queries
  const artistsQuery = useEventArtists(eventId);
  const artists = artistsQuery.data?.artists ?? [];

  // Mutations
  const createArtist = useCreateEventArtist(eventId);
  const updateArtist = useUpdateEventArtist(eventId);
  const deleteArtist = useDeleteEventArtist(eventId);

  // Modal state
  const [formVisible, setFormVisible] = useState(false);
  const [editingArtist, setEditingArtist] = useState<EventArtist | null>(null);
  const [actionSheetArtist, setActionSheetArtist] = useState<EventArtist | null>(null);
  const [confirmDeleteArtist, setConfirmDeleteArtist] = useState<EventArtist | null>(null);

  // Pull-to-refresh
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await artistsQuery.refetch();
    },
  });

  // Handlers
  const handleOpenCreate = useCallback(() => {
    setEditingArtist(null);
    setFormVisible(true);
  }, []);

  const handleOpenEdit = useCallback((artist: EventArtist) => {
    setEditingArtist(artist);
    setFormVisible(true);
  }, []);

  const handleCreate = useCallback(
    (data: Parameters<typeof createArtist.mutate>[0]) => {
      createArtist.mutate(data, {
        onSuccess: () => setFormVisible(false),
      });
    },
    [createArtist],
  );

  const handleUpdate = useCallback(
    (data: Parameters<typeof updateArtist.mutate>[0]['data']) => {
      if (!editingArtist) return;
      updateArtist.mutate(
        { artistId: editingArtist.id, data },
        { onSuccess: () => setFormVisible(false) },
      );
    },
    [editingArtist, updateArtist],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteArtist) return;
    deleteArtist.mutate(confirmDeleteArtist.id, {
      onSettled: () => setConfirmDeleteArtist(null),
    });
  }, [confirmDeleteArtist, deleteArtist]);

  const canManage = canEditEvents();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Artists</Text>
          {artists.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.countText, { color: colors.text }]}>{artists.length}</Text>
            </View>
          )}
        </View>
        {canManage ? (
          <TouchableOpacity style={styles.headerButton} onPress={handleOpenCreate}>
            <Ionicons name="add-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </Animated.View>

      {artistsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : artists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No artists yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            Add artists and performers to showcase your event lineup
          </Text>
          {canManage && (
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={handleOpenCreate}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.text} />
              <Text style={[styles.emptyCtaText, { color: colors.text }]}>Add Artist</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {artists.map((artist, index) => (
            <Animated.View key={artist.id} entering={FadeInDown.delay(index * 40).duration(250)}>
              <ArtistRow
                artist={artist}
                canManage={canManage}
                onOptions={setActionSheetArtist}
              />
            </Animated.View>
          ))}
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
      <ArtistFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        artist={editingArtist}
        onSubmitCreate={handleCreate}
        onSubmitEdit={handleUpdate}
        loading={createArtist.isPending || updateArtist.isPending}
      />

      {/* Artist Action Sheet */}
      <ActionSheet
        visible={!!actionSheetArtist}
        title={actionSheetArtist?.userName || actionSheetArtist?.userFullName || 'Artist'}
        options={[
          {
            label: 'Edit',
            onPress: () => {
              if (actionSheetArtist) handleOpenEdit(actionSheetArtist);
            },
          },
          {
            label: 'Remove',
            destructive: true,
            onPress: () => {
              if (actionSheetArtist) setConfirmDeleteArtist(actionSheetArtist);
            },
          },
        ]}
        onClose={() => setActionSheetArtist(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={!!confirmDeleteArtist}
        title="Remove Artist"
        message={`Remove ${confirmDeleteArtist?.userName || confirmDeleteArtist?.userFullName || 'this artist'} from the event?`}
        confirmLabel="Remove"
        destructive
        isLoading={deleteArtist.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteArtist(null)}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
});
