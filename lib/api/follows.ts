// Followers & Following API

import { apiClient } from './client';
import type { FollowersResponse, FollowingResponse } from '../types/follows.types';

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

export const followsApi = {
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
};
