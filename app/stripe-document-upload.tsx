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
  const { colors } = useAppTheme();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successIcon}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.successTitle}
          >
            Document Submitted
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(300)}
            style={styles.successDescription}
          >
            Your document has been submitted for review. Stripe will verify it
            shortly and update your account status.
          </Animated.Text>
        </View>
        <Animated.View
          entering={FadeIn.duration(400).delay(400)}
          style={[styles.bottomButton, { paddingBottom: insets.bottom + 24 }]}
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <Ionicons name="checkmark-circle" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={[styles.successTitle, { marginTop: 16 }]}>
            No Documents Needed
          </Text>
          <Text style={styles.successDescription}>
            Your account doesn't currently require any document uploads.
          </Text>
        </View>
        <View style={[styles.bottomButton, { paddingBottom: insets.bottom + 24 }]}>
          <GlassButton label="Go Back" onPress={() => router.back()} fullWidth size="lg" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <GlassButton
          label=""
          icon={<Ionicons name="arrow-back" size={24} color="#fff" />}
          variant="glass"
          size="sm"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

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
            <GlassSurface fill="subtle" border="subtle" cornerRadius="xl" style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons
                  name={docInfo.icon as any}
                  size={40}
                  color="#fff"
                />
              </View>
              <Text style={styles.infoTitle}>
                {docInfo.title}
                {isIdentityDoc && ` (${identitySide === 'front' ? 'Front' : 'Back'})`}
              </Text>
              <Text style={styles.infoDescription}>{docInfo.description}</Text>
              {requiredTypes.length > 1 && (
                <Text style={styles.progressText}>
                  Document {currentTypeIndex + 1} of {requiredTypes.length}
                </Text>
              )}
            </GlassSurface>
          </Animated.View>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassSurface fill="subtle" border="subtle" cornerRadius="xl" style={styles.previewCard}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              <GlassButton
                label="Change Photo"
                icon={<Ionicons name="refresh-outline" size={18} color="#fff" />}
                variant="glass"
                size="sm"
                onPress={() => setSelectedImage(null)}
                style={styles.changeButton}
              />
            </GlassSurface>
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
          style={[styles.bottomButton, { paddingBottom: insets.bottom + 24 }]}
        >
          {uploadMutation.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Uploading...</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressText: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    color: '#fff',
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
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
