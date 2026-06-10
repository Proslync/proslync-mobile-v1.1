// ── FanPostComposer ────────────────────────────────────────
// Phase 2 — modal sheet for creating a fan post (or reply). Text
// only for v1 — the media buttons are stubs labeled "Coming soon".
// Visibility is a 3-segment control (public / followers / private).
//
// Reachable from a FAB on the home tab when the fan is authed, and
// from `<FanPostCard />` when tapping the reply icon (in which case
// `parentPostId` is forwarded and we render a "Replying to @handle"
// header).

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fanAuthedApi } from '@/lib/api/fan/authed';
import type { FanPost, FanPostVisibility } from '@/lib/types/fan.types';

const MAX_BODY_LENGTH = 500;
const BG = '#0b0b10';
const BORDER = 'rgba(255,255,255,0.10)';
const ACCENT = '#EB621A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.4)';

const VISIBILITIES: { key: FanPostVisibility; label: string }[] = [
  { key: 'public', label: 'Public' },
  { key: 'followers', label: 'Followers' },
  { key: 'private', label: 'Private' },
];

interface FanPostComposerProps {
  visible: boolean;
  onClose: () => void;
  onPosted: (post: FanPost) => void;
  /** Reply context — when set, body submits as a reply to this post id. */
  parentPostId?: string;
  /** Handle of the user being replied to, for the header label. */
  replyingToHandle?: string;
}

export function FanPostComposer({
  visible,
  onClose,
  onPosted,
  parentPostId,
  replyingToHandle,
}: FanPostComposerProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [body, setBody] = React.useState('');
  const [visibility, setVisibility] = React.useState<FanPostVisibility>('public');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset when the modal opens.
  React.useEffect(() => {
    if (visible) {
      setBody('');
      setVisibility('public');
      setError(null);
      setSubmitting(false);
    }
  }, [visible]);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_BODY_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let post: FanPost | null = null;
      if (parentPostId) {
        post = await fanAuthedApi.replyToPost(parentPostId, trimmed);
      } else {
        post = await fanAuthedApi.createPost({
          body: trimmed,
          visibility,
        });
      }
      if (!post) {
        setError('Could not post. Please try again.');
        setSubmitting(false);
        return;
      }
      onPosted(post);
      onClose();
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>
            {parentPostId ? 'Reply' : 'New post'}
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit || submitting }}
            style={[
              styles.submitButton,
              (!canSubmit || submitting) && styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.submitText}>Post</Text>
            )}
          </Pressable>
        </View>

        {parentPostId && replyingToHandle ? (
          <View style={styles.replyContext}>
            <Ionicons name="return-down-forward" size={14} color={TEXT_TERTIARY} />
            <Text style={styles.replyContextText}>
              Replying to @{replyingToHandle}
            </Text>
          </View>
        ) : null}

        <View style={styles.editorWrap}>
          <TextInput
            style={styles.editor}
            value={body}
            onChangeText={setBody}
            placeholder={parentPostId ? 'Post your reply…' : "What's happening?"}
            placeholderTextColor={TEXT_TERTIARY}
            multiline
            autoFocus
            maxLength={MAX_BODY_LENGTH + 50 /* allow paste over to show counter red */}
            editable={!submitting}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bottomBar}>
          <View style={styles.mediaRow}>
            <Pressable
              style={[styles.mediaButton, styles.mediaButtonDisabled]}
              disabled
              accessibilityLabel="Add photo (coming soon)"
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Ionicons name="image-outline" size={20} color={TEXT_TERTIARY} />
            </Pressable>
            <Pressable
              style={[styles.mediaButton, styles.mediaButtonDisabled]}
              disabled
              accessibilityLabel="Add video (coming soon)"
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Ionicons name="videocam-outline" size={20} color={TEXT_TERTIARY} />
            </Pressable>
            <Text style={styles.comingSoon}>Media coming soon</Text>
          </View>
          <Text
            style={[
              styles.counter,
              trimmed.length > MAX_BODY_LENGTH && styles.counterOverflow,
            ]}
          >
            {trimmed.length}/{MAX_BODY_LENGTH}
          </Text>
        </View>

        {!parentPostId ? (
          <View style={styles.visibilityRow}>
            {VISIBILITIES.map((v) => {
              const active = v.key === visibility;
              return (
                <Pressable
                  key={v.key}
                  style={[
                    styles.visibilityChip,
                    active && styles.visibilityChipActive,
                  ]}
                  onPress={() => setVisibility(v.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.visibilityChipText,
                      active && styles.visibilityChipTextActive,
                    ]}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cancelText: {
    color: TEXT_SECONDARY,
    fontSize: 16,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  replyContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  replyContextText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  editorWrap: {
    flex: 1,
    padding: 16,
  },
  editor: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 17,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    paddingHorizontal: 16,
    fontSize: 13,
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mediaButtonDisabled: {
    opacity: 0.5,
  },
  comingSoon: {
    color: TEXT_TERTIARY,
    fontSize: 11,
    marginLeft: 4,
  },
  counter: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  counterOverflow: {
    color: '#ef4444',
  },
  visibilityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  visibilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  visibilityChipActive: {
    backgroundColor: 'rgba(255,111,60,0.18)',
    borderColor: ACCENT,
  },
  visibilityChipText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  visibilityChipTextActive: {
    color: ACCENT,
  },
});
