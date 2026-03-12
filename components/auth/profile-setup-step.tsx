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
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/providers/auth-provider";
import { handleApiError } from "@/lib/api/errors";
import { useAppTheme } from "@/hooks/use-app-theme";

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

  // Username availability
  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<
    boolean | null
  >(null);
  const [usernameError, setUsernameError] = React.useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { refreshUser } = useAuth();

  const lastNameRef = React.useRef<TextInput>(null);
  const userNameRef = React.useRef<TextInput>(null);

  // Validate username format
  const isValidUsername = (value: string) => /^[a-zA-Z0-9_]+$/.test(value);

  // Debounced username availability check
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
        // Network error — don't block
        setUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userName]);

  const handleUsernameChange = (text: string) => {
    // Strip spaces and special chars except underscores
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
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
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.input }]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
            </TouchableOpacity>
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
          Choose a username and enter your name.
        </Animated.Text>

        {/* First Name */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={[styles.inputContainer, { backgroundColor: colors.input }]}
        >
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
        </Animated.View>

        {/* Last Name */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(550)}
          style={[
            styles.inputContainer,
            { backgroundColor: colors.input, marginTop: 14 },
          ]}
        >
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
        </Animated.View>

        {/* Username */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(600)}
          style={[
            styles.inputContainer,
            { backgroundColor: colors.input, marginTop: 14 },
          ]}
        >
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
          {/* Availability indicator */}
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
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    height: 56,
    fontSize: 17,
    paddingHorizontal: 16,
  },
  atPrefix: {
    fontSize: 17,
    fontWeight: "500",
    paddingLeft: 16,
  },
  availabilityIndicator: {
    paddingRight: 16,
  },
  availableIcon: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "700",
  },
  takenIcon: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "700",
  },
  usernameError: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 8,
    paddingLeft: 4,
  },
  usernameAvailable: {
    color: "#4ade80",
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
  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#3897F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
