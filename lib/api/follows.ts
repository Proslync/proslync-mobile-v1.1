// Followers & Following API

import { apiClient } from './client';
import type { FollowersResponse, FollowingResponse, MutualFollowersResponse } from '../types/follows.types';

export interface ContactMatch {
  id: number;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phoneNumber: string;
}

export async function getUserFollowers(userId: number): Promise<FollowersResponse> {
  return apiClient.get<FollowersResponse>(`/api/users/${userId}/followers`);
}

export async function getUserFollowing(userId: number): Promise<FollowingResponse> {
  return apiClient.get<FollowingResponse>(`/api/users/${userId}/following`);
}

export async function followUser(userId: number): Promise<void> {
  return apiClient.post(`/api/users/${userId}/follow`);
}

export async function unfollowUser(userId: number): Promise<void> {
  return apiClient.delete(`/api/users/${userId}/follow`);
}

export async function getMutualFollowers(userId: number): Promise<MutualFollowersResponse> {
  return apiClient.get<MutualFollowersResponse>(`/api/users/${userId}/mutual-followers`);
}

export async function findContactsOnStatus(phoneNumbers: string[]): Promise<ContactMatch[]> {
  return apiClient.post<ContactMatch[]>('/api/users/find-by-phones', { phoneNumbers });
}

export const followsApi = {
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
  getMutualFollowers,
  findContactsOnStatus,
};
