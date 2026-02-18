import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { InvitationResponseDto } from '@/lib/types/team.types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PendingInvitationRowProps {
  invitation: InvitationResponseDto;
  roleName?: string;
  onCancel: (invitationId: number) => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
      <TouchableOpacity
        onPress={() => onCancel(invitation.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
      </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
});
