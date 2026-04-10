// Channel post composer — owner/admin only
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { useCreateChannelPost } from '@/hooks/use-channel-mutations';
import { filesApi } from '@/lib/api/files';

export default function ChannelComposeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const [text, setText] = React.useState('');
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const createPost = useCreateChannelPost(id ?? '');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Photo library permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageDimensions({ width: asset.width, height: asset.height });
    }
  };

  const canSubmit = (text.trim().length > 0 || imageUri !== null) && !isUploading && !createPost.isPending;

  const handleSubmit = async () => {
    if (!id) return;
    if (!canSubmit) return;

    try {
      let mediaUrl: string | undefined;
      let mediaMetadata: { width?: number; height?: number; mimeType?: string } | undefined;

      if (imageUri) {
        setIsUploading(true);
        // Use the table-image upload flow as a generic image uploader
        mediaUrl = await filesApi.uploadTableImage(imageUri);
        if (imageDimensions) {
          mediaMetadata = { width: imageDimensions.width, height: imageDimensions.height };
        }
      }

      const postType: 'text' | 'image' = imageUri ? 'image' : 'text';

      createPost.mutate(
        {
          type: postType,
          text: text.trim() || undefined,
          mediaUrl,
          mediaMetadata,
        },
        {
          onSuccess: () => {
            showSuccess('Post published');
            router.back();
          },
          onError: (error) => {
            showError(error.message || 'Failed to post');
          },
          onSettled: () => {
            setIsUploading(false);
          },
        },
      );
    } catch (error) {
      setIsUploading(false);
      showError((error as Error).message || 'Upload failed');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {isUploading || createPost.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Share something with your channel..."
            placeholderTextColor="rgba(0,0,0,0.35)"
            multiline
            autoFocus
            maxLength={2000}
          />

          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageUri(null);
                  setImageDimensions(null);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={[styles.toolbar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handlePickImage} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.charCount}>{text.length} / 2000</Text>
        </View>
      </KeyboardAvoidingView>
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
  postButton: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 64,
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  textInput: {
    minHeight: 120,
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    color: '#000',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  imagePreviewWrapper: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 280,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#f2f2f2',
    gap: 12,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'right',
  },
});
