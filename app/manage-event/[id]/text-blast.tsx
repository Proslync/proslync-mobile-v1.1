import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  useTextBlasts,
  useRecipientCount,
  useSendTextBlast,
  useEventPermissions,
} from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TextBlastAudience, TextBlastResponse } from '@/lib/types/text-blast.types';

const AUDIENCES: { key: TextBlastAudience; label: string }[] = [
  { key: 'all', label: 'All Guests' },
  { key: 'checked_in', label: 'Checked In' },
  { key: 'verified', label: 'Verified' },
  { key: 'pending', label: 'Pending' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function audienceLabel(filter: string): string {
  const found = AUDIENCES.find((a) => a.key === filter);
  return found ? found.label : 'All Guests';
}

export default function TextBlastScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;
  const { canSendMarketing, canViewMarketing } = useEventPermissions(eventId || undefined);

  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<TextBlastAudience>('all');
  const [successAlert, setSuccessAlert] = useState(false);

  const { data: recipientData } = useRecipientCount(eventId, audience);
  const { data: blasts = [], isLoading } = useTextBlasts(eventId);
  const sendMutation = useSendTextBlast(eventId);

  const recipientCount = recipientData?.count ?? 0;

  const handleSend = () => {
    if (!message.trim() || recipientCount === 0) return;
    sendMutation.mutate(
      { message: message.trim(), audience },
      {
        onSuccess: () => {
          setMessage('');
          setSuccessAlert(true);
        },
      },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Text Blast</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Compose Section */}
          {canSendMarketing() && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Compose</Text>
              </View>
              <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
                Send an SMS message to your event guests.
              </Text>

              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.composeCard}>
                <TextInput
                  style={[styles.messageInput, { color: colors.text }]}
                  placeholder="Type your message..."
                  placeholderTextColor={colors.textTertiary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={1600}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                  {message.length}/1600
                </Text>
              </GlassSurface>

              {/* Audience Filter */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Audience</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.audienceRow}
              >
                {AUDIENCES.map((a) => {
                  const isSelected = audience === a.key;
                  return (
                    <TouchableOpacity
                      key={a.key}
                      onPress={() => setAudience(a.key)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.audienceChip,
                          isSelected && styles.audienceChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.audienceChipText,
                            isSelected && styles.audienceChipTextSelected,
                          ]}
                        >
                          {a.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Recipient Count */}
              <View style={styles.recipientRow}>
                <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.recipientText, { color: colors.textTertiary }]}>
                  {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
                </Text>
              </View>

              {/* Send Button */}
              <GlassButton
                label={
                  sendMutation.isPending
                    ? 'Sending...'
                    : `Send to ${recipientCount} ${recipientCount === 1 ? 'guest' : 'guests'}`
                }
                icon="send-outline"
                variant="glass"
                size="lg"
                fullWidth
                onPress={handleSend}
                disabled={!message.trim() || recipientCount === 0 || sendMutation.isPending}
                loading={sendMutation.isPending}
              />
            </Animated.View>
          )}

          {/* Past Blasts Section */}
          {canViewMarketing() && (
            <Animated.View entering={FadeInDown.duration(300).delay(100)}>
              <View style={[styles.sectionHeader, { marginTop: canSendMarketing() ? 32 : 8 }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Past Blasts</Text>
              </View>

              {blasts.length === 0 ? (
                <View style={styles.emptySection}>
                  <Ionicons name="chatbubble-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    No text blasts yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                    Send your first message to guests above
                  </Text>
                </View>
              ) : (
                blasts.map((blast) => (
                  <BlastCard key={blast.id} blast={blast} colors={colors} />
                ))
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={successAlert}
        onClose={() => setSuccessAlert(false)}
        title="Blast Sent"
        message="Your message has been queued for delivery."
        alertOnly
        icon="checkmark-circle-outline"
      />
    </View>
  );
}

function BlastCard({
  blast,
  colors,
}: {
  blast: TextBlastResponse;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.blastCard}>
      <Text style={[styles.blastMessage, { color: colors.text }]} numberOfLines={2}>
        {blast.message}
      </Text>

      <View style={styles.blastMeta}>
        <View style={styles.blastBadge}>
          <Text style={styles.blastBadgeText}>{audienceLabel(blast.audienceFilter)}</Text>
        </View>
        <Text style={[styles.blastDate, { color: colors.textTertiary }]}>
          {formatDate(blast.createdAt)}
        </Text>
      </View>

      <View style={styles.blastStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textTertiary }]}>
            {blast.recipientCount} sent
          </Text>
        </View>
        {blast.deliveredCount != null && (
          <View style={styles.statItem}>
            <Ionicons name="checkmark-done-outline" size={14} color="#22c55e" />
            <Text style={[styles.statText, { color: '#22c55e' }]}>
              {blast.deliveredCount} delivered
            </Text>
          </View>
        )}
        {blast.failedCount != null && blast.failedCount > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="alert-circle-outline" size={14} color="#ef4444" />
            <Text style={[styles.statText, { color: '#ef4444' }]}>
              {blast.failedCount} failed
            </Text>
          </View>
        )}
      </View>
    </GlassSurface>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Lato_700Bold' },
  sectionDescription: { fontSize: 13, fontFamily: 'Lato_400Regular', marginBottom: 16 },
  composeCard: { padding: 16, marginBottom: 16 },
  messageInput: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    minHeight: 100,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    textAlign: 'right',
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    marginBottom: 8,
  },
  audienceRow: { gap: 8, marginBottom: 16 },
  audienceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audienceChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  audienceChipText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  audienceChipTextSelected: {
    color: '#fff',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  recipientText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  emptySection: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  emptySubtext: { fontSize: 13, fontFamily: 'Lato_400Regular' },
  blastCard: { padding: 16, marginBottom: 12 },
  blastMessage: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  blastMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  blastBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  blastBadgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
  },
  blastDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  blastStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontFamily: 'Lato_400Regular' },
});
