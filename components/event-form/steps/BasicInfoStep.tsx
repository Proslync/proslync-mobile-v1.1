// Step 1: Basic Info - Event name, description, and flyer

import { useFormContext, useWatch } from 'react-hook-form';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FormTextInput } from '@/components/forms';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import type { EventFormData } from '@/lib/schemas/events';

interface BasicInfoStepProps {
  existingFlyerUrl?: string | null;
  onFlyerRemoved?: () => void;
}

export function BasicInfoStep({ existingFlyerUrl, onFlyerRemoved }: BasicInfoStepProps = {}) {
  const { colors, isDark } = useAppTheme();
  const { showError } = useToast();
  const { setValue, control } = useFormContext<EventFormData>();
  const accentColor = '#8b5cf6';

  // Watch flyerUri for preview - use existing URL as fallback
  const flyerUri = useWatch({ control, name: 'flyerUri' });
  const displayFlyerUri = flyerUri || existingFlyerUrl;

  const pickFlyer = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showError('Permission to access photos is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setValue('flyerUri', result.assets[0].uri, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const removeFlyer = () => {
    setValue('flyerUri', null, {
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
        <Text style={[styles.label, { color: colors.text }]}>Event Flyer</Text>
        {displayFlyerUri ? (
          <View style={styles.flyerPreviewContainer}>
            <Image source={{ uri: displayFlyerUri }} style={styles.flyerPreview} />
            <TouchableOpacity style={styles.flyerRemoveButton} onPress={removeFlyer}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.flyerChangeButton} onPress={pickFlyer}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.flyerChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.flyerPickerButton,
              {
                backgroundColor: colors.input,
                borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.3)',
              },
            ]}
            onPress={pickFlyer}
          >
            <Ionicons name="image-outline" size={32} color={accentColor} />
            <Text style={[styles.flyerPickerText, { color: accentColor }]}>Add Event Flyer</Text>
            <Text style={[styles.flyerPickerHint, { color: colors.textTertiary }]}>
              Tap to upload an image
            </Text>
          </TouchableOpacity>
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
});
