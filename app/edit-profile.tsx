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
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/shared/toast';
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
      console.error('[EditProfile] Image picker error:', error);
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
      console.error('[EditProfile] Camera error:', error);
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

      console.log('[EditProfile] Getting presigned URL for avatar:', { fileName, mimeType, fileSize: uploadFileSize });

      // Step 1: Get presigned URL
      const presignedResponse = await authApi.getAvatarPresignedUrl(
        fileName,
        mimeType,
        uploadFileSize
      );

      console.log('[EditProfile] Presigned URL response:', {
        fileId: presignedResponse.fileId,
        message: presignedResponse.message,
        uploadUrlPrefix: presignedResponse.uploadUrl.substring(0, 50),
      });

      // Step 2: Upload to presigned URL
      console.log('[EditProfile] Uploading to presigned URL...');
      await authApi.uploadToPresignedUrl(presignedResponse.uploadUrl, uri, mimeType);

      console.log('[EditProfile] Upload complete, confirming...');

      // Step 3: Confirm upload
      const confirmResponse = await authApi.confirmUpload(presignedResponse.fileId);
      console.log('[EditProfile] Upload confirmed:', confirmResponse);

      showSuccess('Photo updated');
      await refreshUser();
    } catch (error: any) {
      console.error('[EditProfile] Upload avatar error:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to upload photo';
      showError(errorMessage);
      setSelectedImage(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleOpenCamera();
          } else if (buttonIndex === 2) {
            handlePickImage();
          }
        }
      );
    } else {
      Alert.alert('Change Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleOpenCamera },
        { text: 'Choose from Library', onPress: handlePickImage },
      ]);
    }
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
        bio: formData.bio || undefined,
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
      console.error('[EditProfile] Save error:', error);
      showError(error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const avatarUrl = selectedImage || user?.avatar?.url;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={isSaving || isUploadingPhoto}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.headerButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving || isUploadingPhoto}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>
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
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <Image source={DEFAULT_AVATAR} style={styles.avatar} />
              )}
              <View style={styles.editPhotoOverlay}>
                {isUploadingPhoto ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangePhoto} disabled={isUploadingPhoto}>
              <Text style={styles.changePhotoText}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>About You</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                placeholder="Enter your first name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                placeholder="Enter your last name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.usernameInputContainer}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={formData.userName}
                  onChangeText={(text) => updateField('userName', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="your@email.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell us about yourself"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={4}
                maxLength={150}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{formData.bio.length}/150</Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
  saveTextDisabled: {
    color: 'rgba(0, 149, 246, 0.5)',
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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  changePhotoText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
    marginTop: 12,
  },
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
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
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 4,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  usernamePrefix: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    paddingLeft: 16,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 4,
  },
});
