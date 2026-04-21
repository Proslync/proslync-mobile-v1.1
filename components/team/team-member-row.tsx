import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TeamMemberResponseDto } from '@/lib/types/team.types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface TeamMemberRowProps {
  member: TeamMemberResponseDto;
  isOwner?: boolean;
  onChangeRole?: (member: TeamMemberResponseDto) => void;
  onRemove?: (member: TeamMemberResponseDto) => void;
}

function getInitials(member: TeamMemberResponseDto): string {
  const first = member.user.firstName?.[0] || '';
  const last = member.user.lastName?.[0] || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return '?';
}

function getDisplayName(member: TeamMemberResponseDto): string {
  const { firstName, lastName } = member.user;
  if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
  return member.user.userName || 'Team Member';
}

export function TeamMemberRow({ member, isOwner, onChangeRole, onRemove }: TeamMemberRowProps) {
  const { colors } = useAppTheme();
  const avatarUri = member.user.avatar;
  const name = getDisplayName(member);
  const subtext = member.user.userName ? `@${member.user.userName}` : '';

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.row}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.avatarInitials}>{getInitials(member)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
        {subtext ? (
          <Text style={[styles.subtext, { color: colors.textTertiary }]} numberOfLines={1}>
            {subtext}
          </Text>
        ) : null}
      </View>
      <View style={[styles.roleBadge, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.roleText, { color: colors.textSecondary }]}>{member.role.name}</Text>
      </View>
      {!isOwner && onChangeRole && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onChangeRole(member)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
  },
  subtext: {
    fontSize: 13,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  menuButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
