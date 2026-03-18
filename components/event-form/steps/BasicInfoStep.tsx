// Step 1: Basic Info - Event name, description, and flyer

import { useFormContext, useWatch } from 'react-hook-form';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FormTextInput } from '@/components/forms';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import type { EventFormData } from '@/lib/schemas/events';

function FlyerVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.flyerPreview}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

interface BasicInfoStepProps {
  existingFlyerUrl?: string | null;
  existingFlyerMediaType?: 'image' | 'video' | null;
  onFlyerRemoved?: () => void;
}

export function BasicInfoStep({ existingFlyerUrl, existingFlyerMediaType, onFlyerRemoved }: BasicInfoStepProps = {}) {
  const { colors, isDark } = useAppTheme();
  const { showError } = useToast();
  const { setValue, control, formState: { errors } } = useFormContext<EventFormData>();
  const accentColor = '#FFFFFF';

  // Watch flyerUri and mediaType for preview - use existing values as fallback
  const flyerUri = useWatch({ control, name: 'flyerUri' });
  const flyerMediaType = useWatch({ control, name: 'flyerMediaType' });
  const displayFlyerUri = flyerUri || existingFlyerUrl;
  const displayMediaType = flyerMediaType || existingFlyerMediaType || 'image';

  const pickFlyer = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError('Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mediaType = asset.type === 'video' ? 'video' : 'image';

      // Check file size (1GB max)
      const maxBytes = 1024 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > maxBytes) {
        const sizeMb = Math.round(asset.fileSize / (1024 * 1024));
        showError(`Your file is too large (${sizeMb} MB). Maximum allowed size is 1GB.`);
        return;
      }

      setValue('flyerUri', asset.uri, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('flyerMediaType', mediaType, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const removeFlyer = () => {
    setValue('flyerUri', '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('flyerMediaType', 'image', {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Also notify parent if there was an existing flyer
    onFlyerRemoved?.();
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <FormTextInput<EventFormData>
        name="name"
        label="What's your event called?"
        placeholder="Event name"
        autoFocus
      />

      <View style={styles.section}>
        <FormTextInput<EventFormData>
          name="description"
          label="Describe your event"
          placeholder="Tell people what to expect..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Event Flyer <Text style={styles.required}>*</Text></Text>
        {displayFlyerUri ? (
          <View style={styles.flyerPreviewContainer}>
            {displayMediaType === 'video' ? (
              <FlyerVideoPreview uri={displayFlyerUri} />
            ) : (
              <Image source={{ uri: displayFlyerUri }} style={styles.flyerPreview} />
            )}
            <TouchableOpacity style={styles.flyerRemoveButton} onPress={removeFlyer}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.flyerChangeButton} onPress={pickFlyer}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.flyerChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.flyerPickerWrapper}>
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
            <TouchableOpacity
              style={[
                styles.flyerPickerButton,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(56, 151, 240, 0.3)',
                },
              ]}
              onPress={pickFlyer}
            >
              <Ionicons name="image-outline" size={32} color={accentColor} />
              <Text style={[styles.flyerPickerText, { color: accentColor }]}>Add Event Flyer</Text>
              <Text style={[styles.flyerPickerHint, { color: colors.textTertiary }]}>
                Tap to upload an image or video
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {errors.flyerUri && (
          <Text style={styles.errorText}>{errors.flyerUri.message as string}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  flyerPickerWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  flyerPickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerPickerText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
  },
  flyerPickerHint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  flyerPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  flyerPreview: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  flyerRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  flyerChangeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  flyerChangeText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
    color: '#fff',
  },
  required: {
    color: '#ff3b30',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ff3b30',
    marginTop: 8,
  },
});
