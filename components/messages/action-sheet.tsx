// Action Sheet - Long press actions for conversations

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Conversation } from '../../lib/types/messages.types';

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ActionSheet({
  visible,
  onClose,
  conversation,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  if (!conversation) return null;

  const actions = [
    {
      icon: conversation.isPinned ? 'pin-outline' : 'pin',
      label: conversation.isPinned ? 'Unpin' : 'Pin',
      onPress: onPin,
      color: colors.text,
    },
    {
      icon: conversation.isMuted ? 'notifications' : 'notifications-off',
      label: conversation.isMuted ? 'Unmute' : 'Mute',
      onPress: onMute,
      color: colors.text,
    },
    {
      icon: 'archive',
      label: 'Archive',
      onPress: onArchive,
      color: colors.text,
    },
    {
      icon: 'trash',
      label: 'Delete',
      onPress: onDelete,
      color: '#ff3b30',
    },
  ];

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
          {/* Conversation Preview */}
          <View style={[styles.preview, { borderBottomColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
              {conversation.title}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.actionRow,
                  { borderBottomColor: colors.border },
                  index === actions.length - 1 && styles.actionRowLast,
                ]}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={action.icon as any}
                  size={22}
                  color={action.color}
                />
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    paddingTop: 8,
  },
  preview: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
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
    borderBottomWidth: 1,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
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
