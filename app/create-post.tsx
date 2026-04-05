// Create Post Screen - Upload photo/video posts
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/lib/providers/auth-provider';
import { useToast } from '@/components/shared/toast';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { postsApi } from '@/lib/api/posts';
import { LocationPickerSheet, type PostLocation } from '@/components/post/location-picker-sheet';
import { MusicPickerSheet } from '@/components/post/music-picker-sheet';
import { PeopleTagSheet, type TaggedPerson } from '@/components/post/people-tag-sheet';
import type { SpotifyTrack } from '@/lib/api/spotify';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();

  const [mediaUri, setMediaUri] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image');
  const [caption, setCaption] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [location, setLocation] = React.useState<PostLocation | null>(null);
  const [spotifyTrack, setSpotifyTrack] = React.useState<SpotifyTrack | null>(null);
  const [taggedPeople, setTaggedPeople] = React.useState<TaggedPerson[]>([]);
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [showMusicPicker, setShowMusicPicker] = React.useState(false);
  const [showPeoplePicker, setShowPeoplePicker] = React.useState(false);

  const avatarUrl = user?.avatar?.url;
  const username = user?.userName || 'username';

  const pickMedia = async (type: 'library' | 'camera') => {
    try {
      if (type === 'camera') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          showError('Camera permission is required');
          return;
        }
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showError('Photo library permission is required');
          return;
        }
      }

      const result = type === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      showError('Failed to select media');
    }
  };

  const handlePost = async () => {
    if (!mediaUri) {
      showError('Please select a photo or video');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload media then create post
      const uploadResult = await postsApi.uploadMedia(mediaUri, mediaType);
      await postsApi.createPost({
        caption: caption.trim() || undefined,
        mediaUrl: uploadResult.url,
        mediaType,
        location: location || undefined,
        spotifyTrack: spotifyTrack || undefined,
        taggedUserIds: taggedPeople.length > 0 ? taggedPeople.map((p) => p.id) : undefined,
      });

      showSuccess('Post created!');
      router.back();
    } catch (error: any) {
      console.error('Error:', error);
      showError(error?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
  };

  // Accent colors
  const primaryAccent = '#fff';
  const secondaryAccent = '#22c55e';
  const shareButtonColor = '#fff';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>New Post</Text>

        <TouchableOpacity
          style={[styles.postButton, { backgroundColor: shareButtonColor }, (!mediaUri || isSubmitting) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!mediaUri || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Media Selection */}
        {!mediaUri ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.mediaPickerContainer}
          >
            <TouchableOpacity
              style={[styles.mediaPickerOption, { overflow: 'hidden' }]}
              onPress={() => pickMedia('library')}
            >
              <GlassView {...liquidGlass.surface} borderRadius={16} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)', overflow: 'hidden' }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={32} style={StyleSheet.absoluteFillObject} />}
                <Ionicons name="images" size={32} color={primaryAccent} />
              </View>
              <Text style={[styles.mediaPickerTitle, { color: colors.text }]}>Choose from Library</Text>
              <Text style={[styles.mediaPickerSubtitle, { color: colors.textTertiary }]}>Select a photo or video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaPickerOption, { overflow: 'hidden' }]}
              onPress={() => pickMedia('camera')}
            >
              <GlassView {...liquidGlass.surface} borderRadius={16} style={StyleSheet.absoluteFillObject} />
              <View style={[styles.mediaPickerIconContainer, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)', overflow: 'hidden' }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={32} style={StyleSheet.absoluteFillObject} />}
                <Ionicons name="camera" size={32} color={secondaryAccent} />
              </View>
              <Text style={[styles.mediaPickerTitle, { color: colors.text }]}>Take Photo</Text>
              <Text style={[styles.mediaPickerSubtitle, { color: colors.textTertiary }]}>Use your camera</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.previewContainer}
          >
            {/* User Info */}
            <View style={styles.userRow}>
              <Image source={avatarUrl ? { uri: avatarUrl } : DefaultAvatarImage} style={styles.userAvatar} />
              <Text style={[styles.username, { color: colors.text }]}>{username}</Text>
            </View>

            {/* Media Preview */}
            <View style={styles.mediaPreviewWrapper}>
              <Image source={{ uri: mediaUri }} style={[styles.mediaPreview, { backgroundColor: colors.backgroundSecondary }]} />
              {mediaType === 'video' && (
                <View style={styles.videoIndicator}>
                  <Ionicons name="videocam" size={20} color="#fff" />
                </View>
              )}
              <TouchableOpacity style={styles.removeMediaButton} onPress={clearMedia}>
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Caption Input */}
            <View style={[styles.captionContainer, { backgroundColor: isDark ? undefined : colors.input, overflow: 'hidden' as const }]}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={[styles.captionInput, { color: colors.text }]}
                placeholder="Write a caption..."
                placeholderTextColor={colors.placeholder}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
              />
            </View>

            {/* Options */}
            <View style={[styles.optionsList, { overflow: 'hidden' }]}>
              <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
              <TouchableOpacity
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={() => location ? setLocation(null) : setShowLocationPicker(true)}
              >
                <Ionicons name="location-outline" size={22} color={location ? '#0A84FF' : colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: location ? '#0A84FF' : colors.text }]}>
                    {location ? location.name : 'Add location'}
                  </Text>
                  {location && (
                    <Text style={{ fontSize: 12, fontFamily: 'Lato_400Regular', color: colors.textTertiary }} numberOfLines={1}>
                      {location.address}
                    </Text>
                  )}
                </View>
                {location ? (
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                onPress={() => setShowPeoplePicker(true)}
              >
                <Ionicons name="person-outline" size={22} color={taggedPeople.length > 0 ? '#0A84FF' : colors.text} />
                <Text style={[styles.optionText, { color: taggedPeople.length > 0 ? '#0A84FF' : colors.text }]}>
                  {taggedPeople.length > 0 ? `${taggedPeople.length} ${taggedPeople.length === 1 ? 'person' : 'people'} tagged` : 'Tag people'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionItem, { borderBottomColor: 'transparent' }]}
                onPress={() => spotifyTrack ? setSpotifyTrack(null) : setShowMusicPicker(true)}
              >
                <Ionicons name="musical-notes-outline" size={22} color={spotifyTrack ? '#0A84FF' : colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: spotifyTrack ? '#0A84FF' : colors.text }]}>
                    {spotifyTrack ? spotifyTrack.name : 'Add music'}
                  </Text>
                  {spotifyTrack && (
                    <Text style={{ fontSize: 12, fontFamily: 'Lato_400Regular', color: colors.textTertiary }} numberOfLines={1}>
                      {spotifyTrack.artistName}
                    </Text>
                  )}
                </View>
                {spotifyTrack ? (
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <LocationPickerSheet
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={setLocation}
      />
      <MusicPickerSheet
        visible={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelect={setSpotifyTrack}
      />
      <PeopleTagSheet
        visible={showPeoplePicker}
        onClose={() => setShowPeoplePicker(false)}
        selected={taggedPeople}
        onConfirm={setTaggedPeople}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Media Picker
  mediaPickerContainer: {
    gap: 16,
    paddingTop: 40,
  },
  mediaPickerOption: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  mediaPickerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaPickerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  mediaPickerSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  // Preview
  previewContainer: {
    gap: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  mediaPreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    padding: 6,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  captionContainer: {
    borderRadius: 12,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
