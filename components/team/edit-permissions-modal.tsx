import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { RolePermissions, RoleResponseDto } from "@/lib/types/team.types";

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
  icon: string;
  permissions: { key: string; label: string; description: string }[];
}[] = [
  {
    key: "events",
    label: "Event Details",
    icon: "calendar",
    permissions: [
      {
        key: "view",
        label: "View event info",
        description: "See event details, flyer, and settings",
      },
      {
        key: "edit",
        label: "Edit event info",
        description: "Change name, date, location, flyer",
      },
      {
        key: "create",
        label: "Create events",
        description: "Create new events for this venue",
      },
      {
        key: "delete",
        label: "Delete events",
        description: "Permanently remove events",
      },
    ],
  },
  {
    key: "attendees",
    label: "Guest List",
    icon: "people",
    permissions: [
      {
        key: "view",
        label: "View guest list",
        description: "See who RSVPed and checked in",
      },
      {
        key: "edit",
        label: "Edit guests",
        description: "Add tags, notes, and update guest info",
      },
      {
        key: "checkIn",
        label: "Check in guests",
        description: "Scan IDs and approve entry",
      },
      {
        key: "delete",
        label: "Remove guests",
        description: "Remove people from the guest list",
      },
    ],
  },
  {
    key: "marketing",
    label: "Promotions",
    icon: "megaphone",
    permissions: [
      {
        key: "view",
        label: "View promotions",
        description: "See marketing stats and campaigns",
      },
      {
        key: "send",
        label: "Send blasts",
        description: "Send text blasts to guests",
      },
      {
        key: "manage",
        label: "Manage campaigns",
        description: "Create and edit promo campaigns",
      },
    ],
  },
  {
    key: "analytics",
    label: "Insights",
    icon: "stats-chart",
    permissions: [
      {
        key: "view",
        label: "View insights",
        description: "See event analytics and trends",
      },
      {
        key: "export",
        label: "Export data",
        description: "Download reports and data files",
      },
    ],
  },
  {
    key: "team",
    label: "Team",
    icon: "people-circle",
    permissions: [
      {
        key: "view",
        label: "View team",
        description: "See team members and roles",
      },
      {
        key: "invite",
        label: "Invite people",
        description: "Send team invitations",
      },
      {
        key: "manage",
        label: "Manage roles",
        description: "Create roles and change permissions",
      },
      {
        key: "remove",
        label: "Remove members",
        description: "Remove people from the team",
      },
    ],
  },
  {
    key: "billing",
    label: "Money",
    icon: "card",
    permissions: [
      {
        key: "view",
        label: "View earnings",
        description: "See revenue, payments, and payouts",
      },
      {
        key: "edit",
        label: "Manage payments",
        description: "Set pricing, process refunds",
      },
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
  const { colors } = useAppTheme();
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
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
            {allSelected ? "Deselect All" : "Select All"}
          </Text>
          <Switch
            value={allSelected}
            onValueChange={(val) => toggleAll(val)}
            trackColor={{
              false: "rgba(255,255,255,0.15)",
              true: "rgba(255,255,255,0.4)",
            }}
            thumbColor="#fff"
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
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
                    <View style={styles.permInfo}>
                      <Text style={styles.permLabel}>{perm.label}</Text>
                      <Text style={styles.permDescription}>
                        {perm.description}
                      </Text>
                    </View>
                    <Switch
                      value={catPerms[perm.key]}
                      onValueChange={() => togglePermission(cat.key, perm.key)}
                      trackColor={{
                        false: "rgba(255,255,255,0.15)",
                        true: "rgba(255,255,255,0.4)",
                      }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => onSave(role.id, permissions)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? "Saving..." : "Save Permissions"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 18, fontFamily: "Lato_700Bold", color: "#fff" },
  roleName: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 16, color: "#fff" },
  toggleAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  toggleAllText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "rgba(255,255,255,0.7)",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  category: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
  categoryCount: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 4,
  },
  permInfo: {
    flex: 1,
    marginRight: 12,
  },
  permLabel: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  permDescription: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  footer: {
    padding: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  submitButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { fontSize: 16, fontFamily: "Lato_700Bold", color: "#fff" },
});
