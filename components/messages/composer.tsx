// Composer - Message input bar with actions

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { ActionSheet, type ActionSheetOption } from '@/components/shared/action-sheet';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ComposerProps {
  onSend: (text: string) => void;
  onAttachmentPress?: () => void;
  placeholder?: string;
}

export function Composer({
  onSend,
  onAttachmentPress,
  placeholder = 'Message',
}: ComposerProps) {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showVoiceAlert, setShowVoiceAlert] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      setInputHeight(36);
    }
  };

  const handleAttachment = () => {
    setShowAttachMenu(true);
  };

  const attachmentItems: ActionSheetOption[] = [
    { label: 'Camera', icon: 'camera-outline', onPress: () => {} },
    { label: 'Photo Library', icon: 'images-outline', onPress: () => {} },
    { label: 'Share Event', icon: 'calendar-outline', onPress: () => {} },
    { label: 'Contact', icon: 'person-outline', onPress: () => {} },
    { label: 'Location', icon: 'location-outline', onPress: () => {} },
  ];

  const handleContentSizeChange = (event: any) => {
    const height = Math.min(Math.max(36, event.nativeEvent.contentSize.height), 120);
    setInputHeight(height);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background }]}>
      <ActionSheet
        visible={showAttachMenu}
        onClose={() => setShowAttachMenu(false)}
        options={attachmentItems}
      />
      <ConfirmModal
        visible={showVoiceAlert}
        onClose={() => setShowVoiceAlert(false)}
        title="Voice Message"
        message="Coming soon!"
        alertOnly
        icon="mic-outline"
      />
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={[styles.inputContainer, { minHeight: inputHeight + 8, overflow: 'hidden' }]}>
          <GlassView {...liquidGlass.fill} borderRadius={20} style={StyleSheet.absoluteFillObject} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { height: inputHeight }]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            maxLength={2000}
            onContentSizeChange={handleContentSizeChange}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>

        {text.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => setShowVoiceAlert(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
