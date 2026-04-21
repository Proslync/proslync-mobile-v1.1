import { GlassSurface } from '@/components/glass/glass-surface';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { RoleResponseDto, RolePermissions } from '@/lib/types/team.types';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoleCardProps {
  role: RoleResponseDto;
  onEditPermissions?: (role: RoleResponseDto) => void;
  onDelete?: (role: RoleResponseDto) => void;
}

function countPermissions(permissions: RolePermissions): number {
  let count = 0;
  for (const category of Object.values(permissions)) {
    for (const val of Object.values(category)) {
      if (val) count++;
    }
  }
  return count;
}

export function RoleCard({ role, onEditPermissions, onDelete }: RoleCardProps) {
  const { colors } = useAppTheme();
  const permCount = countPermissions(role.permissions);

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {role.name}
          </Text>
          {role.isSystem && (
            <View style={[styles.systemBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.systemText, { color: colors.textTertiary }]}>SYSTEM</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {role.canEdit && onEditPermissions && (
            <TouchableOpacity
              onPress={() => onEditPermissions(role)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {role.canDelete && onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(role)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {role.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {role.description}
        </Text>
      ) : null}
      <Text style={[styles.permCount, { color: colors.textTertiary }]}>
        {permCount} permission{permCount !== 1 ? 's' : ''} enabled
      </Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 15,
    flexShrink: 1,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
  },
  permCount: {
    fontSize: 12,
  },
});
