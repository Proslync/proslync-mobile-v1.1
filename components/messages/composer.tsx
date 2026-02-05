// Composer - Message input bar with actions

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      setInputHeight(36);
    }
  };

  const handleAttachment = () => {
    Alert.alert(
      'Attach',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => {} },
        { text: 'Photo Library', onPress: () => {} },
        { text: 'Share Event', onPress: () => {} },
        { text: 'Contact', onPress: () => {} },
        { text: 'Location', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleContentSizeChange = (event: any) => {
    const height = Math.min(Math.max(36, event.nativeEvent.contentSize.height), 120);
    setInputHeight(height);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={28} color="#0095f6" />
        </TouchableOpacity>

        <View style={[styles.inputContainer, { minHeight: inputHeight + 8 }]}>
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
            <Ionicons name="send" size={24} color="#0095f6" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => Alert.alert('Voice message', 'Coming soon!')}
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
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
