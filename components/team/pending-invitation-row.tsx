import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { InvitationResponseDto } from '@/lib/types/team.types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatTimeAgo } from '@/lib/utils/date';

interface PendingInvitationRowProps {
  invitation: InvitationResponseDto;
  roleName?: string;
  onCancel?: (invitationId: number) => void;
}

export function PendingInvitationRow({
  invitation,
  roleName,
  onCancel,
}: PendingInvitationRowProps) {
  const { colors } = useAppTheme();

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.row}>
      <View style={styles.iconContainer}>
        <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.roleLabel, { color: colors.text }]} numberOfLines={1}>
          Role: {roleName || 'Unknown'}
        </Text>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          Sent {formatTimeAgo(invitation.createdAt)}
        </Text>
      </View>
      {onCancel && (
        <TouchableOpacity
          onPress={() => onCancel(invitation.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
  },
  timeText: {
    fontSize: 13,
    marginTop: 1,
  },
});
