import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass, activeGradient, activeGradientLight, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ActionSheet } from '@/components/shared/action-sheet';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { UpdateProfileRequest } from '@/lib/types/auth.types';

const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');

interface FormData {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  bio: string;
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const gradient = isDark ? activeGradient : activeGradientLight;
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    bio: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        userName: user.userName || '',
        email: user.email || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

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
        await uploadAvatar(asset.uri, asset.fileSize);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showError('Failed to pick image');
    }
  };

  const handleOpenCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        await uploadAvatar(asset.uri, asset.fileSize);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showError('Failed to take photo');
    }
  };

  const uploadAvatar = async (uri: string, fileSize?: number) => {
    setIsUploadingPhoto(true);
    try {
      const fileName = uri.split('/').pop() || 'avatar.jpg';
      const extension = fileName.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'webp') mimeType = 'image/webp';

      const uploadFileSize = fileSize || 1024 * 1024;

      const presignedResponse = await authApi.getAvatarPresignedUrl(fileName, mimeType, uploadFileSize);
      await authApi.uploadToPresignedUrl(presignedResponse.uploadUrl, uri, mimeType);
      await authApi.confirmUpload(presignedResponse.fileId);

      showSuccess('Photo updated');
      await refreshUser();
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      showError(error?.message || 'Failed to upload photo');
      setSelectedImage(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const [showPhotoMenu, setShowPhotoMenu] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const handleChangePhoto = () => {
    setShowPhotoMenu(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    if (formData.userName && !/^[a-zA-Z0-9_]+$/.test(formData.userName)) {
      showError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsSaving(true);

    try {
      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        userName: formData.userName || undefined,
        email: formData.email || undefined,
        bio: formData.bio,
      };

      const response = await authApi.updateProfile(updateData);

      if (response.success) {
        await refreshUser();
        showSuccess('Profile updated successfully');
        router.back();
      } else {
        showError(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      showError(error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const avatarUrl = selectedImage || user?.avatar?.url;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <LinearGradient
        colors={[...gradient.colors]}
        locations={[...gradient.locations]}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={isSaving || isUploadingPhoto}
          >
            <Text style={[styles.cancelText, { color: t.secondary }]}>Cancel</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: t.primary }]}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving || isUploadingPhoto}
          >
            {isSaving ? (
              <ActivityIndicator color={t.primary} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: t.primary }, !hasChanges && { opacity: 0.4 }]}>
                Done
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              onPress={handleChangePhoto}
              activeOpacity={0.8}
              disabled={isUploadingPhoto}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: border }]} />
              ) : (
                <Image source={DEFAULT_AVATAR} style={[styles.avatar, { borderColor: border }]} />
              )}
              <View style={[styles.editPhotoOverlay, { borderColor: isDark ? '#000' : '#fff' }]}>
                {/* @ts-expect-error — augmented GlassViewProps */}
                <GlassView {...liquidGlass.surface} tintColor="rgba(10, 10, 10, 0.5)" borderRadius={16} style={StyleSheet.absoluteFill} />
                {isUploadingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="camera" size={18} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto}>
              <Text style={[styles.changePhotoText, { color: t.primary }]}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>About You</Text>

            <View style={[styles.fieldsCard, { borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={16} style={styles.fieldsCardGlass} />

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: t.tertiary }]}>First Name</Text>
                <TextInput
                  style={[styles.fieldInput, { color: t.primary }]}
                  value={formData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  placeholder="First name"
                  placeholderTextColor={t.faint}
                  autoCapitalize="words"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: border }]} />

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: t.tertiary }]}>Last Name</Text>
                <TextInput
                  style={[styles.fieldInput, { color: t.primary }]}
                  value={formData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  placeholder="Last name"
                  placeholderTextColor={t.faint}
                  autoCapitalize="words"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: border }]} />

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: t.tertiary }]}>Username</Text>
                <View style={styles.usernameRow}>
                  <Text style={[styles.usernamePrefix, { color: t.tertiary }]}>@</Text>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1, color: t.primary }]}
                    value={formData.userName}
                    onChangeText={(text) => updateField('userName', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    placeholderTextColor={t.faint}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                  />
                </View>
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: border }]} />

              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { color: t.tertiary }]}>Email</Text>
                <TextInput
                  style={[styles.fieldInput, { color: t.primary }]}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="your@email.com"
                  placeholderTextColor={t.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
              </View>
            </View>

            <View style={[styles.fieldsCard, { marginTop: 16, borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={16} style={styles.fieldsCardGlass} />

              <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
                <Text style={[styles.fieldLabel, { marginTop: 4, color: t.tertiary }]}>Bio</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top', color: t.primary }]}
                    value={formData.bio}
                    onChangeText={(text) => updateField('bio', text)}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={t.faint}
                    multiline
                    numberOfLines={4}
                    maxLength={150}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                  />
                  <Text style={[styles.charCount, { color: t.muted }]}>{formData.bio.length}/150</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={showPhotoMenu}
        onClose={() => setShowPhotoMenu(false)}
        options={[
          {
            label: 'Take Photo',
            icon: 'camera-outline',
            onPress: () => { setShowPhotoMenu(false); handleOpenCamera(); },
          },
          {
            label: 'Choose from Library',
            icon: 'images-outline',
            onPress: () => { setShowPhotoMenu(false); handlePickImage(); },
          },
        ]}
      />

      <ConfirmModal
        visible={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => { setShowDiscardConfirm(false); router.back(); }}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        destructive
        icon="alert-circle-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
    minWidth: 60,
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginTop: 12,
  },
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  fieldsCardGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    width: 90,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    padding: 0,
  },
  fieldDivider: {
    height: 1,
    marginLeft: 16,
  },
  usernameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    marginRight: 2,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'right',
    marginTop: 4,
  },
});
