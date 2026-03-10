import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  useTextBlasts,
  useRecipientCount,
  useEventPermissions,
} from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TextBlastAudience, TextBlastResponse } from '@/lib/types/text-blast.types';

const AUDIENCES: { key: TextBlastAudience; label: string }[] = [
  { key: 'all', label: 'All Guests' },
  { key: 'checked_in', label: 'Checked In' },
  { key: 'verified', label: 'Verified' },
  { key: 'pending', label: 'Pending' },
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
  const flatListRef = useRef<FlatList>(null);

  const eventId = id ? Number(id) : 0;
  const { canSendMarketing, canViewMarketing } = useEventPermissions(eventId || undefined);

  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<TextBlastAudience>('all');
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);

  const { data: recipientData, error: recipientError } = useRecipientCount(eventId, audience);
  const { data: blasts = [], isLoading } = useTextBlasts(eventId);

  const recipientCount = recipientData?.count ?? 0;

  // Debug: log recipient count errors
  if (recipientError) {
    console.warn('Text blast recipient count error:', recipientError);
  }

  // Sort blasts oldest first (chat style)
  const sortedBlasts = [...blasts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const handleSend = () => {
    if (!message.trim()) return;
    router.push({
      pathname: '/manage-event/[id]/text-blast-audience',
      params: { id: String(eventId), message: message.trim() },
    });
  };

  const renderBlastBubble = ({ item }: { item: TextBlastResponse }) => (
    <View style={styles.bubbleRow}>
      <View style={styles.bubbleWrapper}>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
        <View style={styles.bubbleMeta}>
          <View style={styles.audienceBadge}>
            <Text style={styles.audienceBadgeText}>{audienceLabel(item.audienceFilter)}</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatTime(item.createdAt)}
          </Text>
          {item.recipientCount > 0 && (
            <Text style={[styles.statText, { color: colors.textTertiary }]}>
              {item.recipientCount} sent
            </Text>
          )}
          {item.deliveredCount != null && item.deliveredCount > 0 && (
            <Text style={[styles.statText, { color: '#22c55e' }]}>
              {item.deliveredCount} delivered
            </Text>
          )}
          {item.failedCount != null && item.failedCount > 0 && (
            <Text style={[styles.statText, { color: '#ef4444' }]}>
              {item.failedCount} failed
            </Text>
          )}
        </View>
      </View>
    </View>
  );

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Text Blast</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            SMS to event guests
          </Text>
        </View>
        <View style={styles.headerButton} />
      </Animated.View>

      {/* Message List */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={sortedBlasts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderBlastBubble}
            contentContainerStyle={
              sortedBlasts.length === 0 ? styles.emptyList : styles.messagesList
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptySection}>
                <Ionicons name="chatbubble-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No messages yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Send your first blast to event guests
                </Text>
              </View>
            }
          />
        )}

        {/* Composer */}
        {canSendMarketing() && (
          <View style={[styles.composerContainer, { paddingBottom: insets.bottom + 8 }]}>
            {/* Audience Selector */}
            {showAudiencePicker && (
              <View style={styles.audiencePickerRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.audienceChipRow}
                >
                  {AUDIENCES.map((a) => {
                    const isSelected = audience === a.key;
                    return (
                      <TouchableOpacity
                        key={a.key}
                        onPress={() => {
                          setAudience(a.key);
                          setShowAudiencePicker(false);
                        }}
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
              </View>
            )}

            {/* Audience Pill + Composer Row */}
            <TouchableOpacity
              style={styles.audiencePill}
              onPress={() => setShowAudiencePicker(!showAudiencePicker)}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.audiencePillText}>
                {audienceLabel(audience)} ({recipientCount})
              </Text>
              <Ionicons
                name={showAudiencePicker ? 'chevron-down' : 'chevron-up'}
                size={14}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Type your message..."
                  placeholderTextColor={colors.textTertiary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={1600}
                />
                {message.length > 0 && (
                  <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                    {message.length}/1600
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!message.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Lato_700Bold' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Lato_400Regular', marginTop: 1 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Message list
  messagesList: { padding: 16, paddingBottom: 8 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptySection: { alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  emptySubtext: { fontSize: 13, fontFamily: 'Lato_400Regular' },

  // Message bubble (right-aligned like own messages)
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  bubbleWrapper: {
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    lineHeight: 21,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  audienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  audienceBadgeText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  statText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },

  // Composer
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  audiencePickerRow: {
    marginBottom: 8,
  },
  audienceChipRow: { gap: 8 },
  audienceChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  audienceChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  audienceChipText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  audienceChipTextSelected: {
    color: '#fff',
  },
  audiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  audiencePillText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 120,
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  charCount: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
    textAlign: 'right',
    marginTop: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
