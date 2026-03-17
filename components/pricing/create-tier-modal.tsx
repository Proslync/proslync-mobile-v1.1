// Reusable modal for creating/editing a ticket tier

import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CreateTierRequest, TicketTier } from '@/lib/types/pricing.types';

interface CreateTierModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTierRequest) => void;
  loading?: boolean;
  initialValues?: Partial<TicketTier>;
}

export function CreateTierModal({
  visible,
  onClose,
  onSubmit,
  loading,
  initialValues,
}: CreateTierModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setDescription(initialValues?.description || '');
    }
  }, [visible, initialValues]);

  const isValid = name.trim().length > 0;
  const isEditing = !!initialValues?.id;

  const handleSubmit = () => {
    if (!isValid || loading) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Tier' : 'Add Tier'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={16}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name *</Text>
          <View style={styles.inputWrapper}>
            <GlassView
              {...liquidGlass.fill}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. General Admission, VIP"
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={100}
              autoFocus
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputWrapper, styles.textArea]}>
            <GlassView
              {...liquidGlass.fill}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional tier benefits or details"
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={500}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Tier'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 18, fontFamily: 'Lato_700Bold', color: '#fff' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#fff' },
  form: { padding: 20, gap: 4 },
  label: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
  },
  footer: { padding: 20 },
  submitButton: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
});
