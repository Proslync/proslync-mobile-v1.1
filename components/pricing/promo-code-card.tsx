// Reusable promo code display card

import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { GlassSurface } from '@/components/glass/glass-surface';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { PromoCode } from '@/lib/types/pricing.types';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PromoCodeCard({ promoCode, readOnly, onToggleActive, onEdit, onDelete }: PromoCodeCardProps) {
  const { colors } = useAppTheme();

  const handleDelete = () => {
    Alert.alert('Delete Promo Code', `Delete "${promoCode.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(promoCode.id) },
    ]);
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
          From {formatDate(promoCode.validFrom)}
          {promoCode.validUntil ? ` to ${formatDate(promoCode.validUntil)}` : ''}
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
    fontFamily: 'Lato_700Bold',
    letterSpacing: 1,
  },
  discount: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  detailsRow: {
    marginTop: 10,
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
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
    fontFamily: 'Lato_400Regular',
  },
});
