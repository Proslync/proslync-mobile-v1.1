import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useVenue, useUpdateVenue } from '@/hooks/use-venue-query';
import { venuesApi } from '@/lib/api/venues';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useToast } from '@/components/shared/toast';
import { useQueryClient } from '@tanstack/react-query';

interface FormData {
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  email: string;
  website: string;
}

export default function EditVenueInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const venueId = id ? Number(id) : undefined;
  const { data: venue, isLoading } = useVenue(venueId);
  const updateVenue = useUpdateVenue();

  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
    email: '',
    website: '',
  });
  const [hasChanges, setHasChanges] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  React.useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        description: venue.description || '',
        address: venue.address || '',
        phoneNumber: venue.phoneNumber || '',
        email: venue.email || '',
        website: venue.website || '',
      });
    }
  }, [venue]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setHasChanges(true);
        // Image will be uploaded when the backend supports POST /api/venues/:id/image
        // For now, just show the preview locally
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showError('Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!hasChanges || !venueId) {
      router.back();
      return;
    }

    try {
      await updateVenue.mutateAsync({ id: venueId, data: formData });
      showSuccess('Venue updated');
      router.back();
    } catch (error: any) {
      console.error('Update venue error:', error);
      showError(error?.message || 'Failed to update venue');
    }
  };

  if (isLoading || !venue) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  const imageUrl = selectedImage || venue.imageUrl;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
        >
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={styles.headerButton} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <TouchableOpacity style={styles.imageSection} onPress={handlePickImage} activeOpacity={0.7}>
              <View style={[styles.imageContainer, { backgroundColor: colors.backgroundSecondary }]}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.venueImage} />
                ) : (
                  <Ionicons name="business" size={40} color={colors.textTertiary} />
                )}
                {isUploadingImage && (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.changePhotoText, { color: colors.text }]}>Change Photo</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={[styles.fieldCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>NAME</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="Venue name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.description}
                  onChangeText={(v) => updateField('description', v)}
                  placeholder="Add a description"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>ADDRESS</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.address}
                  onChangeText={(v) => updateField('address', v)}
                  placeholder="Street address"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>PHONE</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.phoneNumber}
                  onChangeText={(v) => updateField('phoneNumber', v)}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>EMAIL</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.email}
                  onChangeText={(v) => updateField('email', v)}
                  placeholder="Email address"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>WEBSITE</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.text }]}
                  value={formData.website}
                  onChangeText={(v) => updateField('website', v)}
                  placeholder="https://"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Save Button — fixed at bottom */}
        <View style={[styles.saveContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={updateVenue.isPending}
          >
            {updateVenue.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  imageSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  venueImage: { width: 100, height: 100, borderRadius: 50 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  fieldCard: { borderRadius: 16, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldInput: { fontSize: 16, fontFamily: 'Lato_400Regular', padding: 0 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  saveContainer: { paddingHorizontal: 16, paddingTop: 12 },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Lato_700Bold' },
});
