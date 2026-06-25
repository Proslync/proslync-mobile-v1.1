// Pickem section — REMOVED (charter FAN CUT LIST).
// This was a Fan Score leaderboard + performance-contingent prediction game
// ("Does Kiyan score 20+ tonight?" with a points pot). Both are charter cuts:
// "spend leaderboards (whale toxicity)" + "ANYTHING performance-contingent
// (win bonuses/predictions = pay-for-play); fans buy content + perks, never
// outcomes." The component is not mounted anywhere (explore-view renders only
// FollowingFeed / GamesRail / DiscoveryBlock), but the barrel still re-exports
// the symbol, so this is kept as an inert stub rather than deleted.

import * as React from 'react';

interface PickemSectionProps {
  bottomInset?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PickemSection(_props: PickemSectionProps) {
  return null;
}
