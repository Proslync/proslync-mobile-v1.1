export interface VenueFollower {
  id: number;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  avatarUrl: string | null;
  followedAt: string;
}

export interface VenueFollowersResponse {
  followers: VenueFollower[];
  total: number;
  page: number;
  hasNext: boolean;
}
