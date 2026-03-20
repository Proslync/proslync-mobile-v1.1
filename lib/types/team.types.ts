export interface RolePermissions {
  events: {
    view: boolean;
    edit: boolean;
    create: boolean;
    delete: boolean;
  };
  attendees: {
    view: boolean;
    edit: boolean;
    checkIn: boolean;
    delete: boolean;
  };
  marketing: {
    view: boolean;
    send: boolean;
    manage: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
  };
  team: {
    view: boolean;
    invite: boolean;
    manage: boolean;
    remove: boolean;
  };
  billing: {
    view: boolean;
    edit: boolean;
  };
  bar: {
    view: boolean;
    serve: boolean;
    manage: boolean;
  };
}

export interface RoleResponseDto {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  isDefault: boolean;
  permissions: RolePermissions;
  canDelete: boolean;
  canEdit: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: RolePermissions;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface UpdateRolePermissionsRequest {
  permissions: RolePermissions;
}

export interface TeamMemberUser {
  id: number;
  firstName: string;
  lastName: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface TeamMemberResponseDto {
  id: number;
  eventId: number;
  userId: number;
  role: RoleResponseDto;
  user: TeamMemberUser;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetTeamMembersResponse {
  members: TeamMemberResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateMemberRoleRequest {
  roleId: number;
}

export interface GenerateInviteLinkRequest {
  roleId: number;
}

export interface GenerateInviteLinkResponse {
  inviteLink: string;
  token: string;
  invitationId: number;
  expiresAt: string;
  roleId: number;
  roleName?: string;
}

export interface InvitationResponseDto {
  id: number;
  eventId: number;
  phoneNumber?: string;
  roleId: number;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface GetInvitationsResponse {
  invitations: InvitationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamStatsResponse {
  totalMembers: number;
  totalInvitations: number;
  pendingInvitations: number;
  membersByRole: Array<{
    roleId: number;
    roleName: string;
    count: number;
  }>;
}

export interface InviteByUserIdRequest {
  userId: number;
  roleId: number;
}

export interface MyTeamInvitation {
  id: number;
  eventId: number;
  eventName: string;
  eventFlyer?: string | null;
  roleId: number;
  roleName: string;
  invitedByUserId: number;
  invitedByName: string;
  invitedByAvatar?: string | null;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expiresAt: string;
  createdAt: string;
}
