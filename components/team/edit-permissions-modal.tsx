import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RolePermissions, RoleResponseDto } from '@/lib/types/team.types';

interface EditPermissionsModalProps {
  visible: boolean;
  onClose: () => void;
  role: RoleResponseDto | null;
  onSave: (roleId: number, permissions: RolePermissions) => void;
  loading?: boolean;
}

type PermissionCategory = keyof RolePermissions;

const CATEGORIES: {
  key: PermissionCategory;
  label: string;
  permissions: { key: string; label: string }[];
}[] = [
  {
    key: 'events',
    label: 'Events',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
      { key: 'create', label: 'Create' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'attendees',
    label: 'Attendees',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'send', label: 'Send' },
      { key: 'manage', label: 'Manage' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'export', label: 'Export' },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'invite', label: 'Invite' },
      { key: 'manage', label: 'Manage' },
      { key: 'remove', label: 'Remove' },
    ],
  },
  {
    key: 'billing',
    label: 'Billing',
    permissions: [
      { key: 'view', label: 'View' },
      { key: 'edit', label: 'Edit' },
    ],
  },
];

function deepClonePermissions(p: RolePermissions): RolePermissions {
  return JSON.parse(JSON.stringify(p));
}

function countEnabled(perms: Record<string, boolean>): number {
  return Object.values(perms).filter(Boolean).length;
}

function countAllEnabled(p: RolePermissions): number {
  let c = 0;
  for (const cat of Object.values(p)) {
    for (const v of Object.values(cat)) {
      if (v) c++;
    }
  }
  return c;
}

const TOTAL_PERMISSIONS = 19;

export function EditPermissionsModal({
  visible,
  onClose,
  role,
  onSave,
  loading,
}: EditPermissionsModalProps) {
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);

  useEffect(() => {
    if (visible && role) {
      setPermissions(deepClonePermissions(role.permissions));
    }
  }, [visible, role]);

  const togglePermission = useCallback(
    (category: PermissionCategory, key: string) => {
      setPermissions((prev) => {
        if (!prev) return prev;
        const updated = deepClonePermissions(prev);
        const cat = updated[category] as Record<string, boolean>;
        cat[key] = !cat[key];
        return updated;
      });
    },
    [],
  );

  const toggleAll = useCallback((enable: boolean) => {
    setPermissions((prev) => {
      if (!prev) return prev;
      const updated = deepClonePermissions(prev);
      for (const cat of Object.values(updated)) {
        for (const key of Object.keys(cat)) {
          (cat as Record<string, boolean>)[key] = enable;
        }
      }
      return updated;
    });
  }, []);

  if (!role || !permissions) return null;

  const allEnabled = countAllEnabled(permissions);
  const allSelected = allEnabled === TOTAL_PERMISSIONS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Edit Permissions</Text>
            <Text style={styles.roleName}>{role.name}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleAllRow}>
          <Text style={styles.toggleAllText}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
          <Switch
            value={allSelected}
            onValueChange={(val) => toggleAll(val)}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,255,255,0.4)' }}
            thumbColor="#fff"
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((cat) => {
            const catPerms = permissions[cat.key] as Record<string, boolean>;
            const enabled = countEnabled(catPerms);
            const total = cat.permissions.length;

            return (
              <View key={cat.key} style={styles.category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryCount}>
                    {enabled}/{total}
                  </Text>
                </View>
                {cat.permissions.map((perm) => (
                  <View key={perm.key} style={styles.permRow}>
                    <Text style={styles.permLabel}>{perm.label}</Text>
                    <Switch
                      value={catPerms[perm.key]}
                      onValueChange={() => togglePermission(cat.key, perm.key)}
                      trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(255,255,255,0.4)' }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => onSave(role.id, permissions)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : 'Save Permissions'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  headerLeft: { flex: 1 },
  title: { fontSize: 18, fontFamily: 'Lato_700Bold', color: '#fff' },
  roleName: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#fff' },
  toggleAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  toggleAllText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  category: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  categoryCount: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 4,
  },
  permLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  submitButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
});
