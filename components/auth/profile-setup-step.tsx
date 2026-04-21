import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/providers/auth-provider";
import { handleApiError } from "@/lib/api/errors";
import { useAppTheme } from "@/hooks/use-app-theme";
import { GlassCard } from "@/components/glass/glass-card";
import { GlassSurface } from "@/components/glass/glass-surface";
import { GlassButton } from "@/components/glass/glass-button";
import { fontFamily } from "@/constants/glass/tokens";

interface ProfileSetupStepProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export function ProfileSetupStep({ onSuccess, onBack }: ProfileSetupStepProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    boolean | null
  >(null);
  const [usernameError, setUsernameError] = React.useState<string | null>(null);

  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { refreshUser } = useAuth();

  const lastNameRef = React.useRef<TextInput>(null);
  const userNameRef = React.useRef<TextInput>(null);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);
        setIsUploadingAvatar(true);
        try {
          const fileName = asset.uri.split("/").pop() || "avatar.jpg";
          const ext = fileName.split(".").pop()?.toLowerCase();
          let mimeType = "image/jpeg";
          if (ext === "png") mimeType = "image/png";
          else if (ext === "gif") mimeType = "image/gif";
          else if (ext === "webp") mimeType = "image/webp";

          const presigned = await authApi.getAvatarPresignedUrl(
            fileName,
            mimeType,
            asset.fileSize || 1024 * 1024,
          );
          await authApi.uploadToPresignedUrl(presigned.uploadUrl, asset.uri, mimeType);
          await authApi.confirmUpload(presigned.fileId);
        } catch (err) {
          console.error("Avatar upload error:", err);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch {
      // cancelled
    }
  };

  const isValidUsername = (value: string) => /^[a-zA-Z0-9_]+$/.test(value);

  React.useEffect(() => {
    setUsernameAvailable(null);
    setUsernameError(null);

    if (!userName || userName.length < 3) return;

    if (!isValidUsername(userName)) {
      setUsernameError("Letters, numbers, and underscores only");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const available = await authApi.checkUsernameAvailable(userName);
        if (available) {
          setUsernameAvailable(true);
          setUsernameError(null);
        } else {
          setUsernameAvailable(false);
          setUsernameError(`@${userName} is already taken`);
        }
      } catch {
        setUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userName]);

  const handleUsernameChange = (text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9_]/g, "");
    setUserName(cleaned);
    if (error) setError(null);
  };

  const isFormValid =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    userName.length >= 3 &&
    isValidUsername(userName) &&
    usernameAvailable === true &&
    !isCheckingUsername;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userName: userName.trim(),
      });
      await refreshUser();
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? handleApiError(err) : "Failed to create profile";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBorderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        {/* Back Button */}
        {onBack && (
          <Animated.View
            entering={FadeIn.duration(300).delay(200)}
            style={styles.backButtonContainer}
          >
            <GlassSurface
              fill="light"
              border="subtle"
              cornerRadius="3xl"
              style={styles.backButtonSurface}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
              </TouchableOpacity>
            </GlassSurface>
          </Animated.View>
        )}

        <View style={styles.topSpacer} />

        {/* Logo */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.logoContainer}
        >
          <Image
            source={require("@/assets/images/status_logo.png")}
            style={[styles.logo, { tintColor: colors.text }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(400)}
          style={[styles.title, { color: colors.text }]}
        >
          Create Your Profile
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(450)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Add a photo and choose your username
        </Animated.Text>

        {/* Avatar Picker */}
        <Animated.View
          entering={FadeIn.duration(600).delay(480)}
          style={styles.avatarSection}
        >
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.7}
            disabled={isUploadingAvatar}
          >
            <GlassSurface
              fill="medium"
              border="medium"
              cornerRadius="3xl"
              style={styles.avatarSurface}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={28} color={colors.textTertiary} />
                </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </GlassSurface>
          </TouchableOpacity>
          <Text style={[styles.avatarLabel, { color: colors.textSecondary }]}>
            Add Photo
          </Text>
        </Animated.View>

        {/* Input Fields — Glass Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(500)}>
          <GlassCard
            fill="light"
            border="subtle"
            cornerRadius="lg"
            shadowLevel="md"
            blurIntensity="medium"
            style={styles.glassFormCard}
          >
            {/* First Name */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="First Name"
                placeholderTextColor={colors.placeholder}
                keyboardAppearance={isDark ? "dark" : "light"}
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t);
                  if (error) setError(null);
                }}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                selectionColor={colors.textTertiary}
                cursorColor={colors.textSecondary}
                textContentType="givenName"
                autoComplete="given-name"
              />
            </View>

            <View style={[styles.inputSeparator, { backgroundColor: inputBorderColor }]} />

            {/* Last Name */}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={lastNameRef}
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Last Name"
                placeholderTextColor={colors.placeholder}
                keyboardAppearance={isDark ? "dark" : "light"}
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t);
                  if (error) setError(null);
                }}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => userNameRef.current?.focus()}
                selectionColor={colors.textTertiary}
                cursorColor={colors.textSecondary}
                textContentType="familyName"
                autoComplete="family-name"
              />
            </View>

            <View style={[styles.inputSeparator, { backgroundColor: inputBorderColor }]} />

            {/* Username */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.atPrefix, { color: colors.textSecondary }]}>
                @
              </Text>
              <TextInput
                ref={userNameRef}
                style={[styles.textInput, { color: colors.text, paddingLeft: 0 }]}
                placeholder="username"
                placeholderTextColor={colors.placeholder}
                keyboardAppearance={isDark ? "dark" : "light"}
                value={userName}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                selectionColor={colors.textTertiary}
                cursorColor={colors.textSecondary}
                textContentType="username"
                autoComplete="username"
              />
              {userName.length >= 3 && (
                <View style={styles.availabilityIndicator}>
                  {isCheckingUsername ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : usernameAvailable === true ? (
                    <Text style={styles.availableIcon}>✓</Text>
                  ) : usernameAvailable === false ? (
                    <Text style={styles.takenIcon}>✗</Text>
                  ) : null}
                </View>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Username status message */}
        {usernameError && (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            style={styles.usernameError}
          >
            {usernameError}
          </Animated.Text>
        )}
        {usernameAvailable === true && userName.length >= 3 && (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            style={styles.usernameAvailable}
          >
            @{userName} is available
          </Animated.Text>
        )}

        {/* Error Message */}
        {error && (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            style={styles.errorText}
          >
            {error}
          </Animated.Text>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.buttonContainer}
        >
          <GlassButton
            label={isSubmitting ? '' : 'Continue'}
            variant="glass"
            size="lg"
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            loading={isSubmitting}
            fullWidth
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    alignSelf: "flex-start",
  },
  backButtonSurface: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
  },
  topSpacer: {
    height: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 48,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarSurface: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 45,
  },
  avatarLabel: {
    fontSize: 13,
    marginTop: 8,
  },
  glassFormCard: {
    width: '100%',
    paddingVertical: 0,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
  },
  inputSeparator: {
    height: 1,
    marginHorizontal: 16,
  },
  textInput: {
    flex: 1,
    height: 54,
    fontSize: 17,
    paddingHorizontal: 16,
  },
  atPrefix: {
    fontSize: 17,
    paddingLeft: 16,
    marginRight: 4,
  },
  availabilityIndicator: {
    paddingRight: 16,
  },
  availableIcon: {
    color: "#34C759",
    fontSize: 18,
  },
  takenIcon: {
    color: "#ff6b6b",
    fontSize: 18,
  },
  usernameError: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 4,
  },
  usernameAvailable: {
    color: "#34C759",
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 20,
  },
});
