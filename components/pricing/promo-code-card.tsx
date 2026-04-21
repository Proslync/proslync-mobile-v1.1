// Reusable promo code display card

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { GlassSurface } from '@/components/glass/glass-surface';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { PromoCode } from '@/lib/types/pricing.types';
import { formatShortDate } from '@/lib/utils';

interface PromoCodeCardProps {
  promoCode: PromoCode;
  readOnly?: boolean;
  onToggleActive: (promoId: number) => void;
  onEdit: (promoCode: PromoCode) => void;
  onDelete: (promoId: number) => void;
}

function formatDiscount(code: PromoCode): string {
  if (code.discountType === 'percentage') return `${code.discountValue}% off`;
  return `$${code.discountValue.toFixed(2)} off`;
}

export function PromoCodeCard({ promoCode, readOnly, onToggleActive, onEdit, onDelete }: PromoCodeCardProps) {
  const { colors } = useAppTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const usageText = promoCode.maxUses
    ? `${promoCode.usedCount} / ${promoCode.maxUses} used`
    : `${promoCode.usedCount} used`;

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.codeInfo}>
          <Text style={[styles.code, { color: colors.text }]}>{promoCode.code}</Text>
          <Text style={[styles.discount, { color: colors.textSecondary }]}>
            {formatDiscount(promoCode)}
          </Text>
        </View>
        {!readOnly && (
          <Switch
            value={promoCode.isActive}
            onValueChange={() => onToggleActive(promoCode.id)}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(34,197,94,0.5)' }}
            thumbColor="#fff"
          />
        )}
      </View>

      <View style={styles.detailsRow}>
        <Text style={[styles.detailText, { color: colors.textTertiary }]}>{usageText}</Text>
        <Text style={[styles.detailText, { color: colors.textTertiary }]}>
          From {formatShortDate(promoCode.validFrom)}
          {promoCode.validUntil ? ` to ${formatShortDate(promoCode.validUntil)}` : ''}
        </Text>
      </View>

      {!readOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(promoCode)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      <ConfirmSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(promoCode.id); }}
        title="Delete Promo Code"
        message={`Delete "${promoCode.code}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeInfo: {
    flex: 1,
    marginRight: 12,
  },
  code: {
    fontSize: 16,
    letterSpacing: 1,
  },
  discount: {
    fontSize: 13,
    marginTop: 2,
  },
  detailsRow: {
    marginTop: 10,
    gap: 2,
  },
  detailText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
  },
});
