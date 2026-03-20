import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { appleMessagesApi, type GenerateLinkingCodeResponse } from '@/lib/api/apple-messages';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { fontFamily } from '@/constants/glass/tokens';

const CODE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface AppleMessagesStepProps {
  onSuccess: () => void;
}

export function AppleMessagesStep({ onSuccess }: AppleMessagesStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { skipAppleMessagesLinking } = useAuth();

  const handleContinue = React.useCallback(() => {
    skipAppleMessagesLinking();
    onSuccess();
  }, [skipAppleMessagesLinking, onSuccess]);

  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [linkingData, setLinkingData] = React.useState<GenerateLinkingCodeResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  const generateCode = React.useCallback(async () => {
    setStatus('loading');
    try {
      const data = await appleMessagesApi.generateLinkingCode();
      setLinkingData(data);
      const expiresAt = new Date(data.expiresAt).getTime();
      setSecondsLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
      setStatus('ready');
    } catch (err) {
      console.error('Failed to generate linking code:', err);
      setStatus('error');
    }
  }, []);

  React.useEffect(() => {
    generateCode();
  }, [generateCode]);

  // Countdown timer
  React.useEffect(() => {
    if (status !== 'ready' || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, secondsLeft]);

  const handleOpenMessages = () => {
    if (linkingData?.appleMessagesUrl) {
      Linking.openURL(linkingData.appleMessagesUrl);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (status === 'loading') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Generating code...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.centerContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <GlassSurface
              fill="light"
              border="subtle"
              cornerRadius="3xl"
              style={styles.iconContainer}
            >
              <Ionicons name="alert-circle-outline" size={40} color={colors.textTertiary} />
            </GlassSurface>
          </Animated.View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Could not generate a linking code. You can try again or skip this step.
          </Text>
          <View style={{ marginTop: 16, width: '100%', paddingHorizontal: 24 }}>
            <GlassButton
              label="Try Again"
              variant="glass"
              size="md"
              onPress={generateCode}
              fullWidth
            />
          </View>
        </View>
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
          <GlassButton
            label="Skip"
            variant="glass"
            size="lg"
            onPress={handleContinue}
            fullWidth
          />
        </View>
      </View>
    );
  }

  const codeExpired = secondsLeft <= 0;

  // Ready state
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Image
          source={require('@/assets/images/status_logo.png')}
          style={[styles.logo, { tintColor: colors.text }]}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Connect Apple Messages
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Link your account to receive updates and interact with Status via Apple Messages
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.codeSection}>
        <GlassSurface
          fill="light"
          border="subtle"
          cornerRadius="xl"
          style={styles.codeCard}
        >
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
            Your linking code
          </Text>
          <Text style={[styles.codeText, { color: codeExpired ? colors.textTertiary : colors.text }]}>
            {codeExpired ? '------' : linkingData?.code}
          </Text>
          {codeExpired ? (
            <GlassButton
              label="Generate New Code"
              variant="glass"
              size="sm"
              onPress={generateCode}
            />
          ) : (
            <Text style={[styles.timerText, { color: colors.textSecondary }]}>
              Expires in {formatTime(secondsLeft)}
            </Text>
          )}
        </GlassSurface>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.actionsSection}>
        <GlassButton
          label="Open Messages"
          variant="glass"
          size="lg"
          onPress={handleOpenMessages}
          disabled={codeExpired}
          fullWidth
          icon={<Ionicons name="chatbubble-outline" size={18} color="#fff" />}
        />
        <Text style={[styles.helpText, { color: colors.textTertiary }]}>
          Tapping "Open Messages" will open a conversation with Status. Send the code above to link your account.
        </Text>
      </Animated.View>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
        <GlassButton
          label="Continue"
          variant="glass"
          size="lg"
          onPress={handleContinue}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  codeSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  codeCard: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  codeText: {
    fontSize: 40,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 8,
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  helpText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
