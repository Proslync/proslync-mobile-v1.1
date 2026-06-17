export interface LikeState {
  likeCount: number;
  viewerLiked: boolean;
}

export function applyOptimisticLike(
  state: LikeState,
  delta: 1 | -1,
  viewerLiked: boolean,
): LikeState;

export function rollbackOptimisticLike(snapshot: LikeState): LikeState;
