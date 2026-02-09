// Reaction Sheet - Bottom sheet for message reactions and actions

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

interface ReactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  canDelete?: boolean;
  messageText?: string;
}

export function ReactionSheet({
  visible,
  onClose,
  onReaction,
  onReply,
  onCopy,
  onDelete,
  onReport,
  canDelete = false,
  messageText,
}: ReactionSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[
          styles.container,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: isDark ? '#1c1c1e' : colors.card,
          }
        ]}>
          {/* Reactions Row */}
          <View style={[styles.reactionsRow, { borderBottomColor: colors.border }]}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                ]}
                onPress={() => {
                  onReaction(emoji);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {onReply && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onReply();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-undo" size={20} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
              </TouchableOpacity>
            )}

            {onCopy && messageText && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onCopy();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Copy</Text>
              </TouchableOpacity>
            )}

            {canDelete && onDelete && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onDelete();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}

            {onReport && !canDelete && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onReport();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="flag-outline" size={20} color="#ff3b30" />
                <Text style={[styles.actionText, styles.deleteText]}>Report</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actionsContainer: {
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  actionText: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
  },
  deleteText: {
    color: '#ff3b30',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#0095f6',
  },
});
