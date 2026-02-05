// Followers & Following API

import { apiClient } from './client';
import type { FollowersResponse, FollowingResponse } from '../types/follows.types';

/**
 * Get list of users that follow the specified user
 */
export async function getUserFollowers(userId: number): Promise<FollowersResponse> {
  return apiClient.get<FollowersResponse>(`/api/users/${userId}/followers`);
}

/**
 * Get list of users and venues that the specified user follows
 */
export async function getUserFollowing(userId: number): Promise<FollowingResponse> {
  return apiClient.get<FollowingResponse>(`/api/users/${userId}/following`);
}

/**
 * Follow a user (syncs with database)
 */
export async function followUser(userId: number): Promise<void> {
  return apiClient.post(`/api/users/${userId}/follow`);
}

/**
 * Unfollow a user (syncs with database)
 */
export async function unfollowUser(userId: number): Promise<void> {
  return apiClient.delete(`/api/users/${userId}/follow`);
}

export const followsApi = {
  getUserFollowers,
  getUserFollowing,
  followUser,
  unfollowUser,
};
