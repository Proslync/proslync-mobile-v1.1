import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { RoleResponseDto } from '@/lib/types/team.types';

interface ChangeRoleModalProps {
  visible: boolean;
  onClose: () => void;
  roles: RoleResponseDto[];
  currentRoleId: number;
  memberName: string;
  onSave: (roleId: number) => void;
  loading?: boolean;
}

export function ChangeRoleModal({
  visible,
  onClose,
  roles,
  currentRoleId,
  memberName,
  onSave,
  loading,
}: ChangeRoleModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);

  useEffect(() => {
    if (visible) {
      setSelectedRoleId(currentRoleId);
    }
  }, [visible, currentRoleId]);

  const assignableRoles = roles.filter((r) => r.name !== 'Owner');
  const hasChanged = selectedRoleId !== currentRoleId;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Role</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{memberName}</Text>

        <ScrollView style={styles.content}>
          {assignableRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelectedRoleId(role.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.roleRow, isSelected && styles.roleRowSelected]}>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>{role.name}</Text>
                    {role.description ? (
                      <Text style={styles.roleDescription} numberOfLines={1}>
                        {role.description}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, !hasChanged && styles.submitDisabled]}
            onPress={() => onSave(selectedRoleId)}
            disabled={!hasChanged || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  subtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  roleRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  roleInfo: { flex: 1 },
  roleName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  roleDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
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
