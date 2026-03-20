import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import type { RolePermissions } from '@/lib/types/team.types';

export const EVENT_PERMISSIONS_KEY = 'event-permissions';

function useGetEventPermissions(eventId: number | undefined) {
  return useQuery({
    queryKey: [EVENT_PERMISSIONS_KEY, eventId],
    queryFn: () => eventsApi.getEventPermissions(eventId!),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useEventPermissions(eventId: number | undefined) {
  const { data, isLoading, error } = useGetEventPermissions(eventId);

  const hasPermission = (
    resource: keyof RolePermissions,
    action: string,
  ): boolean => {
    if (!data) return false;
    if (data.isOwner) return true;

    const resourcePermissions = data.permissions[resource];
    if (!resourcePermissions) return false;

    return (resourcePermissions as Record<string, boolean>)[action] === true;
  };

  // Events
  const canViewEvents = () => hasPermission('events', 'view');
  const canEditEvents = () => hasPermission('events', 'edit');
  const canCreateEvents = () => hasPermission('events', 'create');
  const canDeleteEvents = () => hasPermission('events', 'delete');

  // Attendees
  const canViewAttendees = () => hasPermission('attendees', 'view');
  const canEditAttendees = () => hasPermission('attendees', 'edit');
  const canCheckInAttendees = () => hasPermission('attendees', 'checkIn');
  const canDeleteAttendees = () => hasPermission('attendees', 'delete');

  // Marketing
  const canViewMarketing = () => hasPermission('marketing', 'view');
  const canSendMarketing = () => hasPermission('marketing', 'send');
  const canManageMarketing = () => hasPermission('marketing', 'manage');

  // Analytics
  const canViewAnalytics = () => hasPermission('analytics', 'view');
  const canExportAnalytics = () => hasPermission('analytics', 'export');

  // Team
  const canViewTeam = () => hasPermission('team', 'view');
  const canInviteTeam = () => hasPermission('team', 'invite');
  const canManageTeam = () => hasPermission('team', 'manage');
  const canRemoveTeam = () => hasPermission('team', 'remove');

  // Billing
  const canViewBilling = () => hasPermission('billing', 'view');
  const canEditBilling = () => hasPermission('billing', 'edit');

  // Bar
  const canViewBar = () => hasPermission('bar', 'view');
  const canServeBar = () => hasPermission('bar', 'serve');
  const canManageBar = () => hasPermission('bar', 'manage');

  return {
    isLoading,
    error,
    isOwner: data?.isOwner ?? false,
    permissions: data?.permissions,
    hasPermission,
    canViewEvents,
    canEditEvents,
    canCreateEvents,
    canDeleteEvents,
    canViewAttendees,
    canEditAttendees,
    canCheckInAttendees,
    canDeleteAttendees,
    canViewMarketing,
    canSendMarketing,
    canManageMarketing,
    canViewAnalytics,
    canExportAnalytics,
    canViewTeam,
    canInviteTeam,
    canManageTeam,
    canRemoveTeam,
    canViewBilling,
    canEditBilling,
    canViewBar,
    canServeBar,
    canManageBar,
  };
}
