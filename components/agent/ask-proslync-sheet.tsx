import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { renderBackdrop } from '@/components/shared/bottom-sheet-backdrop';
import { agentAssistant, type AgentChunk } from '@/lib/api/agent-assistant';

interface AskProslyncSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Tiny markdown renderer for the assistant response. Handles **bold**,
// blank-line paragraphs, and `- item` bullets — the only patterns the
// agent-assistant streams today. Kept inline to avoid pulling in a full
// markdown dependency for a single sheet.
function MarkdownInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={{ fontWeight: "700", color: "#FFF" }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </>
  );
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <View key={i} style={{ flexDirection: "row", paddingLeft: 4, paddingVertical: 1 }}>
              <Text style={{ color: "#EB621A", fontSize: 15, lineHeight: 22, width: 16 }}>
                {"•"}
              </Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.9)" }}>
                <MarkdownInline text={trimmed.replace(/^[-*]\s+/, "")} />
              </Text>
            </View>
          );
        }
        if (line.trim().length === 0) {
          return <View key={i} style={{ height: 8 }} />;
        }
        return (
          <Text key={i} style={{ fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.9)" }}>
            <MarkdownInline text={line} />
          </Text>
        );
      })}
    </View>
  );
}

export function AskProslyncSheet({ visible, onClose }: AskProslyncSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [input, setInput] = React.useState('');
  const [response, setResponse] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const snapPoints = React.useMemo(() => ['50%', '90%'], []);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = React.useCallback(() => {
    abortRef.current?.abort();
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleAsk = React.useCallback(async (prompt: string) => {
    if (!prompt.trim() || streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResponse('');
    setStreaming(true);
    setInput('');
    Keyboard.dismiss();

    bottomSheetRef.current?.snapToIndex(1);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    await agentAssistant.ask(
      prompt,
      (chunk: AgentChunk) => {
        if (chunk.type === 'token' && chunk.text) {
          accumulated += chunk.text;
          setResponse(accumulated);
        } else if (chunk.type === 'error') {
          setResponse(chunk.text || 'Something went wrong.');
        }
      },
      controller.signal,
    );

    setStreaming(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [streaming]);

  const presets = agentAssistant.presetPrompts;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
      style={styles.sheet}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <GlassView
          {...liquidGlass.fillFaint}
          borderRadius={0}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color="#EB621A" />
          </View>
          <Text style={styles.headerTitle}>Ask Proslync</Text>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        {!response && !streaming && (
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsLabel}>Try asking about...</Text>
            <View style={styles.presetsGrid}>
              {presets.map((p) => (
                <Pressable
                  key={p.key}
                  style={({ pressed }) => [
                    styles.presetChip,
                    pressed && styles.presetChipPressed,
                  ]}
                  onPress={() => handleAsk(p.key)}
                >
                  <Text style={styles.presetText}>{p.label}</Text>
                  <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.5)" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {(response || streaming) && (
          <ScrollView
            ref={scrollRef}
            style={styles.responseScroll}
            contentContainerStyle={styles.responseContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <MarkdownText text={response} />
            {streaming && <Text style={[styles.responseText, styles.cursor]}>|</Text>}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything about NIL, deals, athletes..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleAsk(input)}
            returnKeyType="send"
            editable={!streaming}
            autoCapitalize="sentences"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            keyboardAppearance="dark"
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
            onPress={() => handleAsk(input)}
            disabled={!input.trim() || streaming}
          >
            {streaming ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

export function AskProslyncFAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Ask Proslync AI"
    >
      <GlassView
        glassEffectStyle="regular"
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />
      <Ionicons name="sparkles" size={22} color="#EB621A" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    zIndex: 999,
  },
  background: {
    backgroundColor: '#1A1A1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 36,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(235,98,26,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  presetsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  presetText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  responseScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  responseContent: {
    paddingBottom: 16,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  cursor: {
    color: '#EB621A',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#FFF',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EB621A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(235,98,26,0.3)',
    zIndex: 100,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
});
