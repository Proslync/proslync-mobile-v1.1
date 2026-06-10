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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GlassView } from 'expo-glass-effect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistLocalMedia, isLocalMediaAlive } from '@/lib/media/local-media';
import { resolveAvatarSource } from '@/lib/media/resolve-media';
import { useAuth } from '@/lib/providers/auth-provider';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/shared/toast';
import { ActionSheet } from '@/components/ui/action-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { UpdateProfileRequest } from '@/lib/types/auth.types';

const ACCENT = '#FF6F3C';
const DEFAULT_AVATAR = require('@/assets/images/default-avatar.png');
const AVATAR_KEY = 'proslync:profile:avatar:v1';

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
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [showPhotoMenu, setShowPhotoMenu] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await AsyncStorage.getItem(AVATAR_KEY).catch(() => null);
      if (v && (await isLocalMediaAlive(v))) {
        if (!cancelled) setSelectedImage(v);
      } else if (v) {
        // Orphaned pointer from a reinstall — clean it up.
        AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
        await saveAvatarLocally(asset.uri);
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
        await saveAvatarLocally(asset.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showError('Failed to take photo');
    }
  };

  // The VPS backend has no /api/files/* endpoints yet, so avatar uploads can't
  // work. Persist the pick locally (same pattern as profile banners); the
  // curated-media snapshot bakes it into builds.
  const saveAvatarLocally = async (uri: string) => {
    const previousImage = selectedImage;
    setIsSavingPhoto(true);
    try {
      const persistedUri = await persistLocalMedia(uri, 'profile-avatar', 'image');
      setSelectedImage(persistedUri);
      await AsyncStorage.setItem(AVATAR_KEY, persistedUri);
      showSuccess('Photo updated');
    } catch (error: any) {
      console.error('Save avatar error:', error);
      showError(error?.message || 'Failed to save photo');
      setSelectedImage(previousImage);
    } finally {
      setIsSavingPhoto(false);
    }
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
    if (hasChanges) setShowDiscardConfirm(true);
    else router.back();
  };

  const avatarSource = selectedImage
    ? { uri: selectedImage }
    : resolveAvatarSource(null, user?.avatar?.url, DEFAULT_AVATAR);

  return (
    <View style={styles.container}>
      {/* Ambient glow at top */}
      <LinearGradient
        colors={['rgba(255,111,60,0.2)', 'transparent']}
        style={[styles.ambient, { height: insets.top + 260 }]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleCancel}
            disabled={isSaving || isSavingPhoto}
            activeOpacity={0.7}
          >
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 19 }]} />
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.doneBtn, hasChanges && styles.doneBtnActive]}
            onPress={handleSave}
            disabled={isSaving || isSavingPhoto || !hasChanges}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.doneText,
                  hasChanges && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                Done
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <Animated.View entering={FadeInDown.duration(450)} style={styles.photoSection}>
            <View style={styles.avatarRing}>
              <TouchableOpacity
                onPress={() => setShowPhotoMenu(true)}
                activeOpacity={0.85}
                disabled={isSavingPhoto}
              >
                <Image
                  source={avatarSource}
                  style={styles.avatar}
                />
                <View style={styles.cameraBadge}>
                  {isSavingPhoto ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowPhotoMenu(true)}
              disabled={isSavingPhoto}
              style={styles.changePhotoBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.changePhotoText}>
                {isSavingPhoto ? 'Saving…' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* About You card */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)}>
            <Text style={styles.sectionLabel}>ABOUT YOU</Text>
            <View style={styles.card}>
              <FieldRow
                icon="person-outline"
                iconColor="#3B82F6"
                iconBg="rgba(59,130,246,0.14)"
                label="First name"
                value={formData.firstName}
                onChange={(v) => updateField('firstName', v)}
                placeholder="First name"
                autoCapitalize="words"
              />
              <Divider />
              <FieldRow
                icon="person-outline"
                iconColor="#3B82F6"
                iconBg="rgba(59,130,246,0.14)"
                label="Last name"
                value={formData.lastName}
                onChange={(v) => updateField('lastName', v)}
                placeholder="Last name"
                autoCapitalize="words"
              />
              <Divider />
              <FieldRow
                icon="at-outline"
                iconColor={ACCENT}
                iconBg="rgba(255,111,60,0.14)"
                label="Username"
                value={formData.userName}
                onChange={(v) => updateField('userName', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                prefix="@"
                autoCapitalize="none"
              />
              <Divider />
              <FieldRow
                icon="mail-outline"
                iconColor="#34C759"
                iconBg="rgba(52,199,89,0.12)"
                label="Email"
                value={formData.email}
                onChange={(v) => updateField('email', v)}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </Animated.View>

          {/* Bio card */}
          <Animated.View entering={FadeInDown.delay(140).duration(450)}>
            <Text style={styles.sectionLabel}>BIO</Text>
            <View style={styles.card}>
              <View style={styles.bioRow}>
                <View style={styles.bioHead}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(168,85,247,0.14)' }]}>
                    <Ionicons name="book-outline" size={16} color="#A855F7" />
                  </View>
                  <Text style={styles.bioLabel}>About you</Text>
                  <Text style={styles.charCount}>{formData.bio.length}/150</Text>
                </View>
                <TextInput
                  style={styles.bioInput}
                  value={formData.bio}
                  onChangeText={(text) => updateField('bio', text)}
                  placeholder="Tell us about yourself — what you play, what you care about, where you're headed."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  numberOfLines={4}
                  maxLength={150}
                  keyboardAppearance="dark"
                />
              </View>
            </View>
          </Animated.View>
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

      <ConfirmSheet
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

// ============================================================
// Field row component
// ============================================================

function FieldRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onChange,
  placeholder,
  prefix,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.inputWrap}>
          {prefix && <Text style={styles.prefix}>{prefix}</Text>}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardAppearance="dark"
          />
        </View>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  doneBtn: {
    minWidth: 66,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  doneBtnActive: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  doneText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  photoSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    padding: 3,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,111,60,0.6)',
    backgroundColor: 'rgba(255,111,60,0.08)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1c22',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  changePhotoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 4,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.4,
    fontWeight: '600',
    marginBottom: 2,
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center' },
  prefix: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginRight: 2 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 60,
  },

  bioRow: { paddingVertical: 12, paddingHorizontal: 14 },
  bioHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  bioLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  charCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  bioInput: {
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 21,
    padding: 0,
    fontWeight: '500',
  },
});
