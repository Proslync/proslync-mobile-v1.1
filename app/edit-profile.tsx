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
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
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

  // Initialize form with user data
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
      // Get file name from URI
      const fileName = uri.split('/').pop() || 'avatar.jpg';
      // Determine mime type from file extension
      const extension = fileName.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      }

      // Use provided file size or estimate
      const uploadFileSize = fileSize || 1024 * 1024; // Default to 1MB if not provided


      // Step 1: Get presigned URL
      const presignedResponse = await authApi.getAvatarPresignedUrl(
        fileName,
        mimeType,
        uploadFileSize
      );

      // Upload to presigned URL
      await authApi.uploadToPresignedUrl(presignedResponse.uploadUrl, uri, mimeType);

      // Confirm upload
      await authApi.confirmUpload(presignedResponse.fileId);

      showSuccess('Photo updated');
      await refreshUser();
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to upload photo';
      showError(errorMessage);
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

    // Validate username
    if (formData.userName && !/^[a-zA-Z0-9_]+$/.test(formData.userName)) {
      showError('Username can only contain letters, numbers, and underscores');
      return;
    }

    // Validate email if provided
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
        // Refresh user data
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={isSaving || isUploadingPhoto}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving || isUploadingPhoto}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: colors.buttonPrimary }, !hasChanges && { opacity: 0.5 }]}>
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
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { borderColor: colors.borderStrong }]} />
              ) : (
                <Image source={DEFAULT_AVATAR} style={[styles.avatar, { borderColor: colors.borderStrong }]} />
              )}
              <View style={[styles.editPhotoOverlay, { borderColor: colors.background }]}>
                <GlassView {...liquidGlass.fill} borderRadius={16} style={StyleSheet.absoluteFillObject} />
                {isUploadingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto}>
              <Text style={[styles.changePhotoText, { color: colors.buttonPrimary }]}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>About You</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>First Name</Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, color: colors.text }]}
                  value={formData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Last Name</Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, color: colors.text }]}
                  value={formData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Username</Text>
              <View style={[styles.usernameInputContainer, { borderColor: colors.inputBorder }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <Text style={[styles.usernamePrefix, { color: colors.textSecondary }]}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput, { color: colors.text }]}
                  value={formData.userName}
                  onChangeText={(text) => updateField('userName', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, color: colors.text }]}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio</Text>
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[styles.input, styles.bioInput, { borderColor: colors.inputBorder, color: colors.text }]}
                  value={formData.bio}
                  onChangeText={(text) => updateField('bio', text)}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  maxLength={150}
                  textAlignVertical="top"
                />
              </View>
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>{formData.bio.length}/150</Text>
            </View>
          </View>

          {/* Bottom spacing */}
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
    borderWidth: 2,
    overflow: 'hidden',
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'right',
    marginTop: 4,
  },
  inputWrapper: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  usernamePrefix: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    paddingLeft: 16,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 4,
  },
});
