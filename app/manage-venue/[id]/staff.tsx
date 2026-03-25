import { GlassButton } from "@/components/glass/glass-button";
import { GlassSurface } from "@/components/glass/glass-surface";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { NativeSheet } from "@/components/ui/native-sheet";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { useStableRouter } from "@/hooks/use-stable-router";
import {
  useAddVenueStaff,
  useRemoveVenueStaff,
  useUpdateVenueStaff,
  useVenueStaff,
} from "@/hooks/use-venue-schedule";
import type { VenueStaffMember } from "@/lib/api/venue-schedule";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", desc: "Full venue management access" },
  { value: "host", label: "Host", desc: "Greet guests, manage reservations" },
  {
    value: "bouncer",
    label: "Bouncer",
    desc: "Door security and ID checking",
  },
  { value: "user", label: "Staff", desc: "General venue staff" },
];

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "owner":
      return "#f59e0b";
    case "admin":
      return "#ef4444";
    case "host":
      return "#3b82f6";
    case "bouncer":
      return "#22c55e";
    default:
      return "rgba(255,255,255,0.3)";
  }
}

export default function VenueStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const venueId = id ? Number(id) : 0;
  const { data: staff = [], isLoading, refetch } = useVenueStaff(venueId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });
  const addStaff = useAddVenueStaff(venueId);
  const updateStaff = useUpdateVenueStaff(venueId);
  const removeStaff = useRemoveVenueStaff(venueId);

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueStaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VenueStaffMember | null>(
    null,
  );

  // Add form
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Edit form
  const [editRole, setEditRole] = useState("");

  const handleAdd = useCallback(async () => {
    const uid = parseInt(newUserId, 10);
    if (!uid) return;
    await addStaff.mutateAsync({ userId: uid, role: newRole });
    setShowAddSheet(false);
    setNewUserId("");
    setNewRole("user");
  }, [newUserId, newRole, addStaff]);

  const handleEdit = useCallback(async (member: VenueStaffMember) => {
    setEditTarget(member);
    setEditRole(member.role);
    setShowEditSheet(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editTarget) return;
    await updateStaff.mutateAsync({
      staffId: editTarget.id,
      data: { role: editRole },
    });
    setShowEditSheet(false);
    setEditTarget(null);
  }, [editTarget, editRole, updateStaff]);

  const handleRemove = useCallback(async () => {
    if (!deleteTarget) return;
    await removeStaff.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, removeStaff]);

  const getDisplayName = (member: VenueStaffMember) => {
    if (member.user?.userName) return `@${member.user.userName}`;
    return (
      [member.user?.firstName, member.user?.lastName]
        .filter(Boolean)
        .join(" ") || "Unknown"
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Team</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {staff.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Team Members Yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Add team members to manage this venue
            </Text>
          </View>
        ) : (
          staff.map((member, index) => (
            <Animated.View
              key={member.id}
              entering={FadeInDown.delay(index * 50).duration(200)}
            >
              <GlassSurface style={styles.staffCard}>
                <TouchableOpacity
                  style={styles.staffRow}
                  onPress={() => handleEdit(member)}
                  activeOpacity={0.6}
                >
                  {member.user?.avatar?.url ? (
                    <Image
                      source={{ uri: member.user.avatar.url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <GlassView
                        {...liquidGlass.fill}
                        borderRadius={22}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Ionicons
                        name="person"
                        size={20}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <View style={styles.staffInfo}>
                    <Text
                      style={[styles.staffName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {getDisplayName(member)}
                    </Text>
                    <View style={styles.roleRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: getRoleBadgeColor(member.role),
                          },
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statusText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {member.status}
                      </Text>
                    </View>
                  </View>
                  {member.role !== "owner" && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setDeleteTarget(member)}
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={22}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </GlassSurface>
            </Animated.View>
          ))
        )}

        {/* Add Staff Button */}
        <GlassButton
          label="Add Team Member"
          variant="glass"
          icon="person-add-outline"
          onPress={() => setShowAddSheet(true)}
          style={styles.addButton}
        />
      </ScrollView>

      {/* Add Staff Sheet */}
      <NativeSheet
        rnContent
        scrollable
        isPresented={showAddSheet}
        onDismiss={() => setShowAddSheet(false)}
        detents={[{ fraction: 0.7 }, "large"]}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Add Team Member
          </Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            User ID
          </Text>
          <View style={styles.inputWrapper}>
            {isDark && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={10}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark
                    ? undefined
                    : colors.backgroundSecondary,
                },
              ]}
              value={newUserId}
              onChangeText={setNewUserId}
              placeholder="Enter user ID"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Role
          </Text>
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = newRole === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.roleOption,
                    isActive && styles.roleOptionSelected,
                  ]}
                  onPress={() => setNewRole(opt.value)}
                >
                  <GlassView
                    {...(isActive ? liquidGlass.fill : liquidGlass.fillFaint)}
                    borderRadius={10}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text
                    style={[
                      styles.roleOptionLabel,
                      isActive && styles.roleOptionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <GlassButton
            label={addStaff.isPending ? "Adding..." : "Add Member"}
            variant="glass"
            onPress={handleAdd}
            disabled={!newUserId || addStaff.isPending}
            style={styles.sheetButton}
          />
        </View>
      </NativeSheet>

      {/* Edit Role Sheet */}
      <NativeSheet
        rnContent
        scrollable
        isPresented={showEditSheet}
        onDismiss={() => setShowEditSheet(false)}
        detents={[{ fraction: 0.6 }, "large"]}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {editTarget ? `Edit ${getDisplayName(editTarget)}` : "Edit Member"}
          </Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Role
          </Text>
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map((opt) => {
              const isActive = editRole === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.roleOption,
                    isActive && styles.roleOptionSelected,
                  ]}
                  onPress={() => setEditRole(opt.value)}
                >
                  <GlassView
                    {...(isActive ? liquidGlass.fill : liquidGlass.fillFaint)}
                    borderRadius={10}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text
                    style={[
                      styles.roleOptionLabel,
                      isActive && styles.roleOptionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <GlassButton
            label={updateStaff.isPending ? "Saving..." : "Save Changes"}
            variant="glass"
            onPress={handleSaveEdit}
            disabled={updateStaff.isPending}
            style={styles.sheetButton}
          />
        </View>
      </NativeSheet>

      {/* Delete Confirmation */}
      <ConfirmSheet
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemove}
        title="Remove Team Member"
        message={`Remove ${deleteTarget ? getDisplayName(deleteTarget) : ""} from this venue?`}
        confirmLabel="Remove"
        destructive
        icon="person-remove-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Lato_700Bold" },
  scrollContent: { paddingHorizontal: 16, gap: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 20, fontFamily: "Lato_700Bold" },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
  staffCard: { borderRadius: 12, overflow: "hidden" },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  staffInfo: { flex: 1, gap: 4 },
  staffName: { fontSize: 15, fontFamily: "Lato_700Bold" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText: { fontSize: 11, fontFamily: "Lato_700Bold", color: "#fff" },
  statusText: { fontSize: 12, fontFamily: "Lato_400Regular" },
  removeButton: { padding: 4 },
  addButton: { marginTop: 8 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
    textAlign: "center",
    paddingTop: 20,
    marginBottom: 4,
  },
  inputLabel: { fontSize: 13, fontFamily: "Lato_700Bold" },
  inputWrapper: {
    overflow: "hidden" as const,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  roleGrid: { gap: 8 },
  roleOption: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: 12,
    overflow: "hidden",
  },
  roleOptionSelected: {
    borderColor: "rgba(255,255,255,0.4)",
  },
  roleOptionLabel: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "rgba(255,255,255,0.7)",
  },
  roleOptionLabelSelected: { color: "#fff" },
  roleOptionDesc: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  sheetButton: { marginTop: 8 },
});
