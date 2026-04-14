import { GlassButton } from "@/components/glass/glass-button";
import { GlassSurface } from "@/components/glass/glass-surface";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { NativeSheet } from "@/components/ui/native-sheet";
import { InviteModal } from "@/components/team/invite-modal";
import type { InviteRole } from "@/components/team/invite-modal";
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
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VENUE_ROLES: InviteRole[] = [
  { id: "admin", name: "Admin" },
  { id: "host", name: "Host" },
  { id: "bouncer", name: "Bouncer" },
  { id: "bartender", name: "Bartender" },
  { id: "user", name: "Staff" },
];

const EDIT_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "host", label: "Host" },
  { value: "bouncer", label: "Bouncer" },
  { value: "bartender", label: "Bartender" },
  { value: "user", label: "Staff" },
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
      return "rgba(0,0,0,0.08)";
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

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueStaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VenueStaffMember | null>(
    null,
  );

  // Edit form
  const [editRole, setEditRole] = useState("");

  const handleInvite = useCallback(
    async (userId: number, roleId: number | string) => {
      await addStaff.mutateAsync({ userId, role: String(roleId) });
      setShowInviteModal(false);
    },
    [addStaff],
  );

  const handleEdit = useCallback(async (member: VenueStaffMember) => {
    setEditTarget(member);
    setEditRole(typeof member.role === 'string' ? member.role : 'member');
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
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.pillIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        <View style={styles.pillLabel}>
          {isLiquidGlassSupported ? (
            <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          ) : (
            <GlassView {...liquidGlass.surface} tintColor="rgba(0,0,0,0.12)" borderRadius={19} style={StyleSheet.absoluteFill} />
          )}
          <Text style={styles.pillLabelText}>Team</Text>
        </View>
      </View>

      <LinearGradient colors={['#f2f2f2', 'rgba(242,242,242,0)']} style={styles.topFade} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 },
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
                            backgroundColor: getRoleBadgeColor(typeof member.role === 'string' ? member.role : (member.role as any)?.name || 'staff'),
                          },
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {(() => {
                            const r = typeof member.role === 'string' ? member.role : (member.role as any)?.name || 'staff';
                            return r.charAt(0).toUpperCase() + r.slice(1);
                          })()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statusText,
                          { color: 'rgba(0,0,0,0.4)' },
                        ]}
                      >
                        {member.status}
                      </Text>
                    </View>
                  </View>
                  {(typeof member.role === 'string' ? member.role : '') !== "owner" && (
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

      </ScrollView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => setShowInviteModal(true)}>
        {isLiquidGlassSupported ? (
          <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 28 }]} />
        )}
        <Ionicons name="person-add-outline" size={24} color="#000" />
      </Pressable>

      {/* Add Staff Modal */}
      <InviteModal
        mode="custom"
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roles={VENUE_ROLES}
        title="Add Team Member"
        successTitle="Member Added!"
        onInvite={handleInvite}
      />

      {/* Edit Role Sheet */}
      <NativeSheet
        rnContent
        scrollable
        isPresented={showEditSheet}
        onDismiss={() => setShowEditSheet(false)}
        detents={[{ fraction: 0.55 }]}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {editTarget ? `Edit ${getDisplayName(editTarget)}` : "Edit Member"}
          </Text>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Role
          </Text>
          <View style={styles.roleGrid}>
            {EDIT_ROLE_OPTIONS.map((opt) => {
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
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillLabel: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillLabelText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.8)' },
  headerTitle: { fontSize: 18, fontFamily: "Lato_700Bold" },
  scrollContent: { paddingHorizontal: 16, gap: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 20, fontFamily: "Lato_700Bold" },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
  staffCard: { borderRadius: 14, overflow: "hidden", backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 8 },
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
  roleBadgeText: { fontSize: 11, fontFamily: "Lato_700Bold", color: "rgba(0,0,0,0.6)" },
  statusText: { fontSize: 12, fontFamily: "Lato_400Regular" },
  removeButton: { padding: 4 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
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
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: 12,
    overflow: "hidden",
  },
  roleOptionSelected: {
    borderColor: "rgba(0,0,0,0.3)",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  roleOptionLabel: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "rgba(0,0,0,0.7)",
  },
  roleOptionLabelSelected: { color: "#000" },
  roleOptionDesc: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    color: "rgba(0,0,0,0.4)",
    marginTop: 2,
  },
  sheetButton: { marginTop: 8 },
});
