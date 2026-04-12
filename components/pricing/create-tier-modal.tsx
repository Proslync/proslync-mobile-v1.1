// Modal for creating/editing a ticket tier with initial pricing

import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CreateTierRequest, TicketTier } from '@/lib/types/pricing.types';

interface CreateTierModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTierRequest & {
    price?: number;
    capacity?: number | null;
    availableFrom?: string;
    availableUntil?: string;
  }) => void;
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [capacity, setCapacity] = useState('');
  const [hasSalePeriod, setHasSalePeriod] = useState(false);
  const [hasValidityPeriod, setHasValidityPeriod] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setDescription(initialValues?.description || '');
      setIsFree(false);
      setPrice('');
      setIsUnlimited(true);
      setCapacity('');
      setHasSalePeriod(false);
      setHasValidityPeriod(false);
    }
  }, [visible, initialValues]);

  const isValid = name.trim().length > 0;
  const isEditing = !!initialValues?.id;

  const handleSubmit = () => {
    if (!isValid || loading) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price: isFree ? 0 : parseFloat(price) || 0,
      capacity: isUnlimited ? null : (parseInt(capacity, 10) || null),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isEditing ? 'Edit Ticket' : 'Create a new ticket'}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            <Text style={[s.doneText, (!isValid || loading) && s.doneTextDisabled]}>
              {loading ? 'Saving...' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Name + Quantity row */}
          <View style={s.row}>
            <View style={[s.inputCell, { flex: 2 }]}>
              <TextInput
                style={s.cellInput}
                value={name}
                onChangeText={setName}
                placeholder="Ticket Name *"
                placeholderTextColor="rgba(0,0,0,0.35)"
                maxLength={100}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={s.inputCell}
              onPress={() => setIsUnlimited(!isUnlimited)}
              activeOpacity={0.7}
            >
              {isUnlimited ? (
                <Text style={s.cellLabel}>Qty Unlimited</Text>
              ) : (
                <TextInput
                  style={s.cellInput}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Qty"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  keyboardType="number-pad"
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Free ticket toggle */}
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Make this a free ticket</Text>
            </View>
            <Switch value={isFree} onValueChange={setIsFree} />
          </View>
          {isFree && (
            <Text style={s.toggleHint}>This ticket is free - customers will not be charged.</Text>
          )}

          {/* Price (only when not free) */}
          {!isFree && (
            <View style={s.inputCell}>
              <TextInput
                style={s.cellInput}
                value={price}
                onChangeText={setPrice}
                placeholder="Price ($)"
                placeholderTextColor="rgba(0,0,0,0.35)"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Sale Period toggle */}
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Specify Sale Period</Text>
              <Ionicons name="information-circle-outline" size={16} color="rgba(0,0,0,0.3)" />
            </View>
            <Switch value={hasSalePeriod} onValueChange={setHasSalePeriod} />
          </View>
          {hasSalePeriod && (
            <Text style={s.toggleHint}>Set when tickets go on sale and when sales end.</Text>
          )}

          {/* Validity Period toggle */}
          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Text style={s.toggleLabel}>Specify Validity Period</Text>
              <Ionicons name="information-circle-outline" size={16} color="rgba(0,0,0,0.3)" />
            </View>
            <Switch value={hasValidityPeriod} onValueChange={setHasValidityPeriod} />
          </View>
          {hasValidityPeriod && (
            <Text style={s.toggleHint}>Set when this ticket is valid for entry.</Text>
          )}

          {/* Description */}
          <View style={[s.inputCell, s.descriptionCell]}>
            <TextInput
              style={[s.cellInput, { minHeight: 100, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description for your ticket"
              placeholderTextColor="rgba(0,0,0,0.35)"
              maxLength={500}
              multiline
            />
          </View>

          {/* Extra options (placeholder rows) */}
          <View style={s.optionsSection}>
            <TouchableOpacity style={s.optionRow} activeOpacity={0.7}>
              <Text style={s.optionText}>Ticket Options</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
            <TouchableOpacity style={s.optionRow} activeOpacity={0.7}>
              <Text style={s.optionText}>Ticket Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.optionRow, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
              <Text style={s.optionText}>Ticket Channels</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitle: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#000' },
  cancelText: { fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000' },
  doneText: { fontSize: 15, fontFamily: 'Lato_700Bold', color: 'rgba(0,0,0,0.4)' },
  doneTextDisabled: { opacity: 0.3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  row: { flexDirection: 'row', gap: 10 },
  inputCell: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  cellInput: { fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000', padding: 0 },
  cellLabel: { fontSize: 14, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.5)' },
  descriptionCell: { minHeight: 120 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  toggleLabel: { fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000' },
  toggleHint: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(0,0,0,0.45)', marginTop: -4 },

  optionsSection: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  optionText: { fontSize: 15, fontFamily: 'Lato_400Regular', color: '#000' },
});
