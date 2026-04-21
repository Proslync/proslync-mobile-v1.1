// Create Channel Screen
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { useCreateChannel } from '@/hooks/use-channel-mutations';
import type { ChannelVisibility } from '@/lib/api/channels';

export default function CreateChannelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const createChannel = useCreateChannel();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [visibility, setVisibility] = React.useState<ChannelVisibility>('public');

  const handleSubmit = () => {
    if (!name.trim()) {
      showError('Channel name is required');
      return;
    }

    createChannel.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      },
      {
        onSuccess: (channel) => {
          showSuccess('Channel created!');
          // Navigate back to messages tab on the Channels view
          router.replace('/(tabs)/explore?tab=channels' as any);
        },
        onError: (error) => {
          showError(error.message || 'Failed to create channel');
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
        <Text style={styles.headerTitle}>New Channel</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Channel name"
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoFocus
              maxLength={100}
            />
          </View>

          {/* Description */}
          <Text style={[styles.label, { marginTop: 20 }]}>Description</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this channel about? (optional)"
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* Visibility */}
          <Text style={[styles.label, { marginTop: 20 }]}>Visibility</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[styles.visibilityCard, visibility === 'public' && styles.visibilityCardActive]}
              onPress={() => setVisibility('public')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={visibility === 'public' ? '#000' : 'rgba(0,0,0,0.5)'}
              />
              <Text style={[styles.visibilityTitle, visibility === 'public' && styles.visibilityTitleActive]}>
                Public
              </Text>
              <Text style={styles.visibilityDescription}>Anyone can find and join</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.visibilityCard, visibility === 'private' && styles.visibilityCardActive]}
              onPress={() => setVisibility('private')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={visibility === 'private' ? '#000' : 'rgba(0,0,0,0.5)'}
              />
              <Text style={[styles.visibilityTitle, visibility === 'private' && styles.visibilityTitleActive]}>
                Private
              </Text>
              <Text style={styles.visibilityDescription}>Only invited members</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, !name.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createChannel.isPending || !name.trim()}
            activeOpacity={0.85}
          >
            {createChannel.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Channel</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  inputWrapperMultiline: {
    height: 100,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: '#000',
  },
  inputMultiline: {
    height: '100%',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
    gap: 6,
  },
  visibilityCardActive: {
    borderColor: '#000',
    borderWidth: 2,
  },
  visibilityTitle: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
  },
  visibilityTitleActive: {
    color: '#000',
  },
  visibilityDescription: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
  },
  submitButton: {
    marginTop: 32,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 16,
    color: '#fff',
  },
});
