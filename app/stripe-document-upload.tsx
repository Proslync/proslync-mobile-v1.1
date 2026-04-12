import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { useToast } from '@/components/shared/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStripeAccountStatus, useUploadDocument } from '@/hooks';
import {
  getRequiredDocumentTypes,
  type DocumentType,
} from '@/lib/api/wallet';

const DOC_INFO: Record<DocumentType, { title: string; description: string; icon: string }> = {
  bank_account_ownership_verification: {
    title: 'Bank Statement',
    description:
      'Upload a bank statement or voided check showing your name and the last 4 digits of your account number.',
    icon: 'document-text-outline',
  },
  identity_document: {
    title: 'Government ID',
    description:
      'Upload a photo of your government-issued ID (passport, driver\'s license, or national ID card).',
    icon: 'card-outline',
  },
};

export default function StripeDocumentUploadScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { documentType: paramDocType } = useLocalSearchParams<{
    documentType?: DocumentType;
  }>();

  const { data: accountStatus } = useStripeAccountStatus();
  const uploadMutation = useUploadDocument();

  // Determine which documents are needed
  const requiredTypes = paramDocType
    ? [paramDocType]
    : getRequiredDocumentTypes(accountStatus?.requirements, accountStatus?.futureRequirements);

  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  // For identity docs: track front/back
  const [identitySide, setIdentitySide] = useState<'front' | 'back'>('front');
  const [frontUploaded, setFrontUploaded] = useState(false);

  const currentType = requiredTypes[currentTypeIndex];
  const docInfo = currentType ? DOC_INFO[currentType] : null;
  const isIdentityDoc = currentType === 'identity_document';

  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.showError('Camera permission is required to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, [toast]);

  const handleUpload = useCallback(async () => {
    if (!selectedImage || !currentType) return;

    try {
      const side = isIdentityDoc ? identitySide : 'front';
      await uploadMutation.mutateAsync({
        fileUri: selectedImage,
        documentType: currentType,
        documentSide: side,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Identity doc: need front then back
      if (isIdentityDoc && identitySide === 'front' && !frontUploaded) {
        setFrontUploaded(true);
        setIdentitySide('back');
        setSelectedImage(null);
        toast.showSuccess('Front uploaded! Now upload the back.');
        return;
      }

      // Move to next document type or finish
      if (currentTypeIndex < requiredTypes.length - 1) {
        setCurrentTypeIndex((prev) => prev + 1);
        setSelectedImage(null);
        setIdentitySide('front');
        setFrontUploaded(false);
        toast.showSuccess('Document uploaded! Next document needed.');
      } else {
        setIsComplete(true);
      }
    } catch (error: any) {
      toast.showError(error?.message || 'Failed to upload document.');
    }
  }, [
    selectedImage,
    currentType,
    isIdentityDoc,
    identitySide,
    frontUploaded,
    currentTypeIndex,
    requiredTypes.length,
    uploadMutation,
    toast,
  ]);

  // Success state
  if (isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
                <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successIcon}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color={colors.text} />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(200)}
            style={[styles.successTitle, { color: colors.text }]}
          >
            Document Submitted
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(300)}
            style={[styles.successDescription, { color: colors.textSecondary }]}
          >
            Your document has been submitted for review. Stripe will verify it
            shortly and update your account status.
          </Animated.Text>
        </View>
        <Animated.View
          entering={FadeIn.duration(400).delay(400)}
          style={[styles.bottomButton, { paddingBottom: insets.bottom + 24, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}
        >
          <GlassButton
            label="Continue"
            onPress={() => router.replace('/dashboard/payments')}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </View>
    );
  }

  // No documents needed
  if (requiredTypes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
                <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.textTertiary} />
          <Text style={[styles.successTitle, { marginTop: 16, color: colors.text }]}>
            No Documents Needed
          </Text>
          <Text style={[styles.successDescription, { color: colors.textSecondary }]}>
            Your account doesn't currently require any document uploads.
          </Text>
        </View>
        <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 24, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
          <GlassButton label="Go Back" onPress={() => router.back()} fullWidth size="lg" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
      
      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <View style={styles.pillIcon}>
          <Ionicons name="chevron-back" size={20} color="#000" onPress={() => router.back()} />
        </View>
        <View style={styles.pillLabel}>
          <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.12)" borderRadius={19} style={StyleSheet.absoluteFill} />
          <Text style={styles.pillLabelText}>Upload Document</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        {docInfo && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[styles.infoCard, { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: isDark ? undefined : colors.cardElevated, overflow: 'hidden' as const }]}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={36} style={StyleSheet.absoluteFillObject} />}
                <Ionicons
                  name={docInfo.icon as any}
                  size={40}
                  color={colors.text}
                />
              </View>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {docInfo.title}
                {isIdentityDoc && ` (${identitySide === 'front' ? 'Front' : 'Back'})`}
              </Text>
              <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>{docInfo.description}</Text>
              {requiredTypes.length > 1 && (
                <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                  Document {currentTypeIndex + 1} of {requiredTypes.length}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.previewCard, { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }]}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              <GlassButton
                label="Change Photo"
                icon={<Ionicons name="refresh-outline" size={18} color="#fff" />}
                variant="glass"
                size="sm"
                onPress={() => setSelectedImage(null)}
                style={styles.changeButton}
              />
            </View>
          </Animated.View>
        )}

        {/* Pick Buttons */}
        {!selectedImage && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.pickButtons}>
            <GlassButton
              label="Take Photo"
              icon={<Ionicons name="camera-outline" size={20} color="#fff" />}
              variant="glass"
              size="lg"
              onPress={() => pickImage('camera')}
              fullWidth
            />
            <View style={styles.buttonSpacer} />
            <GlassButton
              label="Choose from Library"
              icon={<Ionicons name="images-outline" size={20} color="#fff" />}
              variant="glass"
              size="lg"
              onPress={() => pickImage('library')}
              fullWidth
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Upload Button */}
      {selectedImage && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.bottomButton, { paddingBottom: insets.bottom + 24, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}
        >
          {uploadMutation.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.loadingText, { color: colors.text }]}>Uploading...</Text>
            </View>
          ) : (
            <GlassButton
              label={isIdentityDoc && identitySide === 'front' && !frontUploaded
                ? 'Upload Front'
                : 'Upload Document'}
              icon={<Ionicons name="cloud-upload-outline" size={20} color="#fff" />}
              variant="glass"
              size="lg"
              onPress={handleUpload}
              fullWidth
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    marginTop: 12,
  },
  previewCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeButton: {
    alignSelf: 'center',
  },
  pickButtons: {
    gap: 0,
  },
  buttonSpacer: {
    height: 12,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  // Success state
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
