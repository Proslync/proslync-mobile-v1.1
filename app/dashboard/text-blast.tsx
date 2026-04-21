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
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  useCrossEventTextBlasts,
  useCrossEventRecipientCount,
} from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TextBlastResponse } from '@/lib/types/text-blast.types';
import { PERSON_VARIABLES, type TemplateVariable } from '@/lib/types/text-blast.types';
import { formatMessageTime } from '@/lib/utils';

export default function DashboardTextBlastScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const flatListRef = useRef<FlatList>(null);

  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  const insertVariable = (variable: TemplateVariable) => {
    const before = message.slice(0, selection.start);
    const after = message.slice(selection.end);
    const newMessage = before + variable.value + after;
    const newCursor = before.length + variable.value.length;
    setMessage(newMessage);
    setSelection({ start: newCursor, end: newCursor });
  };

  const { data: recipientData, isLoading: countLoading } = useCrossEventRecipientCount();
  const { data: blasts = [], isLoading, refetch } = useCrossEventTextBlasts();

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetch(); } });

  const recipientCount = recipientData?.count ?? 0;

  // Sort blasts oldest first (chat style)
  const sortedBlasts = [...blasts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const handleSend = () => {
    if (!message.trim()) return;
    const text = message.trim();
    setMessage('');
    setSelection({ start: 0, end: 0 });
    router.push({
      pathname: '/dashboard/text-blast-confirm',
      params: { message: text },
    });
  };

  const renderBlastBubble = ({ item }: { item: TextBlastResponse }) => (
    <View style={styles.bubbleRow}>
      <View style={styles.bubbleWrapper}>
        <View style={[styles.messageBubble, { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}>
          {isDark && <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />}
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
        <View style={styles.bubbleMeta}>
          <View style={styles.audienceBadge}>
            <Text style={styles.audienceBadgeText}>All Contacts</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatMessageTime(item.createdAt)}
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
            SMS to all your contacts
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
            refreshControl={refreshControl}
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
                  Send your first blast to all your contacts
                </Text>
              </View>
            }
          />
        )}

        {/* Composer */}
        <View style={[styles.composerContainer, { paddingBottom: insets.bottom + 8 }]}>
          {/* Recipient Count Pill */}
          <View style={styles.audiencePill}>
            <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.6)" />
            {countLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
            ) : (
              <Text style={styles.audiencePillText}>
                All Contacts ({recipientCount})
              </Text>
            )}
          </View>

          {/* Template Variable Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.variableChipsRow}
            keyboardShouldPersistTaps="always"
          >
            {PERSON_VARIABLES.map((v) => (
              <TouchableOpacity
                key={v.value}
                style={styles.variableChip}
                onPress={() => insertVariable(v)}
                activeOpacity={0.7}
              >
                <Text style={styles.variableChipText}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { borderColor: colors.border, overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(255,255,255,0.06)' }]}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={22} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textTertiary}
                value={message}
                onChangeText={setMessage}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                selection={selection}
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
                { backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' },
                !message.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim()}
              activeOpacity={0.7}
            >
              {isDark && <GlassView {...liquidGlass.fillMedium} borderRadius={20} style={StyleSheet.absoluteFill} />}
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: { fontSize: 17, },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Message list
  messagesList: { padding: 16, paddingBottom: 8 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptySection: { alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, },
  emptySubtext: { fontSize: 13, },

  // Message bubble
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
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 15,
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
    color: 'rgba(255,255,255,0.5)',
  },
  timeText: {
    fontSize: 11,
  },
  statText: {
    fontSize: 11,
  },

  // Composer
  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    paddingHorizontal: 12,
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
    color: 'rgba(255,255,255,0.6)',
  },
  variableChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  variableChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  variableChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
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
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  charCount: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
