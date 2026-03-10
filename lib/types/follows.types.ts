// Followers & Following API Types

export interface UserFollowItem {
  id: number;
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  followedAt: string; // ISO 8601 date string
}

export interface VenueFollowItem {
  id: number;
  name: string;
  logoUrl?: string | null;
  followedAt: string; // ISO 8601 date string
}

export interface FollowersResponse {
  userFollowers: UserFollowItem[];
  venueFollowers: VenueFollowItem[];
  totalFollowers: number;
}

export interface MutualFollower {
  id: number;
  userName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface MutualFollowersResponse {
  users: MutualFollower[];
  totalCount: number;
}

export interface FollowingResponse {
  followingUsers: UserFollowItem[];
  followingVenues: VenueFollowItem[];
  totalFollowing: number;
}
