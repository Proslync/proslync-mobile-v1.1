// FanAssistant — floating chat panel that collapses to a FAB bubble.
// No gorhom BottomSheet — plain Views; the panel lifts itself above the keyboard.
// Panel: absolute position left:16 right:16 bottom:110, zIndex 160.
// FAB:   absolute position left:20 bottom:110, 52px circle, zIndex 150.
// Only the ✕ closes the panel; tapping outside has no effect (no scrim).

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

  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fanAssistant, FAN_SUGGESTIONS, type AgentChunk } from '@/lib/api/fan-assistant';

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function MarkdownInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontWeight: '700', color: '#FFF' }}>
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
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <View key={i} style={{ flexDirection: 'row', paddingLeft: 4, paddingVertical: 1 }}>
              <Text style={{ color: '#EB621A', fontSize: 15, lineHeight: 22, width: 16 }}>
                {'•'}
              </Text>
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.9)' }}>
                <MarkdownInline text={trimmed.replace(/^[-*]\s+/, '')} />
              </Text>
            </View>
          );
        }
        if (line.trim().length === 0) {
          return <View key={i} style={{ height: 8 }} />;
        }
        return (
          <Text key={i} style={{ fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.9)' }}>
            <MarkdownInline text={line} />
          </Text>
        );
      })}
    </View>
  );
}

// ─── Panel height ─────────────────────────────────────────────────────────────

const SCREEN_H = Dimensions.get('window').height;
const PANEL_HEIGHT = Math.min(480, Math.round(SCREEN_H * 0.62));

// ─── Main component ───────────────────────────────────────────────────────────

export function FanAssistant() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [response, setResponse] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  // Track the keyboard directly — KeyboardAvoidingView is unreliable for
  // absolutely-positioned panels, so we lift the panel above the keyboard
  // ourselves and shrink it if vertical space runs out.
  const [kbHeight, setKbHeight] = React.useState(0);
  React.useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const panelBottom = kbHeight > 0 ? kbHeight + 12 : 110;
  const panelHeight = Math.min(PANEL_HEIGHT, SCREEN_H - panelBottom - 76);

  const handleOpen = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen(true);
  }, []);

  const handleClose = React.useCallback(() => {
    abortRef.current?.abort();
    Keyboard.dismiss();
    setOpen(false);
  }, []);

  const handleAsk = React.useCallback(async (prompt: string) => {
    if (!prompt.trim() || streaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResponse('');
    setStreaming(true);
    setInput('');
    Keyboard.dismiss();

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    await fanAssistant.ask(
      prompt,
      (chunk: AgentChunk) => {
        if (chunk.type === 'token' && chunk.text) {
          accumulated += chunk.text;
          setResponse(accumulated);
        } else if (chunk.type === 'error') {
          setResponse(chunk.text ?? 'Something went wrong.');
        }
      },
      controller.signal,
    );

    setStreaming(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [streaming]);

  return (
    <>
      {/* FAB — hidden while panel is open */}
      {!open && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={handleOpen}
          accessibilityLabel="Ask Proslync"
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EB621A" />
        </Pressable>
      )}

      {/* Floating panel — only mounted while open; lifts with the keyboard */}
      {open && (
        <View style={styles.kavWrapper} pointerEvents="box-none">
          <View style={[styles.panel, { bottom: panelBottom }]} pointerEvents="box-none">
            <View style={[styles.panelInner, { height: panelHeight }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#EB621A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>Proslync Assistant</Text>
                  <Text style={styles.headerSubtitle}>Answers for fans</Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  style={styles.closeBtn}
                  hitSlop={8}
                  accessibilityLabel="Close assistant"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.55)" />
                </Pressable>
              </View>

              {/* Suggestion chips — shown when thread is empty */}
              {!response && !streaming && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsLabel}>Try asking...</Text>
                  <View style={styles.suggestionsGrid}>
                    {FAN_SUGGESTIONS.map((s) => (
                      <Pressable
                        key={s}
                        style={({ pressed }) => [
                          styles.chip,
                          pressed && styles.chipPressed,
                        ]}
                        onPress={() => handleAsk(s)}
                      >
                        <Text style={styles.chipText}>{s}</Text>
                        <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.5)" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Response area */}
              {(response || streaming) && (
                <ScrollView
                  ref={scrollRef}
                  style={styles.responseScroll}
                  contentContainerStyle={styles.responseContent}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                  <MarkdownText text={response} />
                  {streaming && (
                    <Text style={[styles.responseText, styles.cursor]}>|</Text>
                  )}
                </ScrollView>
              )}

              {/* Input row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask about NIL, merch, supporting athletes..."
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
            </View>
          </View>
        </View>
      )}
    </>
  );
}

// Legacy alias — keeps any other imports from breaking.
export const FanAssistantSheet = FanAssistant;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // FAB bubble
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 110,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(26,26,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },

  // KeyboardAvoidingView: full-screen, pointer-events box-none so touches
  // fall through where no panel exists.
  kavWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 160,
  },

  // Outer positioning container — sits at bottom, passes pointer-events through.
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
  },

  // The visible card
  panelInner: {
    height: PANEL_HEIGHT,
    borderRadius: 20,
    backgroundColor: 'rgba(16,16,16,0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(235,98,26,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Suggestion chips
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  suggestionsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
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
  chipPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },

  // Response scroll area
  responseScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  responseContent: {
    paddingTop: 12,
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

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
});
