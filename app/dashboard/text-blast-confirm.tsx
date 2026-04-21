import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import {
  useCrossEventRecipientCount,
  useSendCrossEventBlast,
} from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOCK_VARIABLES: Record<string, string> = {
  '{first_name}': 'Alex',
  '{last_name}': 'Johnson',
  '{event_name}': '',
  '{event_date}': '',
};

function resolveMockPreview(template: string): string {
  let text = template;
  for (const [key, value] of Object.entries(MOCK_VARIABLES)) {
    text = text.replaceAll(key, value);
  }
  return text;
}

function hasTemplateVariables(text: string): boolean {
  return /\{(first_name|last_name)\}/.test(text);
}

export default function DashboardTextBlastConfirmScreen() {
  const { message: messageParam } = useLocalSearchParams<{ message: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const messageText = messageParam || '';

  const [successAlert, setSuccessAlert] = useState(false);

  const { data: recipientData, isLoading: countLoading } = useCrossEventRecipientCount();
  const sendMutation = useSendCrossEventBlast();
  const recipientCount = recipientData?.count ?? 0;

  const handleSend = () => {
    if (!messageText.trim() || recipientCount === 0) return;
    sendMutation.mutate(
      { message: messageText.trim() },
      {
        onSuccess: () => {
          setSuccessAlert(true);
        },
      },
    );
  };

  const canSend = messageText.trim().length > 0 && recipientCount > 0 && !sendMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm Blast</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Message Preview */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.previewSection}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Your message</Text>
          <View style={[styles.previewBubble, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}>
            {isDark && <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />}
            <Text style={styles.previewText}>{messageText}</Text>
          </View>
          {hasTemplateVariables(messageText) && (
            <>
              <Text style={[styles.mockLabel, { color: colors.textTertiary }]}>Preview</Text>
              <View style={[styles.previewBubble, styles.mockBubble]}>
                <Text style={styles.previewText}>
                  {resolveMockPreview(messageText)}
                </Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Audience Info */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.audienceSection}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Sending to</Text>
          <View style={[styles.audienceCard, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(255,255,255,0.08)' }]}>
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
            <View style={[styles.audienceIcon, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}>
              {isDark && <GlassView {...liquidGlass.fill} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
              <Ionicons name="people" size={20} color="#fff" />
            </View>
            <View style={styles.audienceInfo}>
              <Text style={[styles.audienceTitle, { color: colors.text }]}>All Contacts</Text>
              <Text style={[styles.audienceDesc, { color: colors.textTertiary }]}>
                Deduplicated across all your events
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Recipient Count */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.recipientRow}>
          <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
          {countLoading ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={[styles.recipientText, { color: colors.textTertiary }]}>
              {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'} will receive
              this message
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Send Button */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {isDark && <GlassView {...liquidGlass.fillMedium} borderRadius={24} style={StyleSheet.absoluteFill} />}
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.sendButtonText}>
                Send to {recipientCount} {recipientCount === 1 ? 'contact' : 'contacts'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmSheet
        visible={successAlert}
        onClose={() => {
          setSuccessAlert(false);
          // Go back two screens (confirm + composer)
          router.dismiss(2);
        }}
        title="Blast Sent"
        message="Your message has been queued for delivery."
        alertOnly
        icon="checkmark-circle-outline"
      />
    </View>
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
  headerTitle: { fontSize: 18, },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  previewSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    overflow: 'hidden',
  },
  previewText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
  },
  mockLabel: {
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
    alignSelf: 'flex-end',
  },
  mockBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  audienceSection: {
    marginBottom: 16,
  },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  audienceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  audienceInfo: {
    flex: 1,
  },
  audienceTitle: {
    fontSize: 15,
  },
  audienceDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  recipientText: {
    fontSize: 14,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
