import { useState, useCallback, useMemo } from "react";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { GlassSurface } from "@/components/glass/glass-surface";
import { ActionSheet } from "@/components/ui/action-sheet";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { TeamMemberRow } from "@/components/team/team-member-row";
import { PendingInvitationRow } from "@/components/team/pending-invitation-row";
import { RoleCard } from "@/components/team/role-card";
import { InviteModal } from "@/components/team/invite-modal";
import { ChangeRoleModal } from "@/components/team/change-role-modal";
import { CreateRoleModal } from "@/components/team/create-role-modal";
import { EditPermissionsModal } from "@/components/team/edit-permissions-modal";
import {
  useTeamMembers,
  useTeamRoles,
  useTeamInvitations,
  useTeamStats,
  useUpdateMemberRole,
  useRemoveTeamMember,
  useCreateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  useCancelInvitation,
  useEventPermissions,
} from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import type {
  TeamMemberResponseDto,
  RoleResponseDto,
  RolePermissions,
} from "@/lib/types/team.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;

  const { canInviteTeam, canManageTeam, canRemoveTeam } =
    useEventPermissions(eventId);

  const membersQuery = useTeamMembers(eventId);
  const rolesQuery = useTeamRoles(eventId);
  const invitationsQuery = useTeamInvitations(eventId);
  const statsQuery = useTeamStats(eventId);

  const members = membersQuery.data?.members ?? [];
  const roles = rolesQuery.data ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];
  const stats = statsQuery.data;

  const updateMemberRole = useUpdateMemberRole(eventId);
  const removeMember = useRemoveTeamMember(eventId);
  const createRole = useCreateRole(eventId);
  const deleteRole = useDeleteRole(eventId);
  const updatePermissions = useUpdateRolePermissions(eventId);
  const cancelInvitation = useCancelInvitation(eventId);

  const [activeSection, setActiveSection] = useState<'members' | 'invites' | 'roles'>('members');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [changeRoleMember, setChangeRoleMember] =
    useState<TeamMemberResponseDto | null>(null);
  const [createRoleModalVisible, setCreateRoleModalVisible] = useState(false);
  const [editPermissionsRole, setEditPermissionsRole] =
    useState<RoleResponseDto | null>(null);
  const [actionSheetMember, setActionSheetMember] =
    useState<TeamMemberResponseDto | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] =
    useState<TeamMemberResponseDto | null>(null);
  const [confirmDeleteRole, setConfirmDeleteRole] =
    useState<RoleResponseDto | null>(null);
  const [confirmCancelInvitation, setConfirmCancelInvitation] = useState<
    number | null
  >(null);

  const roleNameMap = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [roles]);

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([
        membersQuery.refetch(),
        rolesQuery.refetch(),
        invitationsQuery.refetch(),
        statsQuery.refetch(),
      ]);
    },
  });

  const handleMemberAction = useCallback((member: TeamMemberResponseDto) => {
    setActionSheetMember(member);
  }, []);

  const handleChangeRole = useCallback(
    (roleId: number) => {
      if (!changeRoleMember) return;
      updateMemberRole.mutate(
        { memberId: changeRoleMember.id, data: { roleId } },
        { onSuccess: () => setChangeRoleMember(null) },
      );
    },
    [changeRoleMember, updateMemberRole],
  );

  const handleCreateRole = useCallback(
    (data: Parameters<typeof createRole.mutate>[0]) => {
      createRole.mutate(data, {
        onSuccess: () => setCreateRoleModalVisible(false),
      });
    },
    [createRole],
  );

  const handleDeleteRole = useCallback((role: RoleResponseDto) => {
    setConfirmDeleteRole(role);
  }, []);

  const handleSavePermissions = useCallback(
    (roleId: number, permissions: RolePermissions) => {
      updatePermissions.mutate(
        { roleId, data: { permissions } },
        { onSuccess: () => setEditPermissionsRole(null) },
      );
    },
    [updatePermissions],
  );

  const handleCancelInvitation = useCallback((invitationId: number) => {
    setConfirmCancelInvitation(invitationId);
  }, []);

  const isLoading = membersQuery.isLoading || rolesQuery.isLoading;

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {(['members', 'invites', 'roles'] as const).map((section) => {
          const isActive = activeSection === section;
          const label = section === 'members' ? 'Members' : section === 'invites' ? 'Invites' : 'Roles';
          return (
            <Pressable
              key={section}
              style={styles.pillFilter}
              onPress={() => setActiveSection(section)}
            >
              <View style={styles.pillGlassLayer} pointerEvents="none">
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                  borderRadius={19}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Team Members Section */}
          {activeSection === 'members' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {members.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.emptyText, { color: colors.textTertiary }]}
                >
                  No team members yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textTertiary }]}
                >
                  Invite people to help manage your event
                </Text>
                {canInviteTeam() && (
                  <TouchableOpacity
                    style={[styles.emptyCta, { overflow: 'hidden' }]}
                    onPress={() => setInviteModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      color={colors.text}
                    />
                    <Text style={[styles.emptyCtaText, { color: colors.text }]}>
                      Invite Member
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.membersList}>
                {members.map((member) => (
                  <TeamMemberRow
                    key={member.id}
                    member={member}
                    isOwner={member.isOwner || member.role.name === "Owner"}
                    onChangeRole={
                      canManageTeam() || canRemoveTeam()
                        ? handleMemberAction
                        : undefined
                    }
                    onRemove={
                      canManageTeam() || canRemoveTeam()
                        ? handleMemberAction
                        : undefined
                    }
                  />
                ))}
              </View>
            )}
            {canInviteTeam() && (
              <TouchableOpacity
                style={[styles.addMemberButton, { overflow: 'hidden' }]}
                onPress={() => setInviteModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-add-outline" size={18} color="#000" />
                <Text style={[styles.addMemberButtonText, { color: '#000' }]}>Add Team Member</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          )}

          {/* Pending Invitations Section */}
          {activeSection === 'invites' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {invitations.length > 0 ? (
                <View style={styles.membersList}>
                  {invitations.map((inv) => (
                    <PendingInvitationRow
                      key={inv.id}
                      invitation={inv}
                      roleName={roleNameMap.get(inv.roleId)}
                      onCancel={
                        canInviteTeam() ? handleCancelInvitation : undefined
                      }
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptySection}>
                  <Ionicons name="mail-outline" size={32} color="rgba(0,0,0,0.25)" />
                  <Text style={styles.emptyText}>No pending invitations</Text>
                </View>
              )}
              {canInviteTeam() && (
                <TouchableOpacity
                  style={[styles.addMemberButton, { overflow: 'hidden' }]}
                  onPress={() => setInviteModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <GlassView {...liquidGlass.fillFaint} borderRadius={14} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="person-add-outline" size={18} color="#000" />
                  <Text style={[styles.addMemberButtonText, { color: '#000' }]}>Invite Member</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {/* Roles & Permissions Section */}
          {activeSection === 'roles' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              {canManageTeam() && (
                <TouchableOpacity
                  style={[styles.addButton, { overflow: 'hidden' }]}
                  onPress={() => setCreateRoleModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <GlassView {...liquidGlass.fillFaint} borderRadius={16} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="add" size={18} color={colors.text} />
                  <Text style={[styles.addButtonText, { color: colors.text }]}>
                    Add Role
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.rolesList}>
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEditPermissions={
                    canManageTeam() ? setEditPermissionsRole : undefined
                  }
                  onDelete={canManageTeam() ? handleDeleteRole : undefined}
                />
              ))}
            </View>
          </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <InviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        roles={roles}
        eventId={eventId}
      />

      <ChangeRoleModal
        visible={!!changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
        roles={roles}
        currentRoleId={changeRoleMember?.role.id ?? 0}
        memberName={
          changeRoleMember
            ? `${changeRoleMember.user.firstName || ""} ${changeRoleMember.user.lastName || ""}`.trim()
            : ""
        }
        onSave={handleChangeRole}
        loading={updateMemberRole.isPending}
      />

      <CreateRoleModal
        visible={createRoleModalVisible}
        onClose={() => setCreateRoleModalVisible(false)}
        onSubmit={handleCreateRole}
        loading={createRole.isPending}
      />

      <EditPermissionsModal
        visible={!!editPermissionsRole}
        onClose={() => setEditPermissionsRole(null)}
        role={editPermissionsRole}
        onSave={handleSavePermissions}
        loading={updatePermissions.isPending}
      />

      {/* Member Action Sheet */}
      <ActionSheet
        visible={!!actionSheetMember}
        title={actionSheetMember?.user.firstName || "Member"}
        options={[
          ...(canManageTeam()
            ? [
                {
                  label: "Change Role",
                  onPress: () => {
                    if (actionSheetMember)
                      setChangeRoleMember(actionSheetMember);
                  },
                },
              ]
            : []),
          ...(canRemoveTeam()
            ? [
                {
                  label: "Remove",
                  destructive: true,
                  onPress: () => {
                    if (actionSheetMember)
                      setConfirmRemoveMember(actionSheetMember);
                  },
                },
              ]
            : []),
        ]}
        onClose={() => setActionSheetMember(null)}
      />

      {/* Remove Member Confirmation */}
      <ConfirmSheet
        visible={!!confirmRemoveMember}
        title="Remove Member"
        message={`Remove ${confirmRemoveMember?.user.firstName || "this member"} from the team?`}
        confirmLabel="Remove"
        destructive
        isLoading={removeMember.isPending}
        onConfirm={() => {
          if (confirmRemoveMember) {
            removeMember.mutate(confirmRemoveMember.id, {
              onSettled: () => setConfirmRemoveMember(null),
            });
          }
        }}
        onClose={() => setConfirmRemoveMember(null)}
      />

      {/* Delete Role Confirmation */}
      <ConfirmSheet
        visible={!!confirmDeleteRole}
        title="Delete Role"
        message={`Delete "${confirmDeleteRole?.name}"? Members with this role will need to be reassigned.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteRole.isPending}
        onConfirm={() => {
          if (confirmDeleteRole) {
            deleteRole.mutate(confirmDeleteRole.id, {
              onSettled: () => setConfirmDeleteRole(null),
            });
          }
        }}
        onClose={() => setConfirmDeleteRole(null)}
      />

      {/* Cancel Invitation Confirmation */}
      <ConfirmSheet
        visible={!!confirmCancelInvitation}
        title="Cancel Invitation"
        message="Cancel this pending invitation?"
        confirmLabel="Cancel Invite"
        destructive
        isLoading={cancelInvitation.isPending}
        onConfirm={() => {
          if (confirmCancelInvitation) {
            cancelInvitation.mutate(confirmCancelInvitation, {
              onSettled: () => setConfirmCancelInvitation(null),
            });
          }
        }}
        onClose={() => setConfirmCancelInvitation(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 8,
  },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillFilter: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 19,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  pillTextActive: {
    color: 'rgba(0,0,0,0.8)',
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Lato_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Lato_700Bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  section: {
    marginTop: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  membersList: {
    gap: 8,
  },
  rolesList: {
    gap: 10,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  addMemberButtonText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#fff",
  },
});
