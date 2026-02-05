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

const DEFAULT_AVATAR = 'https://picsum.photos/200';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mediaUri, setMediaUri] = React.useState<string | null>(null);
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image');
  const [caption, setCaption] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const avatarUrl = user?.avatar?.url || DEFAULT_AVATAR;
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
      console.error('[CreatePost] Error picking media:', error);
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
      // TODO: Implement actual post creation API
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      showSuccess('Post created!');
      router.back();
    } catch (error: any) {
      console.error('[CreatePost] Error:', error);
      showError(error?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Post</Text>

        <TouchableOpacity
          style={[styles.postButton, (!mediaUri || isSubmitting) && styles.postButtonDisabled]}
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
              style={styles.mediaPickerOption}
              onPress={() => pickMedia('library')}
            >
              <View style={styles.mediaPickerIconContainer}>
                <Ionicons name="images" size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.mediaPickerTitle}>Choose from Library</Text>
              <Text style={styles.mediaPickerSubtitle}>Select a photo or video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaPickerOption}
              onPress={() => pickMedia('camera')}
            >
              <View style={styles.mediaPickerIconContainer}>
                <Ionicons name="camera" size={32} color="#22c55e" />
              </View>
              <Text style={styles.mediaPickerTitle}>Take Photo</Text>
              <Text style={styles.mediaPickerSubtitle}>Use your camera</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.previewContainer}
          >
            {/* User Info */}
            <View style={styles.userRow}>
              <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
              <Text style={styles.username}>{username}</Text>
            </View>

            {/* Media Preview */}
            <View style={styles.mediaPreviewWrapper}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
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
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
              />
            </View>

            {/* Options */}
            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="location-outline" size={22} color="#fff" />
                <Text style={styles.optionText}>Add location</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="person-outline" size={22} color="#fff" />
                <Text style={styles.optionText}>Tag people</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="musical-notes-outline" size={22} color="#fff" />
                <Text style={styles.optionText}>Add music</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#0095f6',
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
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  mediaPickerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaPickerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  mediaPickerSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
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
    color: '#fff',
  },
  mediaPreviewWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsList: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
});
