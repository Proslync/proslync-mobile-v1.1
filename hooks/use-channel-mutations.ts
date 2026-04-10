import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  channelsApi,
  type ChannelResponse,
  type ChannelPostResponse,
  type CreateChannelDto,
  type UpdateChannelDto,
  type CreateChannelPostDto,
  type ChannelMemberRole,
} from '@/lib/api/channels';
import {
  MY_CHANNELS_KEY,
  CHANNEL_KEY,
  CHANNEL_POSTS_KEY,
  CHANNEL_MEMBERS_KEY,
  CHANNEL_DISCOVER_KEY,
} from './use-channels';

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation<ChannelResponse, Error, CreateChannelDto>({
    mutationFn: (data) => channelsApi.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
    },
  });
}

export function useUpdateChannel(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<ChannelResponse, Error, UpdateChannelDto>({
    mutationFn: (data) => channelsApi.updateChannel(channelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (channelId) => channelsApi.deleteChannel(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
      queryClient.removeQueries({ queryKey: [CHANNEL_KEY, channelId] });
      queryClient.removeQueries({ queryKey: [CHANNEL_POSTS_KEY, channelId] });
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (channelId) => channelsApi.joinChannel(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_DISCOVER_KEY] });
    },
  });
}

export function useLeaveChannel() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (channelId) => channelsApi.leaveChannel(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
    },
  });
}

export function useRemoveChannelMember(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (userId) => channelsApi.removeMember(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_MEMBERS_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
    },
  });
}

export function useAddChannelMember(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, number>({
    mutationFn: (userId) => channelsApi.addMember(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_MEMBERS_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
    },
  });
}

export function useUpdateChannelMemberRole(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { userId: number; role: ChannelMemberRole }>({
    mutationFn: ({ userId, role }) => channelsApi.updateMemberRole(channelId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_MEMBERS_KEY, channelId] });
    },
  });
}

export function useCreateChannelPost(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<ChannelPostResponse, Error, CreateChannelPostDto>({
    mutationFn: (data) => channelsApi.createPost(channelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_POSTS_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [CHANNEL_KEY, channelId] });
      queryClient.invalidateQueries({ queryKey: [MY_CHANNELS_KEY] });
    },
  });
}

export function useDeleteChannelPost(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (postId) => channelsApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_POSTS_KEY, channelId] });
    },
  });
}

export function useSetChannelReaction(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<ChannelPostResponse, Error, { postId: number; emoji: string }>({
    mutationFn: ({ postId, emoji }) => channelsApi.setReaction(postId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_POSTS_KEY, channelId] });
    },
  });
}

export function useRemoveChannelReaction(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation<ChannelPostResponse, Error, number>({
    mutationFn: (postId) => channelsApi.removeReaction(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHANNEL_POSTS_KEY, channelId] });
    },
  });
}
