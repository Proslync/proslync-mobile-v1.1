// Text Blast Composer Screen — live preview bubble + bottom input
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { useSendCrossEventBlast } from '@/hooks/use-cross-event-text-blasts';

export default function TextBlastComposeScreen() {
  const { count: countParam } = useLocalSearchParams<{ count?: string }>();
  const recipientCount = countParam ? parseInt(countParam, 10) : 0;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const sendBlast = useSendCrossEventBlast();

  const [message, setMessage] = React.useState('');
  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !sendBlast.isPending;

  const handleSend = () => {
    if (!canSend) return;
    sendBlast.mutate(
      { message: trimmed },
      {
        onSuccess: () => {
          showSuccess(
            `Blast sent to ${recipientCount} ${recipientCount === 1 ? 'recipient' : 'recipients'}`,
          );
          router.back();
        },
        onError: (error) => {
          showError(error.message || 'Failed to send blast');
        },
      },
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Text Blast</Text>
          <Text style={styles.headerSubtitle}>
            To {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.previewContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Live preview bubble */}
          {trimmed.length > 0 ? (
            <View style={styles.bubbleWrapper}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{message}</Text>
              </View>
              <Text style={styles.bubbleLabel}>Preview</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="rgba(0,0,0,0.15)" />
              <Text style={styles.emptyText}>Start typing to see a preview</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Write a message..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              maxLength={1600}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {sendBlast.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  headerSpacer: {
    width: 36,
  },
  previewContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  bubbleWrapper: {
    alignItems: 'flex-start',
    gap: 6,
  },
  bubble: {
    maxWidth: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bubbleText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  bubbleLabel: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#000000',
  },
  inputWrapper: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: '#000',
    padding: 0,
    margin: 0,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
