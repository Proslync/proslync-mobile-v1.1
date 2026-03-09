// Reusable modal for creating/editing a pricing rule within a tier

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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CreatePricingRuleRequest, PricingRule } from '@/lib/types/pricing.types';

interface CreatePricingRuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePricingRuleRequest) => void;
  loading?: boolean;
  initialValues?: Partial<PricingRule>;
}

export function CreatePricingRuleModal({
  visible,
  onClose,
  onSubmit,
  loading,
  initialValues,
}: CreatePricingRuleModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setPrice(initialValues?.price != null ? String(initialValues.price) : '');
      setCapacity(initialValues?.capacity != null ? String(initialValues.capacity) : '');
    }
  }, [visible, initialValues]);

  const parsedPrice = parseFloat(price);
  const isValid = name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice >= 0;
  const isEditing = !!initialValues?.id;

  const handleSubmit = () => {
    if (!isValid || loading) return;
    const parsedCapacity = parseInt(capacity, 10);
    onSubmit({
      name: name.trim(),
      price: parsedPrice,
      currency: 'USD',
      capacity: !isNaN(parsedCapacity) && parsedCapacity >= 1 ? parsedCapacity : undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Pricing' : 'Add Pricing'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Early Bird, Regular, Last Minute"
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={100}
            autoFocus
          />

          <Text style={styles.label}>Price (USD) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            placeholder="Unlimited (leave empty)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Pricing'}
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#fff' },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  footer: { padding: 20 },
  submitButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
});
