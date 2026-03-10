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
import { GlassSurface } from '@/components/glass/glass-surface';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRecipientCount, useSendTextBlast } from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TextBlastAudience } from '@/lib/types/text-blast.types';

const AUDIENCE_OPTIONS: {
  key: TextBlastAudience;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'my_list',
    label: 'My List',
    description: 'Guests you added to your list',
    icon: 'list-outline',
  },
  {
    key: 'all',
    label: 'This Event',
    description: 'All RSVPs, ticket holders, and check-ins',
    icon: 'people-outline',
  },
];

export default function TextBlastAudienceScreen() {
  const { id, message: messageParam } = useLocalSearchParams<{ id: string; message: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;
  const messageText = messageParam || '';

  const [selectedAudience, setSelectedAudience] = useState<TextBlastAudience>('my_list');
  const [successAlert, setSuccessAlert] = useState(false);

  const { data: recipientData, isLoading: countLoading } = useRecipientCount(
    eventId,
    selectedAudience,
  );
  const sendMutation = useSendTextBlast(eventId);
  const recipientCount = recipientData?.count ?? 0;

  const handleSend = () => {
    if (!messageText.trim() || recipientCount === 0) return;
    sendMutation.mutate(
      { message: messageText.trim(), audience: selectedAudience },
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send To</Text>
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
          <View style={styles.previewBubble}>
            <Text style={styles.previewText} numberOfLines={4}>
              {messageText}
            </Text>
          </View>
        </Animated.View>

        {/* Audience Options */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            Choose your audience
          </Text>

          {AUDIENCE_OPTIONS.map((option) => {
            const isSelected = selectedAudience === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setSelectedAudience(option.key)}
                activeOpacity={0.7}
              >
                <GlassSurface
                  fill={isSelected ? 'medium' : 'subtle'}
                  border={isSelected ? 'medium' : 'subtle'}
                  cornerRadius="lg"
                  style={styles.optionCard}
                >
                  <View style={styles.optionRow}>
                    <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isSelected ? '#fff' : 'rgba(255,255,255,0.5)'}
                      />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textTertiary }]}>
                        {option.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                    )}
                  </View>
                </GlassSurface>
              </TouchableOpacity>
            );
          })}
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
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.sendButtonText}>
                Send to {recipientCount} {recipientCount === 1 ? 'guest' : 'guests'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={successAlert}
        onClose={() => {
          setSuccessAlert(false);
          router.back();
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
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  previewSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  previewText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    lineHeight: 21,
  },
  optionCard: {
    padding: 14,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(0,122,255,0.3)',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
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
    fontFamily: 'Lato_400Regular',
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
    backgroundColor: '#007AFF',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
