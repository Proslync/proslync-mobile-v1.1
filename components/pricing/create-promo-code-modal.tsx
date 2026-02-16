// Reusable modal for creating/editing a promo code

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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CreatePromoCodeRequest, PromoCode } from '@/lib/types/pricing.types';

interface CreatePromoCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePromoCodeRequest) => void;
  loading?: boolean;
  initialValues?: Partial<PromoCode>;
}

export function CreatePromoCodeModal({
  visible,
  onClose,
  onSubmit,
  loading,
  initialValues,
}: CreatePromoCodeModalProps) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (visible) {
      setCode(initialValues?.code || '');
      setDiscountType(initialValues?.discountType || 'percentage');
      setDiscountValue(initialValues?.discountValue != null ? String(initialValues.discountValue) : '');
      setMaxUses(initialValues?.maxUses != null ? String(initialValues.maxUses) : '');
      setIsActive(initialValues?.isActive ?? true);
    }
  }, [visible, initialValues]);

  const parsedValue = parseFloat(discountValue);
  const isValid =
    code.trim().length > 0 &&
    !isNaN(parsedValue) &&
    parsedValue > 0 &&
    (discountType !== 'percentage' || parsedValue <= 100);
  const isEditing = !!initialValues?.id;

  const handleSubmit = () => {
    if (!isValid || loading) return;
    const parsedMaxUses = parseInt(maxUses, 10);
    onSubmit({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: parsedValue,
      maxUses: !isNaN(parsedMaxUses) && parsedMaxUses >= 1 ? parsedMaxUses : null,
      validFrom: new Date().toISOString(),
      isActive,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Promo Code' : 'Add Promo Code'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Code *</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. EARLYBIRD2025"
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={50}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />

          <Text style={styles.label}>Discount Type *</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeOption, discountType === 'percentage' && styles.typeOptionActive]}
              onPress={() => setDiscountType('percentage')}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeText, discountType === 'percentage' && styles.typeTextActive]}>
                Percentage (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, discountType === 'fixed' && styles.typeOptionActive]}
              onPress={() => setDiscountType('fixed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeText, discountType === 'fixed' && styles.typeTextActive]}>
                Fixed ($)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Discount Value * {discountType === 'percentage' ? '(0-100)' : '(USD)'}
          </Text>
          <TextInput
            style={styles.input}
            value={discountValue}
            onChangeText={setDiscountValue}
            placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 10.00'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Max Uses</Text>
          <TextInput
            style={styles.input}
            value={maxUses}
            onChangeText={setMaxUses}
            placeholder="Unlimited (leave empty)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,255,255,0.4)' }}
              thumbColor="#fff"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Promo Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
  codeInput: {
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
  },
  typeTextActive: {
    color: '#fff',
    fontFamily: 'Lato_700Bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
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
