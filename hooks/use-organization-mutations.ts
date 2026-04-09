import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, CreateOrganizationDto, OrganizationResponse } from '@/lib/api/organizations';

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<OrganizationResponse, Error, CreateOrganizationDto>({
    mutationFn: (data) => organizationsApi.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
  });
}
