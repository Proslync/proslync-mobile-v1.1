import { apiClient } from './client';
import type { Organization } from '../types/auth.types';

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  logoId?: string;
}

export interface OrganizationResponse extends Organization {
  description?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  status?: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export const organizationsApi = {
  createOrganization: async (data: CreateOrganizationDto): Promise<OrganizationResponse> => {
    return apiClient.post<OrganizationResponse>('/api/organizations', data);
  },

  getMyOrganizations: async (): Promise<OrganizationResponse[]> => {
    return apiClient.get<OrganizationResponse[]>('/api/organizations/my');
  },

  getOrganization: async (id: number): Promise<OrganizationResponse> => {
    return apiClient.get<OrganizationResponse>(`/api/organizations/${id}`);
  },
};
